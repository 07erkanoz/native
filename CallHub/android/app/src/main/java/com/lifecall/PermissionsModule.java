package com.lifecall;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * LifeCall - İzin Yönetim Native Modülü
 *
 * Özel Android izinlerini yönetir:
 * - SYSTEM_ALERT_WINDOW (Overlay)
 * - USE_FULL_SCREEN_INTENT
 * - Bildirim izinleri
 */
@ReactModule(name = PermissionsModule.NAME)
public class PermissionsModule extends ReactContextBaseJavaModule {

    public static final String NAME = "PermissionsModule";
    private static final int REQUEST_OVERLAY_PERMISSION = 2001;
    private static final int REQUEST_NOTIFICATION_PERMISSION = 2002;

    private Promise pendingPromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (pendingPromise != null) {
                switch (requestCode) {
                    case REQUEST_OVERLAY_PERMISSION:
                        pendingPromise.resolve(canDrawOverlays());
                        pendingPromise = null;
                        break;
                    case REQUEST_NOTIFICATION_PERMISSION:
                        pendingPromise.resolve(areNotificationsEnabled());
                        pendingPromise = null;
                        break;
                }
            }
        }
    };

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    // ===== OVERLAY İZNİ =====

    /**
     * Overlay (SYSTEM_ALERT_WINDOW) izni var mı kontrol et
     */
    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        promise.resolve(canDrawOverlays());
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getReactApplicationContext());
        }
        return true;
    }

    /**
     * Overlay izni iste
     */
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ERROR", "Activity not found");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(getReactApplicationContext())) {
                    promise.resolve(true);
                    return;
                }

                pendingPromise = promise;
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getReactApplicationContext().getPackageName())
                );
                activity.startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION);
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ===== FULL-SCREEN INTENT İZNİ =====

    /**
     * Full-screen intent izni var mı kontrol et
     */
    @ReactMethod
    public void canUseFullScreenIntent(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ için kontrol
            try {
                NotificationManager notificationManager = (NotificationManager)
                        getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
                if (notificationManager != null) {
                    promise.resolve(notificationManager.canUseFullScreenIntent());
                } else {
                    promise.resolve(true);
                }
            } catch (Exception e) {
                promise.resolve(true);
            }
        } else {
            // Android 13 ve altı için otomatik verilir
            promise.resolve(true);
        }
    }

    /**
     * Full-screen intent izni iste
     */
    @ReactMethod
    public void requestFullScreenIntentPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                Activity activity = getCurrentActivity();
                if (activity == null) {
                    promise.reject("ERROR", "Activity not found");
                    return;
                }

                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
                activity.startActivity(intent);
                promise.resolve(true);
            } catch (Exception e) {
                // Fallback: Bildirim ayarlarına yönlendir
                try {
                    Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(Settings.EXTRA_APP_PACKAGE,
                            getReactApplicationContext().getPackageName());
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getReactApplicationContext().startActivity(intent);
                    promise.resolve(true);
                } catch (Exception ex) {
                    promise.resolve(false);
                }
            }
        } else {
            promise.resolve(true);
        }
    }

    // ===== BİLDİRİM İZİNLERİ =====

    /**
     * Bildirimler aktif mi kontrol et
     */
    @ReactMethod
    public void areNotificationsEnabled(Promise promise) {
        promise.resolve(areNotificationsEnabled());
    }

    private boolean areNotificationsEnabled() {
        try {
            NotificationManager notificationManager = (NotificationManager)
                    getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                return notificationManager.areNotificationsEnabled();
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Bildirim ayarlarını aç
     */
    @ReactMethod
    public void openNotificationSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, getReactApplicationContext().getPackageName());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ===== GENEL AYARLAR =====

    /**
     * Uygulama ayarlarını aç
     */
    @ReactMethod
    public void openAppSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Pil optimizasyonu ayarlarını aç
     */
    @ReactMethod
    public void openBatteryOptimizationSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(intent);
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
