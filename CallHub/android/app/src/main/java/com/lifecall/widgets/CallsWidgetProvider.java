package com.lifecall.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.widget.RemoteViews;

import com.lifecall.MainActivity;
import com.lifecall.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * LifeCall - Aramalar Widget Provider
 *
 * Son aramalar ve favori kişileri gösteren widget.
 */
public class CallsWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_REFRESH = "com.lifecall.widget.CALLS_REFRESH";
    public static final String ACTION_CALL = "com.lifecall.widget.MAKE_CALL";
    public static final String ACTION_OPEN_CONTACT = "com.lifecall.widget.OPEN_CONTACT";
    public static final String EXTRA_PHONE_NUMBER = "phone_number";
    public static final String EXTRA_CONTACT_ID = "contact_id";

    private static final String PREFS_NAME = "com.lifecall.widget.calls";
    private static final String PREF_RECENT_CALLS = "recent_calls";
    private static final String PREF_FAVORITES = "favorites";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();

        if (ACTION_REFRESH.equals(action)) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName widget = new ComponentName(context, CallsWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widget);
            onUpdate(context, appWidgetManager, appWidgetIds);
        } else if (ACTION_CALL.equals(action)) {
            String phoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER);
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                Intent callIntent = new Intent(Intent.ACTION_CALL);
                callIntent.setData(Uri.parse("tel:" + phoneNumber));
                callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(callIntent);
            }
        } else if (ACTION_OPEN_CONTACT.equals(action)) {
            String contactId = intent.getStringExtra(EXTRA_CONTACT_ID);
            if (contactId != null) {
                Intent openIntent = new Intent(context, MainActivity.class);
                openIntent.putExtra("openContact", true);
                openIntent.putExtra("contactId", contactId);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                context.startActivity(openIntent);
            }
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calls);

        // Başlığa tıklayınca uygulamayı aç
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.putExtra("openCalls", true);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            context,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_header, openAppPendingIntent);

        // Yenile butonunu ayarla
        Intent refreshIntent = new Intent(context, CallsWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshPendingIntent);

        // Tuşlama butonu
        Intent dialIntent = new Intent(context, MainActivity.class);
        dialIntent.putExtra("openDialer", true);
        dialIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent dialPendingIntent = PendingIntent.getActivity(
            context,
            1,
            dialIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_dial, dialPendingIntent);

        // Favorileri yükle
        loadFavorites(context, views);

        // Son aramaları yükle
        loadRecentCalls(context, views);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private void loadFavorites(Context context, RemoteViews views) {
        try {
            String favoritesJson = getFavorites(context);
            JSONArray favorites = new JSONArray(favoritesJson);

            // Maksimum 4 favori göster
            int[] favoriteContainers = {
                R.id.favorite_1,
                R.id.favorite_2,
                R.id.favorite_3,
                R.id.favorite_4
            };

            for (int i = 0; i < favoriteContainers.length; i++) {
                if (i < favorites.length()) {
                    JSONObject fav = favorites.getJSONObject(i);
                    String name = fav.optString("name", "");
                    String phoneNumber = fav.optString("phoneNumber", "");
                    String initial = name.isEmpty() ? "?" : name.substring(0, 1).toUpperCase();

                    views.setTextViewText(favoriteContainers[i], initial);
                    views.setViewVisibility(favoriteContainers[i], android.view.View.VISIBLE);

                    // Tıklama - Arama yap
                    Intent callIntent = new Intent(context, CallsWidgetProvider.class);
                    callIntent.setAction(ACTION_CALL);
                    callIntent.putExtra(EXTRA_PHONE_NUMBER, phoneNumber);
                    callIntent.setData(Uri.parse("call:" + i)); // Unique URI
                    PendingIntent callPendingIntent = PendingIntent.getBroadcast(
                        context,
                        100 + i,
                        callIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                    views.setOnClickPendingIntent(favoriteContainers[i], callPendingIntent);
                } else {
                    views.setViewVisibility(favoriteContainers[i], android.view.View.INVISIBLE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadRecentCalls(Context context, RemoteViews views) {
        try {
            String callsJson = getRecentCalls(context);
            JSONArray calls = new JSONArray(callsJson);

            // Maksimum 4 son arama göster
            int[][] callViews = {
                {R.id.call_1_name, R.id.call_1_time, R.id.call_1_icon, R.id.call_1_container},
                {R.id.call_2_name, R.id.call_2_time, R.id.call_2_icon, R.id.call_2_container},
                {R.id.call_3_name, R.id.call_3_time, R.id.call_3_icon, R.id.call_3_container},
                {R.id.call_4_name, R.id.call_4_time, R.id.call_4_icon, R.id.call_4_container}
            };

            for (int i = 0; i < callViews.length; i++) {
                if (i < calls.length()) {
                    JSONObject call = calls.getJSONObject(i);
                    String name = call.optString("name", "");
                    String phoneNumber = call.optString("phoneNumber", "");
                    String type = call.optString("type", "outgoing");
                    long timestamp = call.optLong("timestamp", 0);

                    String displayName = name.isEmpty() ? phoneNumber : name;
                    views.setTextViewText(callViews[i][0], displayName);
                    views.setTextViewText(callViews[i][1], formatTime(timestamp));

                    // Arama tipi ikonu
                    int iconRes;
                    switch (type) {
                        case "incoming":
                            iconRes = android.R.drawable.sym_call_incoming;
                            break;
                        case "missed":
                            iconRes = android.R.drawable.sym_call_missed;
                            break;
                        case "outgoing":
                        default:
                            iconRes = android.R.drawable.sym_call_outgoing;
                            break;
                    }
                    views.setImageViewResource(callViews[i][2], iconRes);
                    views.setViewVisibility(callViews[i][3], android.view.View.VISIBLE);

                    // Tıklama - Arama yap
                    Intent callIntent = new Intent(context, CallsWidgetProvider.class);
                    callIntent.setAction(ACTION_CALL);
                    callIntent.putExtra(EXTRA_PHONE_NUMBER, phoneNumber);
                    callIntent.setData(Uri.parse("recentcall:" + i));
                    PendingIntent callPendingIntent = PendingIntent.getBroadcast(
                        context,
                        200 + i,
                        callIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                    views.setOnClickPendingIntent(callViews[i][3], callPendingIntent);
                } else {
                    views.setViewVisibility(callViews[i][3], android.view.View.GONE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String formatTime(long timestamp) {
        if (timestamp == 0) return "";

        Date date = new Date(timestamp);
        Date now = new Date();

        SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd.MM", Locale.getDefault());

        // Aynı gün mü kontrol et
        SimpleDateFormat dayFormat = new SimpleDateFormat("yyyyMMdd", Locale.getDefault());
        if (dayFormat.format(date).equals(dayFormat.format(now))) {
            return timeFormat.format(date);
        }

        return dateFormat.format(date);
    }

    /**
     * React Native'den son aramaları güncelle
     */
    public static void updateRecentCalls(Context context, String callsJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(PREF_RECENT_CALLS, callsJson).apply();

        Intent intent = new Intent(context, CallsWidgetProvider.class);
        intent.setAction(ACTION_REFRESH);
        context.sendBroadcast(intent);
    }

    /**
     * React Native'den favorileri güncelle
     */
    public static void updateFavorites(Context context, String favoritesJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(PREF_FAVORITES, favoritesJson).apply();

        Intent intent = new Intent(context, CallsWidgetProvider.class);
        intent.setAction(ACTION_REFRESH);
        context.sendBroadcast(intent);
    }

    public static String getRecentCalls(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(PREF_RECENT_CALLS, "[]");
    }

    public static String getFavorites(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(PREF_FAVORITES, "[]");
    }
}
