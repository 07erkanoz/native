package com.lifecall;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telephony.TelephonyManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.lifecall.services.IncomingCallService;

/**
 * LifeCall - Çağrı Modülü
 *
 * React Native ile Native arasında çağrı işlemlerini yönetir.
 * - Gelen/giden arama yönetimi
 * - Event emission (RN'e bildirim)
 * - Arama cevaplama/reddetme
 */
public class CallModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "CallModule";
    private static ReactApplicationContext reactContext;
    private static CallModule instance;

    // Event isimleri
    public static final String EVENT_INCOMING_CALL = "onIncomingCall";
    public static final String EVENT_CALL_ANSWERED = "onCallAnswered";
    public static final String EVENT_CALL_ENDED = "onCallEnded";
    public static final String EVENT_CALL_ACTIVE = "onCallActive";
    public static final String EVENT_CALL_FAILED = "onCallFailed";

    public CallModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        instance = this;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // Listener sayacı (NativeEventEmitter için gerekli)
    private int listenerCount = 0;

    /**
     * JS tarafından çağrılır - Listener eklendiğinde
     */
    @ReactMethod
    public void addListener(String eventName) {
        listenerCount++;
    }

    /**
     * JS tarafından çağrılır - Listener kaldırıldığında
     */
    @ReactMethod
    public void removeListeners(Integer count) {
        listenerCount -= count;
        if (listenerCount < 0) {
            listenerCount = 0;
        }
    }

    /**
     * Singleton instance
     */
    public static CallModule getInstance() {
        return instance;
    }

    /**
     * React context al
     */
    public static ReactApplicationContext getReactContext() {
        return reactContext;
    }

    // ============================================
    // REACT NATIVE'E EVENT GÖNDERME
    // ============================================

    /**
     * React Native'e event gönder
     */
    public static void sendEvent(String eventName, @Nullable WritableMap params) {
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    /**
     * Gelen arama event'i gönder
     */
    public static void emitIncomingCall(String phoneNumber, String callerName, String photoUri) {
        WritableMap params = Arguments.createMap();
        params.putString("phoneNumber", phoneNumber != null ? phoneNumber : "");
        params.putString("callerName", callerName != null ? callerName : "");
        params.putString("photoUri", photoUri != null ? photoUri : "");
        params.putDouble("timestamp", System.currentTimeMillis());
        sendEvent(EVENT_INCOMING_CALL, params);
    }

    /**
     * Arama cevaplandı event'i
     */
    public static void emitCallAnswered(String phoneNumber) {
        WritableMap params = Arguments.createMap();
        params.putString("phoneNumber", phoneNumber != null ? phoneNumber : "");
        params.putDouble("timestamp", System.currentTimeMillis());
        sendEvent(EVENT_CALL_ANSWERED, params);
    }

    /**
     * Arama bitti event'i
     */
    public static void emitCallEnded(String phoneNumber, String reason) {
        WritableMap params = Arguments.createMap();
        params.putString("phoneNumber", phoneNumber != null ? phoneNumber : "");
        params.putString("reason", reason != null ? reason : "unknown");
        params.putDouble("timestamp", System.currentTimeMillis());
        sendEvent(EVENT_CALL_ENDED, params);
    }

    // ============================================
    // REACT NATIVE'DEN ÇAĞRILAN METHODLAR
    // ============================================

    /**
     * Aramayı cevapla
     */
    @ReactMethod
    public void answerCall(String callId, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                TelecomManager telecomManager =
                        (TelecomManager) reactContext.getSystemService(Context.TELECOM_SERVICE);
                if (telecomManager != null) {
                    telecomManager.acceptRingingCall();
                }
            }

            // Foreground service'i durdur
            Intent intent = new Intent(reactContext, IncomingCallService.class);
            intent.setAction(IncomingCallService.ACTION_ANSWER_CALL);
            reactContext.startService(intent);

            promise.resolve(true);
        } catch (SecurityException e) {
            promise.reject("PERMISSION_DENIED", "Arama cevaplama izni yok", e);
        } catch (Exception e) {
            promise.reject("ERROR", "Arama cevaplanamadı", e);
        }
    }

    /**
     * Aramayı reddet
     */
    @ReactMethod
    public void declineCall(String callId, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                TelecomManager telecomManager =
                        (TelecomManager) reactContext.getSystemService(Context.TELECOM_SERVICE);
                if (telecomManager != null) {
                    telecomManager.endCall();
                }
            }

            // Foreground service'i durdur
            Intent intent = new Intent(reactContext, IncomingCallService.class);
            intent.setAction(IncomingCallService.ACTION_DECLINE_CALL);
            reactContext.startService(intent);

            promise.resolve(true);
        } catch (SecurityException e) {
            promise.reject("PERMISSION_DENIED", "Arama reddetme izni yok", e);
        } catch (Exception e) {
            promise.reject("ERROR", "Arama reddedilemedi", e);
        }
    }

    /**
     * Aktif aramayı sonlandır
     */
    @ReactMethod
    public void endCall(String callId, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                TelecomManager telecomManager =
                        (TelecomManager) reactContext.getSystemService(Context.TELECOM_SERVICE);
                if (telecomManager != null) {
                    telecomManager.endCall();
                }
            }

            // Foreground service'i durdur
            Intent intent = new Intent(reactContext, IncomingCallService.class);
            intent.setAction(IncomingCallService.ACTION_END_CALL);
            reactContext.startService(intent);

            promise.resolve(true);
        } catch (SecurityException e) {
            promise.reject("PERMISSION_DENIED", "Arama sonlandırma izni yok", e);
        } catch (Exception e) {
            promise.reject("ERROR", "Arama sonlandırılamadı", e);
        }
    }

    /**
     * Telefon araması yap
     */
    @ReactMethod
    public void makeCall(String phoneNumber, Promise promise) {
        try {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + phoneNumber));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (reactContext.getCurrentActivity() != null) {
                reactContext.getCurrentActivity().startActivity(intent);
            } else {
                reactContext.startActivity(intent);
            }

            promise.resolve(true);
        } catch (SecurityException e) {
            promise.reject("PERMISSION_DENIED", "Arama yapma izni yok", e);
        } catch (Exception e) {
            promise.reject("ERROR", "Arama yapılamadı", e);
        }
    }

    /**
     * Aramayı beklet
     */
    @ReactMethod
    public void holdCall(String callId, boolean hold, Promise promise) {
        try {
            // TODO: ConnectionService üzerinden hold yönetimi
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Hold işlemi başarısız", e);
        }
    }

    /**
     * Mikrofonu sessize al
     */
    @ReactMethod
    public void setMuted(boolean muted, Promise promise) {
        try {
            android.media.AudioManager audioManager =
                    (android.media.AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setMicrophoneMute(muted);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Mikrofon ayarlanamadı", e);
        }
    }

    /**
     * Hoparlörü aç/kapa
     */
    @ReactMethod
    public void setSpeakerphone(boolean enabled, Promise promise) {
        try {
            android.media.AudioManager audioManager =
                    (android.media.AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setSpeakerphoneOn(enabled);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Hoparlör ayarlanamadı", e);
        }
    }

    /**
     * DTMF tonu gönder
     */
    @ReactMethod
    public void sendDTMF(String callId, String digit, Promise promise) {
        try {
            // TODO: ConnectionService üzerinden DTMF
            android.media.ToneGenerator toneGenerator = new android.media.ToneGenerator(
                    android.media.AudioManager.STREAM_DTMF, 100);

            int tone = getToneFromDigit(digit);
            if (tone >= 0) {
                toneGenerator.startTone(tone, 150);
            }
            toneGenerator.release();

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "DTMF gönderilemedi", e);
        }
    }

    /**
     * Digit'ten DTMF tonu al
     */
    private int getToneFromDigit(String digit) {
        switch (digit) {
            case "0": return android.media.ToneGenerator.TONE_DTMF_0;
            case "1": return android.media.ToneGenerator.TONE_DTMF_1;
            case "2": return android.media.ToneGenerator.TONE_DTMF_2;
            case "3": return android.media.ToneGenerator.TONE_DTMF_3;
            case "4": return android.media.ToneGenerator.TONE_DTMF_4;
            case "5": return android.media.ToneGenerator.TONE_DTMF_5;
            case "6": return android.media.ToneGenerator.TONE_DTMF_6;
            case "7": return android.media.ToneGenerator.TONE_DTMF_7;
            case "8": return android.media.ToneGenerator.TONE_DTMF_8;
            case "9": return android.media.ToneGenerator.TONE_DTMF_9;
            case "*": return android.media.ToneGenerator.TONE_DTMF_S;
            case "#": return android.media.ToneGenerator.TONE_DTMF_P;
            default: return -1;
        }
    }

    /**
     * Mevcut arama durumunu kontrol et
     */
    @ReactMethod
    public void getCallState(Promise promise) {
        try {
            TelephonyManager telephonyManager =
                    (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);

            if (telephonyManager != null) {
                int state = telephonyManager.getCallState();
                WritableMap result = Arguments.createMap();

                switch (state) {
                    case TelephonyManager.CALL_STATE_IDLE:
                        result.putString("state", "idle");
                        break;
                    case TelephonyManager.CALL_STATE_RINGING:
                        result.putString("state", "ringing");
                        break;
                    case TelephonyManager.CALL_STATE_OFFHOOK:
                        result.putString("state", "active");
                        break;
                }

                promise.resolve(result);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Arama durumu alınamadı", e);
        }
    }

    /**
     * Gelen arama bildirimini göster (Native'den çağrılır)
     */
    public static void showIncomingCallNotification(Context context, String phoneNumber, String callerName) {
        Intent intent = new Intent(context, IncomingCallService.class);
        intent.setAction(IncomingCallService.ACTION_INCOMING_CALL);
        intent.putExtra(IncomingCallService.EXTRA_PHONE_NUMBER, phoneNumber);
        intent.putExtra(IncomingCallService.EXTRA_CALLER_NAME, callerName);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        // React Native'e de bildir
        emitIncomingCall(phoneNumber, callerName, null);
    }
}
