package com.lifecall;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.BlockedNumberContract;
import android.provider.BlockedNumberContract.BlockedNumbers;
import android.telecom.TelecomManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

/**
 * LifeCall - Blocking Native Module
 *
 * Android BlockedNumberContract API kullanarak numara engelleme
 * NOT: Bu API sadece varsayılan telefon/SMS uygulaması tarafından kullanılabilir
 */
public class BlockingModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BlockingModule";
    private static final String MODULE_NAME = "BlockingModule";

    public BlockingModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Varsayılan telefon uygulaması mı kontrol et
     */
    @ReactMethod
    public void canUseBlockedNumbersApi(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                boolean canUse = BlockedNumberContract.canCurrentUserBlockNumbers(getReactApplicationContext());
                promise.resolve(canUse);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "canUseBlockedNumbersApi error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Numarayı engelli listesine ekle
     */
    @ReactMethod
    public void addToBlocklist(String phoneNumber, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.reject("UNSUPPORTED", "Android 7.0 veya üstü gerekli");
                return;
            }

            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

            // Önce numara zaten engelli mi kontrol et
            if (isBlocked(phoneNumber)) {
                promise.resolve(true); // Zaten engelli
                return;
            }

            ContentValues values = new ContentValues();
            values.put(BlockedNumbers.COLUMN_ORIGINAL_NUMBER, phoneNumber);

            // E.164 format da ekle
            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            if (!normalizedNumber.equals(phoneNumber)) {
                values.put(BlockedNumbers.COLUMN_E164_NUMBER, normalizedNumber);
            }

            Uri uri = contentResolver.insert(BlockedNumbers.CONTENT_URI, values);

            if (uri != null) {
                Log.d(TAG, "Number blocked: " + phoneNumber);
                promise.resolve(true);
            } else {
                promise.reject("INSERT_FAILED", "Numara engellenemedi");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception - app is not default dialer: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Varsayılan telefon uygulaması olmalısınız");
        } catch (Exception e) {
            Log.e(TAG, "addToBlocklist error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Numarayı engelli listesinden kaldır
     */
    @ReactMethod
    public void removeFromBlocklist(String phoneNumber, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.reject("UNSUPPORTED", "Android 7.0 veya üstü gerekli");
                return;
            }

            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

            // Orijinal numara ile sil
            int deletedRows = contentResolver.delete(
                BlockedNumbers.CONTENT_URI,
                BlockedNumbers.COLUMN_ORIGINAL_NUMBER + "=?",
                new String[]{phoneNumber}
            );

            // E.164 format ile de dene
            if (deletedRows == 0) {
                String normalizedNumber = normalizePhoneNumber(phoneNumber);
                deletedRows = contentResolver.delete(
                    BlockedNumbers.CONTENT_URI,
                    BlockedNumbers.COLUMN_E164_NUMBER + "=?",
                    new String[]{normalizedNumber}
                );
            }

            if (deletedRows > 0) {
                Log.d(TAG, "Number unblocked: " + phoneNumber);
                promise.resolve(true);
            } else {
                promise.resolve(false); // Numara listede yoktu
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Varsayılan telefon uygulaması olmalısınız");
        } catch (Exception e) {
            Log.e(TAG, "removeFromBlocklist error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Numara engelli mi kontrol et
     */
    @ReactMethod
    public void isNumberBlocked(String phoneNumber, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.resolve(false);
                return;
            }

            boolean blocked = isBlocked(phoneNumber);
            promise.resolve(blocked);
        } catch (Exception e) {
            Log.e(TAG, "isNumberBlocked error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Tüm engelli numaraları al
     */
    @ReactMethod
    public void getBlockedNumbers(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.resolve(Arguments.createArray());
                return;
            }

            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();
            WritableArray blockedNumbers = Arguments.createArray();

            String[] projection = {
                BlockedNumbers._ID,
                BlockedNumbers.COLUMN_ORIGINAL_NUMBER,
                BlockedNumbers.COLUMN_E164_NUMBER
            };

            Cursor cursor = contentResolver.query(
                BlockedNumbers.CONTENT_URI,
                projection,
                null,
                null,
                null
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    WritableMap numberData = Arguments.createMap();

                    int idIndex = cursor.getColumnIndex(BlockedNumbers._ID);
                    int originalIndex = cursor.getColumnIndex(BlockedNumbers.COLUMN_ORIGINAL_NUMBER);
                    int e164Index = cursor.getColumnIndex(BlockedNumbers.COLUMN_E164_NUMBER);

                    if (idIndex >= 0) {
                        numberData.putString("id", cursor.getString(idIndex));
                    }
                    if (originalIndex >= 0) {
                        numberData.putString("phoneNumber", cursor.getString(originalIndex));
                    }
                    if (e164Index >= 0) {
                        String e164 = cursor.getString(e164Index);
                        if (e164 != null) {
                            numberData.putString("normalizedNumber", e164);
                        }
                    }

                    blockedNumbers.pushMap(numberData);
                }
                cursor.close();
            }

            promise.resolve(blockedNumbers);
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Varsayılan telefon uygulaması olmalısınız");
        } catch (Exception e) {
            Log.e(TAG, "getBlockedNumbers error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Toplu engelleme
     */
    @ReactMethod
    public void blockMultipleNumbers(ReadableMap numbers, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.reject("UNSUPPORTED", "Android 7.0 veya üstü gerekli");
                return;
            }

            // TODO: Batch insert implement et
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "blockMultipleNumbers error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Tüm engelli numaraları temizle
     */
    @ReactMethod
    public void clearAllBlocked(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.reject("UNSUPPORTED", "Android 7.0 veya üstü gerekli");
                return;
            }

            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();
            int deletedRows = contentResolver.delete(BlockedNumbers.CONTENT_URI, null, null);

            Log.d(TAG, "Cleared " + deletedRows + " blocked numbers");
            promise.resolve(deletedRows);
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Varsayılan telefon uygulaması olmalısınız");
        } catch (Exception e) {
            Log.e(TAG, "clearAllBlocked error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Sistem engelli numara ayarlarını aç
     */
    @ReactMethod
    public void openBlockedNumbersSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                TelecomManager telecomManager = (TelecomManager) getReactApplicationContext()
                    .getSystemService(Context.TELECOM_SERVICE);

                if (telecomManager != null) {
                    // Sistem engelli numara ekranını aç
                    // Bu, kullanıcıya manuel ekleme imkanı tanır
                    // Not: createManageBlockedNumbersIntent() API 24+
                    android.content.Intent intent = telecomManager.createManageBlockedNumbersIntent();
                    if (intent != null) {
                        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                        getReactApplicationContext().startActivity(intent);
                        promise.resolve(true);
                    } else {
                        promise.reject("NO_INTENT", "Engelli numara ayarları açılamadı");
                    }
                } else {
                    promise.reject("NO_TELECOM", "TelecomManager bulunamadı");
                }
            } else {
                promise.reject("UNSUPPORTED", "Android 7.0 veya üstü gerekli");
            }
        } catch (Exception e) {
            Log.e(TAG, "openBlockedNumbersSettings error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Engelli numara sayısını al
     */
    @ReactMethod
    public void getBlockedCount(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                promise.resolve(0);
                return;
            }

            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

            Cursor cursor = contentResolver.query(
                BlockedNumbers.CONTENT_URI,
                new String[]{"COUNT(*) as count"},
                null,
                null,
                null
            );

            int count = 0;
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    count = cursor.getInt(0);
                }
                cursor.close();
            }

            promise.resolve(count);
        } catch (Exception e) {
            Log.e(TAG, "getBlockedCount error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Dahili: Numara engelli mi kontrol et
     */
    private boolean isBlocked(String phoneNumber) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return BlockedNumberContract.isBlocked(getReactApplicationContext(), phoneNumber);
        }
        return false;
    }

    /**
     * Telefon numarasını E.164 formatına normalize et
     */
    private String normalizePhoneNumber(String phoneNumber) {
        // Sadece rakamları al
        String digits = phoneNumber.replaceAll("[^0-9+]", "");

        // Türkiye numarası kontrolü
        if (digits.startsWith("0") && digits.length() == 11) {
            // 05xx... -> +905xx...
            digits = "+90" + digits.substring(1);
        } else if (digits.length() == 10 && digits.startsWith("5")) {
            // 5xx... -> +905xx...
            digits = "+90" + digits;
        } else if (!digits.startsWith("+")) {
            digits = "+" + digits;
        }

        return digits;
    }
}
