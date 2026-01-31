package com.lifecall.receivers;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;

import com.lifecall.CalendarNotificationModule;
import com.lifecall.MainActivity;
import com.lifecall.R;

/**
 * LifeCall - Takvim Hatırlatıcı Receiver
 *
 * AlarmManager'dan gelen hatırlatıcı alarmlarını alır ve bildirim gösterir.
 */
public class CalendarReminderReceiver extends BroadcastReceiver {

    private static final String TAG = "CalendarReminderReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        if (!"com.lifecall.CALENDAR_REMINDER".equals(action)) return;

        Bundle extras = intent.getExtras();
        if (extras == null) return;

        String eventId = extras.getString("eventId", "");
        String reminderId = extras.getString("reminderId", "");
        String title = extras.getString("title", "Etkinlik Hatırlatıcısı");
        String description = extras.getString("description", "");
        boolean isCallReminder = extras.getBoolean("isCallReminder", false);
        String phoneNumber = extras.getString("phoneNumber", "");

        // Bildirim göster
        showNotification(context, eventId, reminderId, title, description, isCallReminder, phoneNumber);
    }

    private void showNotification(
        Context context,
        String eventId,
        String reminderId,
        String title,
        String description,
        boolean isCallReminder,
        String phoneNumber
    ) {
        NotificationManager notificationManager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Tıklayınca uygulamayı aç
        Intent tapIntent = new Intent(context, MainActivity.class);
        tapIntent.putExtra("eventId", eventId);
        tapIntent.putExtra("openEvent", true);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent tapPendingIntent = PendingIntent.getActivity(
            context,
            eventId.hashCode(),
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            context,
            CalendarNotificationModule.CHANNEL_ID
        )
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(description.isEmpty() ? "Etkinlik zamanı geldi" : description)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(tapPendingIntent)
            .setVibrate(new long[]{0, 250, 250, 250})
            .setDefaults(NotificationCompat.DEFAULT_SOUND);

        // Eğer arama hatırlatıcısı ise, "Ara" butonu ekle
        if (isCallReminder && phoneNumber != null && !phoneNumber.isEmpty()) {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            PendingIntent callPendingIntent = PendingIntent.getActivity(
                context,
                (eventId + "_call").hashCode(),
                callIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            builder.addAction(
                android.R.drawable.ic_menu_call,
                "Ara",
                callPendingIntent
            );

            // SMS gönder butonu
            Intent smsIntent = new Intent(Intent.ACTION_VIEW);
            smsIntent.setData(Uri.parse("sms:" + phoneNumber));
            smsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            PendingIntent smsPendingIntent = PendingIntent.getActivity(
                context,
                (eventId + "_sms").hashCode(),
                smsIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            builder.addAction(
                android.R.drawable.ic_menu_send,
                "Mesaj",
                smsPendingIntent
            );
        }

        // Ertele butonu
        Intent snoozeIntent = new Intent(context, CalendarSnoozeReceiver.class);
        snoozeIntent.setAction("com.lifecall.SNOOZE_REMINDER");
        snoozeIntent.putExtra("eventId", eventId);
        snoozeIntent.putExtra("reminderId", reminderId);
        snoozeIntent.putExtra("title", title);
        snoozeIntent.putExtra("description", description);
        snoozeIntent.putExtra("isCallReminder", isCallReminder);
        snoozeIntent.putExtra("phoneNumber", phoneNumber);
        snoozeIntent.putExtra("notificationId", (eventId + "_" + reminderId).hashCode());

        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            (eventId + "_snooze").hashCode(),
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        builder.addAction(
            android.R.drawable.ic_menu_recent_history,
            "10 dk Ertele",
            snoozePendingIntent
        );

        // Bildirim ID olarak eventId + reminderId hash'ini kullan
        int notificationId = (eventId + "_" + reminderId).hashCode();
        notificationManager.notify(notificationId, builder.build());
    }
}
