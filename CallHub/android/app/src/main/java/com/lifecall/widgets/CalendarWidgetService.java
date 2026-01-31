package com.lifecall.widgets;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.lifecall.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * LifeCall - Takvim Widget Servis
 *
 * Widget listesi için RemoteViewsFactory sağlar.
 */
public class CalendarWidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new CalendarRemoteViewsFactory(this.getApplicationContext());
    }

    /**
     * Liste öğeleri için factory
     */
    private static class CalendarRemoteViewsFactory implements RemoteViewsFactory {
        private Context context;
        private List<EventItem> events = new ArrayList<>();

        CalendarRemoteViewsFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            loadEvents();
        }

        @Override
        public void onDataSetChanged() {
            loadEvents();
        }

        private void loadEvents() {
            events.clear();

            try {
                String eventsJson = CalendarWidgetProvider.getEvents(context);
                JSONArray jsonArray = new JSONArray(eventsJson);

                // Bugünün başlangıç ve bitiş zamanları
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                String today = sdf.format(new Date());

                for (int i = 0; i < jsonArray.length(); i++) {
                    JSONObject obj = jsonArray.getJSONObject(i);

                    String startDate = obj.optString("startDate", "");
                    if (startDate.startsWith(today)) {
                        EventItem item = new EventItem();
                        item.id = obj.optString("id", "");
                        item.title = obj.optString("title", "Başlıksız");
                        item.startDate = startDate;
                        item.endDate = obj.optString("endDate", "");
                        item.allDay = obj.optBoolean("allDay", false);
                        item.color = obj.optString("color", "blue");
                        item.location = obj.optString("location", "");

                        events.add(item);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @Override
        public void onDestroy() {
            events.clear();
        }

        @Override
        public int getCount() {
            return events.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position >= events.size()) {
                return null;
            }

            EventItem event = events.get(position);
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar_item);

            // Başlık
            views.setTextViewText(R.id.event_title, event.title);

            // Saat
            String timeText = formatEventTime(event);
            views.setTextViewText(R.id.event_time, timeText);

            // Konum
            if (event.location != null && !event.location.isEmpty()) {
                views.setTextViewText(R.id.event_location, event.location);
                views.setViewVisibility(R.id.event_location, android.view.View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.event_location, android.view.View.GONE);
            }

            // Renk göstergesi
            int color = getColorForEvent(event.color);
            views.setInt(R.id.event_color_indicator, "setBackgroundColor", color);

            // Tıklama intent'i
            Intent fillInIntent = new Intent();
            fillInIntent.putExtra(CalendarWidgetProvider.EXTRA_EVENT_ID, event.id);
            views.setOnClickFillInIntent(R.id.widget_event_item, fillInIntent);

            return views;
        }

        private String formatEventTime(EventItem event) {
            if (event.allDay) {
                return "Tüm gün";
            }

            try {
                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                SimpleDateFormat outputFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());

                Date startDate = inputFormat.parse(event.startDate.replace("Z", "").replace(".000", ""));
                Date endDate = inputFormat.parse(event.endDate.replace("Z", "").replace(".000", ""));

                return outputFormat.format(startDate) + " - " + outputFormat.format(endDate);
            } catch (Exception e) {
                return "";
            }
        }

        private int getColorForEvent(String color) {
            switch (color) {
                case "red": return Color.parseColor("#F44336");
                case "orange": return Color.parseColor("#FF9800");
                case "yellow": return Color.parseColor("#FFEB3B");
                case "green": return Color.parseColor("#4CAF50");
                case "teal": return Color.parseColor("#009688");
                case "blue": return Color.parseColor("#2196F3");
                case "indigo": return Color.parseColor("#3F51B5");
                case "purple": return Color.parseColor("#9C27B0");
                case "pink": return Color.parseColor("#E91E63");
                case "gray": return Color.parseColor("#9E9E9E");
                default: return Color.parseColor("#2196F3");
            }
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

        /**
         * Etkinlik veri sınıfı
         */
        private static class EventItem {
            String id;
            String title;
            String startDate;
            String endDate;
            boolean allDay;
            String color;
            String location;
        }
    }
}
