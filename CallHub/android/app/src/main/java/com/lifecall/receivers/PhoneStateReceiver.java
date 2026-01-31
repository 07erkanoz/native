package com.lifecall.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * LifeCall - Telefon Durum Alıcısı
 *
 * Gelen ve giden aramaları dinler.
 * Android TelephonyManager ile çalışır.
 */
public class PhoneStateReceiver extends BroadcastReceiver {

    private static String lastState = TelephonyManager.EXTRA_STATE_IDLE;
    private static String lastPhoneNumber = "";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
            String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
            String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);

            if (state == null) return;

            // Aynı durumu tekrar göndermekten kaçın
            if (state.equals(lastState) &&
                (phoneNumber == null || phoneNumber.equals(lastPhoneNumber))) {
                return;
            }

            lastState = state;
            if (phoneNumber != null) {
                lastPhoneNumber = phoneNumber;
            }

            switch (state) {
                case TelephonyManager.EXTRA_STATE_RINGING:
                    // Gelen arama
                    onIncomingCall(context, phoneNumber);
                    break;

                case TelephonyManager.EXTRA_STATE_OFFHOOK:
                    // Arama aktif (cevaplandı veya aranıyor)
                    onCallActive(context, phoneNumber);
                    break;

                case TelephonyManager.EXTRA_STATE_IDLE:
                    // Arama bitti veya reddedildi
                    onCallEnded(context, phoneNumber);
                    break;
            }
        }
    }

    /**
     * Gelen arama
     */
    private void onIncomingCall(Context context, String phoneNumber) {
        // Intent gönder - IncomingCallActivity'yi başlat
        Intent intent = new Intent(context, com.lifecall.IncomingCallActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra("phoneNumber", phoneNumber != null ? phoneNumber : "");
        intent.putExtra("callType", "incoming");

        try {
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // React Native event gönder
        sendEvent(context, "onIncomingCall", phoneNumber);
    }

    /**
     * Arama aktif
     */
    private void onCallActive(Context context, String phoneNumber) {
        sendEvent(context, "onCallActive", phoneNumber);
    }

    /**
     * Arama bitti
     */
    private void onCallEnded(Context context, String phoneNumber) {
        sendEvent(context, "onCallEnded", phoneNumber);
        lastPhoneNumber = "";
    }

    /**
     * React Native'e event gönder
     */
    private void sendEvent(Context context, String eventName, String phoneNumber) {
        try {
            // Bu method, uygulamanın React context'ine erişim gerektirir
            // Genellikle MainApplication üzerinden yapılır
            WritableMap params = Arguments.createMap();
            params.putString("phoneNumber", phoneNumber != null ? phoneNumber : "");
            params.putString("eventType", eventName);

            // Event gönderimi için LifeCallEventEmitter kullanılmalı
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
