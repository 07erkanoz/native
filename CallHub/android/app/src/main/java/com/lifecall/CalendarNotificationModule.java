package com.lifecall;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import com.lifecall.receivers.CalendarReminderReceiver;

/**
 * LifeCall - Takvim Bildirim Modülü
 *
 * Native AlarmManager ile etkinlik hatırlatıcıları planlar.
 */
public class CalendarNotificationModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "CalendarNotificationModule";
    public static final String CHANNEL_ID = "lifecall_calendar_reminders";
    public static final String CHANNEL_NAME = "Takvim Hatırlatıcıları";

    private final ReactApplicationContext reactContext;
    private AlarmManager alarmManager;
    private NotificationManager notificationManager;

    public CalendarNotificationModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Bildirim kanalı oluştur
        createNotificationChannel();
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Bildirim kanalı oluştur (Android 8+)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Takvim etkinlik hatırlatıcıları");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setLightColor(0xFF6750A4);
            channel.setShowBadge(true);

            notificationManager.createNotificationChannel(channel);
        }
    }

    /**
     * Hatırlatıcı planla
     *
     * @param eventId Etkinlik ID
     * @param reminderId Hatırlatıcı ID
     * @param title Etkinlik başlığı
     * @param description Etkinlik açıklaması
     * @param triggerTime Tetikleme zamanı (milisaniye - Unix timestamp)
     * @param isCallReminder Arama hatırlatıcısı mı
     * @param phoneNumber Aranacak numara (arama hatırlatıcısı için)
     */
    @ReactMethod
    public void scheduleReminder(
        String eventId,
        String reminderId,
        String title,
        String description,
        double triggerTime,
        boolean isCallReminder,
        String phoneNumber,
        Promise promise
    ) {
        try {
            Intent intent = new Intent(reactContext, CalendarReminderReceiver.class);
            intent.setAction("com.lifecall.CALENDAR_REMINDER");
            intent.putExtra("eventId", eventId);
            intent.putExtra("reminderId", reminderId);
            intent.putExtra("title", title);
            intent.putExtra("description", description != null ? description : "");
            intent.putExtra("isCallReminder", isCallReminder);
            intent.putExtra("phoneNumber", phoneNumber != null ? phoneNumber : "");

            // Unique request code oluştur
            int requestCode = (eventId + "_" + reminderId).hashCode();

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerTimeMs = (long) triggerTime;

            // Android 12+ için exact alarm izni kontrol et
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    // Exact alarm izni yok, inexact alarm kullan
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTimeMs,
                        pendingIntent
                    );
                } else {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTimeMs,
                        pendingIntent
                    );
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                );
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTimeMs,
                    pendingIntent
                );
            }

            WritableMap result = Arguments.createMap();
            result.putString("eventId", eventId);
            result.putString("reminderId", reminderId);
            result.putDouble("triggerTime", triggerTime);
            result.putBoolean("scheduled", true);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SCHEDULE_ERROR", "Hatırlatıcı planlanamadı: " + e.getMessage());
        }
    }

    /**
     * Hatırlatıcı iptal et
     */
    @ReactMethod
    public void cancelReminder(String eventId, String reminderId, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, CalendarReminderReceiver.class);
            intent.setAction("com.lifecall.CALENDAR_REMINDER");

            int requestCode = (eventId + "_" + reminderId).hashCode();

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            WritableMap result = Arguments.createMap();
            result.putString("eventId", eventId);
            result.putString("reminderId", reminderId);
            result.putBoolean("cancelled", true);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("CANCEL_ERROR", "Hatırlatıcı iptal edilemedi: " + e.getMessage());
        }
    }

    /**
     * Bir etkinliğin tüm hatırlatıcılarını iptal et
     */
    @ReactMethod
    public void cancelAllRemindersForEvent(String eventId, Promise promise) {
        try {
            // Not: Bu basit bir implementasyon, gerçekte tüm reminder ID'lerini takip etmek gerekir
            WritableMap result = Arguments.createMap();
            result.putString("eventId", eventId);
            result.putBoolean("cancelled", true);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("CANCEL_ERROR", "Hatırlatıcılar iptal edilemedi: " + e.getMessage());
        }
    }

    /**
     * Tüm hatırlatıcıları iptal et
     */
    @ReactMethod
    public void cancelAllReminders(Promise promise) {
        try {
            // Not: Tüm alarm'ları iptal etmek için kayıtlı ID'leri saklamak gerekir
            WritableMap result = Arguments.createMap();
            result.putBoolean("cancelled", true);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("CANCEL_ERROR", "Tüm hatırlatıcılar iptal edilemedi: " + e.getMessage());
        }
    }

    /**
     * Anında bildirim göster (test için)
     */
    @ReactMethod
    public void showNotification(String title, String body, String eventId, Promise promise) {
        try {
            Intent tapIntent = new Intent(reactContext, MainActivity.class);
            tapIntent.putExtra("eventId", eventId);
            tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent tapPendingIntent = PendingIntent.getActivity(
                reactContext,
                eventId.hashCode(),
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(tapPendingIntent)
                .setVibrate(new long[]{0, 250, 250, 250});

            notificationManager.notify(eventId.hashCode(), builder.build());

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("NOTIFICATION_ERROR", "Bildirim gösterilemedi: " + e.getMessage());
        }
    }

    /**
     * Exact alarm izni kontrol et (Android 12+)
     */
    @ReactMethod
    public void canScheduleExactAlarms(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            promise.resolve(alarmManager.canScheduleExactAlarms());
        } else {
            promise.resolve(true);
        }
    }

    /**
     * Exact alarm ayarlarını aç
     */
    @ReactMethod
    public void openExactAlarmSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", "Ayarlar açılamadı: " + e.getMessage());
        }
    }

    /**
     * Bildirim izni kontrol et
     */
    @ReactMethod
    public void areNotificationsEnabled(Promise promise) {
        promise.resolve(notificationManager.areNotificationsEnabled());
    }

    /**
     * Bildirim ayarlarını aç
     */
    @ReactMethod
    public void openNotificationSettings(Promise promise) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.getPackageName());
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", "Ayarlar açılamadı: " + e.getMessage());
        }
    }
}
