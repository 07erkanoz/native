package com.lifecall;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import com.lifecall.widgets.CalendarWidgetProvider;
import com.lifecall.widgets.CallsWidgetProvider;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * LifeCall - Widget Modülü
 *
 * React Native'den widget'ları güncellemeye yarar.
 */
public class WidgetModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "WidgetModule";
    private final ReactApplicationContext reactContext;

    public WidgetModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Takvim widget'ına etkinlikleri gönder
     */
    @ReactMethod
    public void updateCalendarWidget(String eventsJson, Promise promise) {
        try {
            CalendarWidgetProvider.updateEvents(reactContext, eventsJson);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    /**
     * Arama widget'ına son aramaları gönder
     */
    @ReactMethod
    public void updateCallsWidget(String callsJson, Promise promise) {
        try {
            CallsWidgetProvider.updateRecentCalls(reactContext, callsJson);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    /**
     * Arama widget'ına favorileri gönder
     */
    @ReactMethod
    public void updateFavoritesWidget(String favoritesJson, Promise promise) {
        try {
            CallsWidgetProvider.updateFavorites(reactContext, favoritesJson);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    /**
     * Tüm widget'ları yenile
     */
    @ReactMethod
    public void refreshAllWidgets(Promise promise) {
        try {
            // Takvim widget'ını yenile
            Intent calendarIntent = new Intent(reactContext, CalendarWidgetProvider.class);
            calendarIntent.setAction(CalendarWidgetProvider.ACTION_REFRESH);
            reactContext.sendBroadcast(calendarIntent);

            // Arama widget'ını yenile
            Intent callsIntent = new Intent(reactContext, CallsWidgetProvider.class);
            callsIntent.setAction(CallsWidgetProvider.ACTION_REFRESH);
            reactContext.sendBroadcast(callsIntent);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("REFRESH_ERROR", e.getMessage());
        }
    }

    /**
     * Takvim widget'ı var mı kontrol et
     */
    @ReactMethod
    public void hasCalendarWidget(Promise promise) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(reactContext);
            ComponentName widget = new ComponentName(reactContext, CalendarWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(widget);
            promise.resolve(ids.length > 0);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    /**
     * Arama widget'ı var mı kontrol et
     */
    @ReactMethod
    public void hasCallsWidget(Promise promise) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(reactContext);
            ComponentName widget = new ComponentName(reactContext, CallsWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(widget);
            promise.resolve(ids.length > 0);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    /**
     * Widget ekleme ekranını aç
     */
    @ReactMethod
    public void requestWidgetPin(String widgetType, Promise promise) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                AppWidgetManager manager = AppWidgetManager.getInstance(reactContext);

                ComponentName widget;
                if ("calendar".equals(widgetType)) {
                    widget = new ComponentName(reactContext, CalendarWidgetProvider.class);
                } else {
                    widget = new ComponentName(reactContext, CallsWidgetProvider.class);
                }

                if (manager.isRequestPinAppWidgetSupported()) {
                    manager.requestPinAppWidget(widget, null, null);
                    promise.resolve(true);
                } else {
                    promise.resolve(false);
                }
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("PIN_ERROR", e.getMessage());
        }
    }
}
