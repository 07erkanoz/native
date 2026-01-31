package com.lifecall.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;

import com.lifecall.CallModule;

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
                    onCallActive(phoneNumber);
                    break;

                case TelephonyManager.EXTRA_STATE_IDLE:
                    // Arama bitti veya reddedildi
                    onCallEnded(phoneNumber);
                    break;
            }
        }
    }

    /**
     * Gelen arama
     */
    private void onIncomingCall(Context context, String phoneNumber) {
        // Foreground service ile bildirim göster (tam ekran intent ile)
        CallModule.showIncomingCallNotification(
                context,
                phoneNumber,
                null // Arayan ismi kişiler DB'den alınabilir
        );
    }

    /**
     * Arama aktif (cevaplandı)
     */
    private void onCallActive(String phoneNumber) {
        CallModule.emitCallAnswered(phoneNumber);
    }

    /**
     * Arama bitti
     */
    private void onCallEnded(String phoneNumber) {
        CallModule.emitCallEnded(phoneNumber, "ended");
        lastPhoneNumber = "";
    }
}
