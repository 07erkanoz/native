package com.lifecall.receivers;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;

/**
 * LifeCall - Takvim Erteleme Receiver
 *
 * Bildirimi erteler (10 dakika sonra tekrar hatırlatır).
 */
public class CalendarSnoozeReceiver extends BroadcastReceiver {

    private static final long SNOOZE_DURATION_MS = 10 * 60 * 1000; // 10 dakika

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        if (!"com.lifecall.SNOOZE_REMINDER".equals(action)) return;

        Bundle extras = intent.getExtras();
        if (extras == null) return;

        String eventId = extras.getString("eventId", "");
        String reminderId = extras.getString("reminderId", "");
        String title = extras.getString("title", "");
        String description = extras.getString("description", "");
        boolean isCallReminder = extras.getBoolean("isCallReminder", false);
        String phoneNumber = extras.getString("phoneNumber", "");
        int notificationId = extras.getInt("notificationId", 0);

        // Mevcut bildirimi kapat
        NotificationManager notificationManager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(notificationId);

        // 10 dakika sonra tekrar hatırlat
        scheduleSnoozeReminder(
            context,
            eventId,
            reminderId,
            title,
            description,
            isCallReminder,
            phoneNumber
        );

        // Kullanıcıya bilgi ver
        Toast.makeText(context, "10 dakika sonra hatırlatılacak", Toast.LENGTH_SHORT).show();
    }

    private void scheduleSnoozeReminder(
        Context context,
        String eventId,
        String reminderId,
        String title,
        String description,
        boolean isCallReminder,
        String phoneNumber
    ) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, CalendarReminderReceiver.class);
        intent.setAction("com.lifecall.CALENDAR_REMINDER");
        intent.putExtra("eventId", eventId);
        intent.putExtra("reminderId", reminderId + "_snooze");
        intent.putExtra("title", title);
        intent.putExtra("description", description);
        intent.putExtra("isCallReminder", isCallReminder);
        intent.putExtra("phoneNumber", phoneNumber);

        int requestCode = (eventId + "_" + reminderId + "_snooze").hashCode();

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerTime = System.currentTimeMillis() + SNOOZE_DURATION_MS;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            );
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            );
        }
    }
}
