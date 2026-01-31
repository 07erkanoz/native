package com.lifecall.services;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.lifecall.IncomingCallActivity;
import com.lifecall.MainActivity;
import com.lifecall.MainApplication;
import com.lifecall.R;

/**
 * LifeCall - Gelen Arama Servisi
 *
 * Gelen aramalar için foreground service sağlar.
 * Android 10+ için gereklidir.
 */
public class IncomingCallService extends Service {

    public static final String ACTION_INCOMING_CALL = "com.lifecall.INCOMING_CALL";
    public static final String ACTION_ANSWER_CALL = "com.lifecall.ANSWER_CALL";
    public static final String ACTION_DECLINE_CALL = "com.lifecall.DECLINE_CALL";
    public static final String ACTION_END_CALL = "com.lifecall.END_CALL";

    public static final String EXTRA_PHONE_NUMBER = "phoneNumber";
    public static final String EXTRA_CALLER_NAME = "callerName";
    public static final String EXTRA_PHOTO_URI = "photoUri";

    private static final int NOTIFICATION_ID = 1001;

    private String currentPhoneNumber;
    private String currentCallerName;

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (action == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        currentPhoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER);
        currentCallerName = intent.getStringExtra(EXTRA_CALLER_NAME);

        switch (action) {
            case ACTION_INCOMING_CALL:
                showIncomingCallNotification();
                break;

            case ACTION_ANSWER_CALL:
                answerCall();
                break;

            case ACTION_DECLINE_CALL:
                declineCall();
                break;

            case ACTION_END_CALL:
                endCall();
                break;

            default:
                stopSelf();
        }

        return START_NOT_STICKY;
    }

    /**
     * Gelen arama bildirimi göster
     */
    private void showIncomingCallNotification() {
        // Full-screen intent
        Intent fullScreenIntent = new Intent(this, IncomingCallActivity.class);
        fullScreenIntent.putExtra(EXTRA_PHONE_NUMBER, currentPhoneNumber);
        fullScreenIntent.putExtra(EXTRA_CALLER_NAME, currentCallerName);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                0,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Yanıtla action
        Intent answerIntent = new Intent(this, IncomingCallService.class);
        answerIntent.setAction(ACTION_ANSWER_CALL);
        PendingIntent answerPendingIntent = PendingIntent.getService(
                this,
                1,
                answerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Reddet action
        Intent declineIntent = new Intent(this, IncomingCallService.class);
        declineIntent.setAction(ACTION_DECLINE_CALL);
        PendingIntent declinePendingIntent = PendingIntent.getService(
                this,
                2,
                declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String callerDisplay = currentCallerName != null && !currentCallerName.isEmpty()
                ? currentCallerName
                : (currentPhoneNumber != null ? currentPhoneNumber : getString(R.string.unknown_caller));

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, MainApplication.CHANNEL_CALLS)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentTitle(getString(R.string.incoming_call))
                .setContentText(callerDisplay)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setOngoing(true)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_menu_call, getString(R.string.answer), answerPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, getString(R.string.decline), declinePendingIntent);

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    /**
     * Aramayı yanıtla
     */
    private void answerCall() {
        // React Native'e bildir
        stopForeground(true);
        stopSelf();
    }

    /**
     * Aramayı reddet
     */
    private void declineCall() {
        // React Native'e bildir
        stopForeground(true);
        stopSelf();
    }

    /**
     * Aramayı sonlandır
     */
    private void endCall() {
        stopForeground(true);
        stopSelf();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Bildirimi kaldır
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(NOTIFICATION_ID);
        }
    }
}
