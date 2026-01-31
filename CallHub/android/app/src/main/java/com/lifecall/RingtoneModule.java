package com.lifecall;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.provider.MediaStore;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

/**
 * LifeCall - Zil Sesi Modülü
 *
 * Android sistem zil seslerini ve özel zil seslerini yönetir.
 */
public class RingtoneModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "RingtoneModule";
    private final ReactApplicationContext reactContext;
    private Ringtone currentPlayingRingtone = null;

    public RingtoneModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Sistem zil seslerini listele
     */
    @ReactMethod
    public void getSystemRingtones(Promise promise) {
        try {
            WritableArray ringtones = Arguments.createArray();

            RingtoneManager manager = new RingtoneManager(reactContext);
            manager.setType(RingtoneManager.TYPE_RINGTONE);
            Cursor cursor = manager.getCursor();

            while (cursor.moveToNext()) {
                WritableMap ringtone = Arguments.createMap();

                String title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX);
                String uri = cursor.getString(RingtoneManager.URI_COLUMN_INDEX);
                String id = cursor.getString(RingtoneManager.ID_COLUMN_INDEX);

                String fullUri = uri + "/" + id;

                ringtone.putString("id", id);
                ringtone.putString("title", title);
                ringtone.putString("uri", fullUri);
                ringtone.putString("type", "system");

                ringtones.pushMap(ringtone);
            }

            promise.resolve(ringtones);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Bildirim seslerini listele
     */
    @ReactMethod
    public void getNotificationSounds(Promise promise) {
        try {
            WritableArray sounds = Arguments.createArray();

            RingtoneManager manager = new RingtoneManager(reactContext);
            manager.setType(RingtoneManager.TYPE_NOTIFICATION);
            Cursor cursor = manager.getCursor();

            while (cursor.moveToNext()) {
                WritableMap sound = Arguments.createMap();

                String title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX);
                String uri = cursor.getString(RingtoneManager.URI_COLUMN_INDEX);
                String id = cursor.getString(RingtoneManager.ID_COLUMN_INDEX);

                String fullUri = uri + "/" + id;

                sound.putString("id", id);
                sound.putString("title", title);
                sound.putString("uri", fullUri);
                sound.putString("type", "notification");

                sounds.pushMap(sound);
            }

            promise.resolve(sounds);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Cihazda indirilen/özel zil seslerini listele
     */
    @ReactMethod
    public void getCustomRingtones(Promise promise) {
        try {
            WritableArray ringtones = Arguments.createArray();

            ContentResolver resolver = reactContext.getContentResolver();
            Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

            String[] projection = {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.IS_RINGTONE,
                MediaStore.Audio.Media.IS_NOTIFICATION
            };

            String selection = MediaStore.Audio.Media.IS_RINGTONE + " != 0 OR " +
                               MediaStore.Audio.Media.IS_NOTIFICATION + " != 0 OR " +
                               MediaStore.Audio.Media.IS_MUSIC + " != 0";

            Cursor cursor = resolver.query(uri, projection, selection, null,
                MediaStore.Audio.Media.TITLE + " ASC");

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    WritableMap ringtone = Arguments.createMap();

                    String id = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID));
                    String title = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE));
                    String path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA));
                    long duration = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION));

                    // Sadece 60 saniyeden kısa ses dosyalarını göster
                    if (duration <= 60000) {
                        ringtone.putString("id", id);
                        ringtone.putString("title", title);
                        ringtone.putString("uri", "content://media/external/audio/media/" + id);
                        ringtone.putString("path", path);
                        ringtone.putDouble("duration", duration);
                        ringtone.putString("type", "custom");

                        ringtones.pushMap(ringtone);
                    }
                }
                cursor.close();
            }

            promise.resolve(ringtones);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Varsayılan zil sesini al
     */
    @ReactMethod
    public void getDefaultRingtone(Promise promise) {
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            Ringtone ringtone = RingtoneManager.getRingtone(reactContext, ringtoneUri);

            WritableMap result = Arguments.createMap();
            result.putString("uri", ringtoneUri != null ? ringtoneUri.toString() : null);
            result.putString("title", ringtone != null ? ringtone.getTitle(reactContext) : "Varsayılan");

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Zil sesini önizle (çal)
     */
    @ReactMethod
    public void playRingtone(String uriString, Promise promise) {
        try {
            // Önceki çalmayı durdur
            stopRingtone(null);

            Uri uri = Uri.parse(uriString);
            currentPlayingRingtone = RingtoneManager.getRingtone(reactContext, uri);

            if (currentPlayingRingtone != null) {
                currentPlayingRingtone.play();
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Zil sesini durdur
     */
    @ReactMethod
    public void stopRingtone(Promise promise) {
        try {
            if (currentPlayingRingtone != null && currentPlayingRingtone.isPlaying()) {
                currentPlayingRingtone.stop();
            }
            currentPlayingRingtone = null;

            if (promise != null) {
                promise.resolve(true);
            }
        } catch (Exception e) {
            if (promise != null) {
                promise.reject("ERROR", e.getMessage());
            }
        }
    }

    /**
     * Zil sesi başlığını URI'den al
     */
    @ReactMethod
    public void getRingtoneTitle(String uriString, Promise promise) {
        try {
            if (uriString == null || uriString.isEmpty()) {
                promise.resolve("Sessiz");
                return;
            }

            Uri uri = Uri.parse(uriString);
            Ringtone ringtone = RingtoneManager.getRingtone(reactContext, uri);

            if (ringtone != null) {
                promise.resolve(ringtone.getTitle(reactContext));
            } else {
                promise.resolve("Bilinmeyen");
            }
        } catch (Exception e) {
            promise.resolve("Bilinmeyen");
        }
    }

    /**
     * Kişiye özel zil sesi ayarla
     * Not: Bu ContactsContract üzerinden yapılır, ama RN tarafından daha kolay yönetilir
     */
    @ReactMethod
    public void setContactRingtone(String contactId, String ringtoneUri, Promise promise) {
        try {
            android.content.ContentValues values = new android.content.ContentValues();
            values.put(android.provider.ContactsContract.Contacts.CUSTOM_RINGTONE, ringtoneUri);

            Uri contactUri = Uri.withAppendedPath(
                android.provider.ContactsContract.Contacts.CONTENT_URI,
                contactId
            );

            int updated = reactContext.getContentResolver().update(
                contactUri,
                values,
                null,
                null
            );

            promise.resolve(updated > 0);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Kişinin özel zil sesini al
     */
    @ReactMethod
    public void getContactRingtone(String contactId, Promise promise) {
        try {
            Uri contactUri = Uri.withAppendedPath(
                android.provider.ContactsContract.Contacts.CONTENT_URI,
                contactId
            );

            String[] projection = { android.provider.ContactsContract.Contacts.CUSTOM_RINGTONE };

            Cursor cursor = reactContext.getContentResolver().query(
                contactUri,
                projection,
                null,
                null,
                null
            );

            WritableMap result = Arguments.createMap();

            if (cursor != null && cursor.moveToFirst()) {
                String ringtoneUri = cursor.getString(0);
                cursor.close();

                if (ringtoneUri != null && !ringtoneUri.isEmpty()) {
                    Ringtone ringtone = RingtoneManager.getRingtone(reactContext, Uri.parse(ringtoneUri));
                    result.putString("uri", ringtoneUri);
                    result.putString("title", ringtone != null ? ringtone.getTitle(reactContext) : "Özel Zil Sesi");
                    result.putBoolean("hasCustomRingtone", true);
                } else {
                    result.putNull("uri");
                    result.putString("title", "Varsayılan");
                    result.putBoolean("hasCustomRingtone", false);
                }
            } else {
                result.putNull("uri");
                result.putString("title", "Varsayılan");
                result.putBoolean("hasCustomRingtone", false);
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Kişinin özel zil sesini kaldır
     */
    @ReactMethod
    public void removeContactRingtone(String contactId, Promise promise) {
        try {
            android.content.ContentValues values = new android.content.ContentValues();
            values.putNull(android.provider.ContactsContract.Contacts.CUSTOM_RINGTONE);

            Uri contactUri = Uri.withAppendedPath(
                android.provider.ContactsContract.Contacts.CONTENT_URI,
                contactId
            );

            int updated = reactContext.getContentResolver().update(
                contactUri,
                values,
                null,
                null
            );

            promise.resolve(updated > 0);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
