package com.lifecall;

import android.app.Activity;
import android.app.role.RoleManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * LifeCall - Varsayılan Uygulama Native Modülü
 *
 * Android'de varsayılan telefon ve rehber uygulaması olarak kayıt yapar.
 * - RoleManager (Android 10+) veya TelecomManager kullanır
 * - PhoneAccount kaydı yapar
 * - Arama işlemlerini yönetir
 */
@ReactModule(name = DefaultAppModule.NAME)
public class DefaultAppModule extends ReactContextBaseJavaModule {

    public static final String NAME = "DefaultAppModule";

    private static final int REQUEST_DEFAULT_DIALER = 1001;
    private static final int REQUEST_OVERLAY_PERMISSION = 1002;

    private Promise pendingPromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (pendingPromise != null) {
                if (requestCode == REQUEST_DEFAULT_DIALER) {
                    pendingPromise.resolve(resultCode == Activity.RESULT_OK);
                    pendingPromise = null;
                } else if (requestCode == REQUEST_OVERLAY_PERMISSION) {
                    pendingPromise.resolve(canDrawOverlays());
                    pendingPromise = null;
                }
            }
        }
    };

    public DefaultAppModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * Varsayılan arama uygulaması mı kontrol et
     */
    @ReactMethod
    public void isDefaultDialer(Promise promise) {
        try {
            TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                    .getSystemService(Context.TELECOM_SERVICE);

            if (telecomManager != null) {
                String packageName = getReactApplicationContext().getPackageName();
                String defaultDialer = telecomManager.getDefaultDialerPackage();
                promise.resolve(packageName.equals(defaultDialer));
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Varsayılan kişiler uygulaması mı kontrol et
     */
    @ReactMethod
    public void isDefaultContactsApp(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                RoleManager roleManager = (RoleManager) getReactApplicationContext()
                        .getSystemService(Context.ROLE_SERVICE);
                if (roleManager != null) {
                    promise.resolve(roleManager.isRoleHeld(RoleManager.ROLE_DIALER));
                } else {
                    promise.resolve(false);
                }
            } else {
                // Android 9 ve altı için
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Varsayılan arama uygulaması olarak kayıt iste
     */
    @ReactMethod
    public void requestDefaultDialer(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ERROR", "Activity not found");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ için RoleManager kullan
                RoleManager roleManager = (RoleManager) getReactApplicationContext()
                        .getSystemService(Context.ROLE_SERVICE);

                if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_DIALER)) {
                    if (roleManager.isRoleHeld(RoleManager.ROLE_DIALER)) {
                        promise.resolve(true);
                        return;
                    }

                    pendingPromise = promise;
                    Intent intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER);
                    activity.startActivityForResult(intent, REQUEST_DEFAULT_DIALER);
                } else {
                    promise.resolve(false);
                }
            } else {
                // Android 9 ve altı için TelecomManager kullan
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    String packageName = getReactApplicationContext().getPackageName();
                    String defaultDialer = telecomManager.getDefaultDialerPackage();

                    if (packageName.equals(defaultDialer)) {
                        promise.resolve(true);
                        return;
                    }

                    pendingPromise = promise;
                    Intent intent = new Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER);
                    intent.putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName);
                    activity.startActivityForResult(intent, REQUEST_DEFAULT_DIALER);
                } else {
                    promise.resolve(false);
                }
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Varsayılan kişiler uygulaması olarak kayıt iste
     */
    @ReactMethod
    public void requestDefaultContactsApp(Promise promise) {
        // Android'de varsayılan kişiler uygulaması için ayrı bir rol yok
        // Dialer rolü genellikle kişileri de içerir
        requestDefaultDialer(promise);
    }

    /**
     * PhoneAccount'u kaydet
     */
    @ReactMethod
    public void registerPhoneAccount(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    PhoneAccountHandle handle = getPhoneAccountHandle();

                    PhoneAccount.Builder builder = new PhoneAccount.Builder(handle, "LifeCall")
                            .setCapabilities(
                                    PhoneAccount.CAPABILITY_CALL_PROVIDER |
                                    PhoneAccount.CAPABILITY_CONNECTION_MANAGER
                            );

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        builder.setHighlightColor(0xFF6750A4); // Primary color
                    }

                    PhoneAccount phoneAccount = builder.build();
                    telecomManager.registerPhoneAccount(phoneAccount);

                    promise.resolve(true);
                } else {
                    promise.resolve(false);
                }
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * PhoneAccount'u kaldır
     */
    @ReactMethod
    public void unregisterPhoneAccount(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    PhoneAccountHandle handle = getPhoneAccountHandle();
                    telecomManager.unregisterPhoneAccount(handle);
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * PhoneAccount kayıtlı mı kontrol et
     */
    @ReactMethod
    public void isPhoneAccountRegistered(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    PhoneAccountHandle handle = getPhoneAccountHandle();
                    PhoneAccount account = telecomManager.getPhoneAccount(handle);
                    promise.resolve(account != null);
                } else {
                    promise.resolve(false);
                }
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Arama yap
     */
    @ReactMethod
    public void makeCall(String phoneNumber, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + phoneNumber));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Aramayı sonlandır
     */
    @ReactMethod
    public void endCall(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    telecomManager.endCall();
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Aramayı yanıtla
     */
    @ReactMethod
    public void answerCall(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                        .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    telecomManager.acceptRingingCall();
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Aramayı reddet
     */
    @ReactMethod
    public void rejectCall(Promise promise) {
        endCall(promise);
    }

    /**
     * Overlay izni var mı kontrol et
     */
    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        promise.resolve(canDrawOverlays());
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

    /**
     * Full-screen intent izni var mı
     */
    @ReactMethod
    public void canUseFullScreenIntent(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ için kontrol gerekebilir
            promise.resolve(true);
        } else {
            promise.resolve(true);
        }
    }

    /**
     * Full-screen intent izni iste
     */
    @ReactMethod
    public void requestFullScreenIntentPermission(Promise promise) {
        // Android 14+ için ayarlara yönlendir
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getReactApplicationContext().getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(intent);
                promise.resolve(true);
            } catch (Exception e) {
                promise.resolve(false);
            }
        } else {
            promise.resolve(true);
        }
    }

    // Yardımcı metodlar

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getReactApplicationContext());
        }
        return true;
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private PhoneAccountHandle getPhoneAccountHandle() {
        ComponentName componentName = new ComponentName(
                getReactApplicationContext(),
                CallConnectionService.class
        );
        return new PhoneAccountHandle(componentName, "LifeCall");
    }
}
