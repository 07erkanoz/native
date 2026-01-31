package com.lifecall.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.lifecall.MainActivity;
import com.lifecall.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * LifeCall - Takvim Widget Provider
 *
 * Ana ekranda bugünün etkinliklerini gösteren widget.
 */
public class CalendarWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_REFRESH = "com.lifecall.widget.CALENDAR_REFRESH";
    public static final String ACTION_OPEN_EVENT = "com.lifecall.widget.OPEN_EVENT";
    public static final String EXTRA_EVENT_ID = "event_id";

    private static final String PREFS_NAME = "com.lifecall.widget.calendar";
    private static final String PREF_EVENTS = "events";

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
            // Widget'ı yenile
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName widget = new ComponentName(context, CalendarWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widget);
            onUpdate(context, appWidgetManager, appWidgetIds);
        } else if (ACTION_OPEN_EVENT.equals(action)) {
            // Etkinlik detayını aç
            String eventId = intent.getStringExtra(EXTRA_EVENT_ID);
            if (eventId != null) {
                Intent openIntent = new Intent(context, MainActivity.class);
                openIntent.putExtra("openEvent", true);
                openIntent.putExtra("eventId", eventId);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                context.startActivity(openIntent);
            }
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

        // Bugünün tarihini ayarla
        SimpleDateFormat dateFormat = new SimpleDateFormat("d MMMM yyyy, EEEE", new Locale("tr"));
        String todayDate = dateFormat.format(new Date());
        views.setTextViewText(R.id.widget_date, todayDate);

        // Başlığa tıklayınca uygulamayı aç
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.putExtra("openCalendar", true);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            context,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_header, openAppPendingIntent);

        // Yenile butonunu ayarla
        Intent refreshIntent = new Intent(context, CalendarWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshPendingIntent);

        // Yeni etkinlik butonu
        Intent addEventIntent = new Intent(context, MainActivity.class);
        addEventIntent.putExtra("openCalendar", true);
        addEventIntent.putExtra("createEvent", true);
        addEventIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent addEventPendingIntent = PendingIntent.getActivity(
            context,
            1,
            addEventIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_add_event, addEventPendingIntent);

        // Liste adaptörünü ayarla
        Intent listIntent = new Intent(context, CalendarWidgetService.class);
        listIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        listIntent.setData(Uri.parse(listIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_events_list, listIntent);

        // Liste öğelerine tıklama template'i
        Intent itemClickIntent = new Intent(context, CalendarWidgetProvider.class);
        itemClickIntent.setAction(ACTION_OPEN_EVENT);
        PendingIntent itemClickPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            itemClickIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
        views.setPendingIntentTemplate(R.id.widget_events_list, itemClickPendingIntent);

        // Boş liste görünümü
        views.setEmptyView(R.id.widget_events_list, R.id.widget_empty_view);

        appWidgetManager.updateAppWidget(appWidgetId, views);
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_events_list);
    }

    /**
     * React Native'den etkinlikleri güncelle
     */
    public static void updateEvents(Context context, String eventsJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(PREF_EVENTS, eventsJson).apply();

        // Widget'ları yenile
        Intent intent = new Intent(context, CalendarWidgetProvider.class);
        intent.setAction(ACTION_REFRESH);
        context.sendBroadcast(intent);
    }

    /**
     * Kaydedilmiş etkinlikleri al
     */
    public static String getEvents(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(PREF_EVENTS, "[]");
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
    }
}
