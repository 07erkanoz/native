package com.lifecall.services;

import android.os.Build;
import android.telecom.Call;
import android.telecom.InCallService;
import android.telecom.VideoProfile;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.lifecall.CallModule;

/**
 * LifeCall - InCallService
 *
 * Android Telecom API üzerinden arama yönetimi.
 * Bu servis varsayılan arayıcı olarak seçildiğinde çalışır.
 *
 * HD Voice tespiti bu servis üzerinden yapılır:
 * Call.Details.PROPERTY_HIGH_DEF_AUDIO
 */
public class LifeCallInCallService extends InCallService {

    private static final String TAG = "LifeCallInCallService";

    // Aktif çağrı referansı
    private static Call activeCall;
    private static LifeCallInCallService instance;

    // Event isimleri
    public static final String EVENT_CALL_STATE_CHANGED = "onCallStateChanged";
    public static final String EVENT_HD_AUDIO_CHANGED = "onHdAudioChanged";

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.d(TAG, "LifeCallInCallService created");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        activeCall = null;
        Log.d(TAG, "LifeCallInCallService destroyed");
    }

    /**
     * Yeni çağrı eklendiğinde
     */
    @Override
    public void onCallAdded(Call call) {
        super.onCallAdded(call);
        Log.d(TAG, "Call added: " + call);

        activeCall = call;

        // Callback ekle
        call.registerCallback(callCallback);

        // İlk durumu gönder
        sendCallState(call);
        sendHdAudioState(call);
    }

    /**
     * Çağrı kaldırıldığında
     */
    @Override
    public void onCallRemoved(Call call) {
        super.onCallRemoved(call);
        Log.d(TAG, "Call removed: " + call);

        call.unregisterCallback(callCallback);

        if (activeCall == call) {
            activeCall = null;
        }

        // Çağrı bitti event'i
        WritableMap params = Arguments.createMap();
        params.putString("state", "disconnected");
        params.putBoolean("isHdAudio", false);
        CallModule.sendEvent(EVENT_CALL_STATE_CHANGED, params);
    }

    /**
     * Call callback - durum değişikliklerini dinle
     */
    private final Call.Callback callCallback = new Call.Callback() {
        @Override
        public void onStateChanged(Call call, int state) {
            super.onStateChanged(call, state);
            Log.d(TAG, "Call state changed: " + stateToString(state));
            sendCallState(call);
        }

        @Override
        public void onDetailsChanged(Call call, Call.Details details) {
            super.onDetailsChanged(call, details);
            Log.d(TAG, "Call details changed");

            // HD ses durumu değişti mi kontrol et
            sendHdAudioState(call);
        }

        @Override
        public void onVideoCallChanged(Call call, InCallService.VideoCall videoCall) {
            super.onVideoCallChanged(call, videoCall);
            Log.d(TAG, "Video call changed");
        }
    };

    /**
     * Çağrı durumunu React Native'e gönder
     */
    private void sendCallState(Call call) {
        if (call == null) return;

        WritableMap params = Arguments.createMap();
        params.putString("state", stateToString(call.getState()));
        params.putBoolean("isHdAudio", isHdAudio(call));
        params.putString("phoneNumber", getPhoneNumber(call));

        // Ek bilgiler
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Call.Details details = call.getDetails();
            if (details != null) {
                params.putBoolean("isVoLTE", isVoLTECall(details));
                params.putBoolean("isWifiCall", isWifiCall(details));
                params.putBoolean("isVideoCall", isVideoCall(details));
                params.putBoolean("isConference", details.hasProperty(Call.Details.PROPERTY_CONFERENCE));
            }
        }

        CallModule.sendEvent(EVENT_CALL_STATE_CHANGED, params);
    }

    /**
     * HD ses durumunu React Native'e gönder
     */
    private void sendHdAudioState(Call call) {
        if (call == null) return;

        boolean isHd = isHdAudio(call);

        WritableMap params = Arguments.createMap();
        params.putBoolean("isHdAudio", isHd);
        params.putString("phoneNumber", getPhoneNumber(call));
        params.putString("audioQuality", getAudioQualityString(call));

        CallModule.sendEvent(EVENT_HD_AUDIO_CHANGED, params);
    }

    /**
     * Çağrının HD ses kullanıp kullanmadığını kontrol et
     *
     * Bu GERÇEK HD durumunu döndürür!
     * Call.Details.PROPERTY_HIGH_DEF_AUDIO sistem tarafından ayarlanır.
     */
    public static boolean isHdAudio(Call call) {
        if (call == null) return false;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Call.Details details = call.getDetails();
                if (details != null) {
                    // PROPERTY_HIGH_DEF_AUDIO (API 23+)
                    // Bu özellik HD ses aktifse true döner
                    return details.hasProperty(Call.Details.PROPERTY_HIGH_DEF_AUDIO);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "HD audio check failed", e);
        }

        return false;
    }

    /**
     * Aktif çağrının HD durumunu kontrol et (static erişim için)
     */
    public static boolean isActiveCallHd() {
        return isHdAudio(activeCall);
    }

    /**
     * VoLTE çağrısı mı kontrol et
     */
    private boolean isVoLTECall(Call.Details details) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // PROPERTY_VOLTE (API 23+) - Bazı cihazlarda mevcut
            try {
                // PROPERTY_VOLTE = 0x00000100
                return details.hasProperty(0x00000100);
            } catch (Exception e) {
                // Property mevcut değilse
            }

            // Alternatif: HD audio + IMS handle = VoLTE
            if (details.hasProperty(Call.Details.PROPERTY_HIGH_DEF_AUDIO)) {
                // Yüksek ihtimalle VoLTE
                return true;
            }
        }
        return false;
    }

    /**
     * WiFi Calling mi kontrol et
     */
    private boolean isWifiCall(Call.Details details) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // PROPERTY_WIFI (API 23+)
            try {
                return details.hasProperty(Call.Details.PROPERTY_WIFI);
            } catch (Exception e) {
                // Property mevcut değilse
            }
        }
        return false;
    }

    /**
     * Video çağrısı mı kontrol et
     */
    private boolean isVideoCall(Call.Details details) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int videoState = details.getVideoState();
            return videoState != VideoProfile.STATE_AUDIO_ONLY;
        }
        return false;
    }

    /**
     * Ses kalitesi string'i al
     */
    private String getAudioQualityString(Call call) {
        if (call == null) return "unknown";

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Call.Details details = call.getDetails();
                if (details != null) {
                    boolean isHd = details.hasProperty(Call.Details.PROPERTY_HIGH_DEF_AUDIO);
                    boolean isWifi = false;

                    try {
                        isWifi = details.hasProperty(Call.Details.PROPERTY_WIFI);
                    } catch (Exception e) {
                        // PROPERTY_WIFI mevcut değil
                    }

                    if (isWifi && isHd) {
                        return "hd_wifi"; // WiFi Calling HD
                    } else if (isHd) {
                        return "hd"; // VoLTE HD
                    } else if (isWifi) {
                        return "wifi"; // WiFi Calling (HD olmadan)
                    } else {
                        return "standard"; // Normal çağrı
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Audio quality check failed", e);
        }

        return "standard";
    }

    /**
     * Telefon numarasını al
     */
    private String getPhoneNumber(Call call) {
        if (call == null) return "";

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Call.Details details = call.getDetails();
                if (details != null && details.getHandle() != null) {
                    String number = details.getHandle().getSchemeSpecificPart();
                    return number != null ? number : "";
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Phone number extraction failed", e);
        }

        return "";
    }

    /**
     * State'i string'e çevir
     */
    private String stateToString(int state) {
        switch (state) {
            case Call.STATE_NEW:
                return "new";
            case Call.STATE_DIALING:
                return "dialing";
            case Call.STATE_RINGING:
                return "ringing";
            case Call.STATE_HOLDING:
                return "holding";
            case Call.STATE_ACTIVE:
                return "active";
            case Call.STATE_DISCONNECTED:
                return "disconnected";
            case Call.STATE_CONNECTING:
                return "connecting";
            case Call.STATE_DISCONNECTING:
                return "disconnecting";
            case Call.STATE_SELECT_PHONE_ACCOUNT:
                return "select_account";
            case Call.STATE_PULLING_CALL:
                return "pulling";
            default:
                return "unknown";
        }
    }

    // ==========================================
    // STATIC METHODS (React Native'den erişim)
    // ==========================================

    /**
     * Aktif çağrıyı yanıtla
     */
    public static boolean answerActiveCall() {
        if (activeCall != null) {
            activeCall.answer(VideoProfile.STATE_AUDIO_ONLY);
            return true;
        }
        return false;
    }

    /**
     * Aktif çağrıyı reddet/sonlandır
     */
    public static boolean disconnectActiveCall() {
        if (activeCall != null) {
            activeCall.disconnect();
            return true;
        }
        return false;
    }

    /**
     * Aktif çağrıyı beklet
     */
    public static boolean holdActiveCall(boolean hold) {
        if (activeCall != null) {
            if (hold) {
                activeCall.hold();
            } else {
                activeCall.unhold();
            }
            return true;
        }
        return false;
    }

    /**
     * DTMF tonu gönder
     */
    public static boolean playDtmf(char digit) {
        if (activeCall != null) {
            activeCall.playDtmfTone(digit);
            return true;
        }
        return false;
    }

    /**
     * DTMF tonunu durdur
     */
    public static boolean stopDtmf() {
        if (activeCall != null) {
            activeCall.stopDtmfTone();
            return true;
        }
        return false;
    }

    /**
     * Instance var mı kontrol et
     */
    public static boolean isServiceRunning() {
        return instance != null;
    }

    /**
     * Aktif çağrı var mı
     */
    public static boolean hasActiveCall() {
        return activeCall != null;
    }
}
