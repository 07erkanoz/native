package com.lifecall;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

/**
 * LifeCall - Ana Activity
 *
 * React Native uygulamasının ana aktivitesi.
 * - Gelen arama intent'lerini yakalar
 * - Dial intent'lerini işler
 */
public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    /**
     * Gelen intent'leri işle
     */
    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Uri data = intent.getData();

        if (action == null) return;

        switch (action) {
            case Intent.ACTION_DIAL:
            case Intent.ACTION_VIEW:
                // Arama ekranını aç
                if (data != null && "tel".equals(data.getScheme())) {
                    String phoneNumber = data.getSchemeSpecificPart();
                    // React Native'e gönder
                    sendDialIntent(phoneNumber);
                }
                break;

            case Intent.ACTION_CALL:
                // Doğrudan arama yap (izin gerektirir)
                if (data != null && "tel".equals(data.getScheme())) {
                    String phoneNumber = data.getSchemeSpecificPart();
                    sendCallIntent(phoneNumber);
                }
                break;
        }
    }

    /**
     * Dial intent'ini React Native'e gönder
     */
    private void sendDialIntent(String phoneNumber) {
        // Bu metod DeviceEventEmitter üzerinden React Native'e event gönderir
        // Native modül tarafından dinlenir
    }

    /**
     * Call intent'ini React Native'e gönder
     */
    private void sendCallIntent(String phoneNumber) {
        // Doğrudan arama başlat
    }

    /**
     * React Native modül adını döndür
     */
    @Override
    protected String getMainComponentName() {
        return "CallHub";
    }

    /**
     * React Activity Delegate
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }
}
