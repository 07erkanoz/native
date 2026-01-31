package com.lifecall;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.util.List;

/**
 * LifeCall - Ana Uygulama Sınıfı
 *
 * React Native uygulamasının giriş noktası.
 */
public class MainApplication extends Application implements ReactApplication {

    // Bildirim kanal ID'leri
    public static final String CHANNEL_CALLS = "lifecall_calls";
    public static final String CHANNEL_MISSED = "lifecall_missed";
    public static final String CHANNEL_GENERAL = "lifecall_general";

    private final ReactNativeHost mReactNativeHost = new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            List<ReactPackage> packages = new PackageList(this).getPackages();

            // LifeCall native modüllerini ekle
            packages.add(new LifeCallPackage());

            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
            return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
            return BuildConfig.IS_HERMES_ENABLED;
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public ReactHost getReactHost() {
        return DefaultReactHost.getDefaultReactHost(this, mReactNativeHost);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // SoLoader başlat
        SoLoader.init(this, false);

        // New Architecture kontrolü
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }

        // Bildirim kanallarını oluştur
        createNotificationChannels();
    }

    /**
     * Android 8.0+ için bildirim kanallarını oluştur
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager =
                    getSystemService(NotificationManager.class);

            if (notificationManager == null) return;

            // Aramalar kanalı (yüksek öncelik)
            NotificationChannel callsChannel = new NotificationChannel(
                    CHANNEL_CALLS,
                    getString(R.string.notification_channel_calls),
                    NotificationManager.IMPORTANCE_HIGH
            );
            callsChannel.setDescription(getString(R.string.notification_channel_calls_desc));
            callsChannel.enableLights(true);
            callsChannel.enableVibration(true);
            callsChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(callsChannel);

            // Cevapsız aramalar kanalı
            NotificationChannel missedChannel = new NotificationChannel(
                    CHANNEL_MISSED,
                    getString(R.string.notification_channel_missed),
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            missedChannel.setDescription(getString(R.string.notification_channel_missed_desc));
            missedChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(missedChannel);

            // Genel bildirimler kanalı
            NotificationChannel generalChannel = new NotificationChannel(
                    CHANNEL_GENERAL,
                    "General",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            notificationManager.createNotificationChannel(generalChannel);
        }
    }
}
