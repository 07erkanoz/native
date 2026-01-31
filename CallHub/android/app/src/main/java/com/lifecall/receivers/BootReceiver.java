package com.lifecall.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * LifeCall - Açılış Alıcısı
 *
 * Cihaz açıldığında servisleri başlatır.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {

            // Arka plan servisini başlat (gerekirse)
            // PhoneAccount'u yeniden kaydet

            // Not: Varsayılan arama uygulaması olarak ayarlandıysa,
            // Android otomatik olarak servisleri başlatır
        }
    }
}
