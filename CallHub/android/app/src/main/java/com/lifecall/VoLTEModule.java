package com.lifecall;

import android.content.Context;
import android.os.Build;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import com.lifecall.services.LifeCallInCallService;

import java.lang.reflect.Method;

/**
 * VoLTE/HD Voice tespit modülü
 *
 * Arama sırasında HD rozeti göstermek için kullanılır.
 * VoLTE etkin ve IMS kayıtlıysa, arama HD kalitesindedir.
 */
public class VoLTEModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private TelephonyManager telephonyManager;

    public VoLTEModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
    }

    @NonNull
    @Override
    public String getName() {
        return "VoLTEModule";
    }

    /**
     * VoLTE durumunu kontrol et
     *
     * @param promise - Sonuç:
     *   - isVolteSupported: Cihaz VoLTE destekliyor mu
     *   - isVolteEnabled: VoLTE şu an etkin mi (IMS kayıtlı)
     *   - isHdVoiceCapable: HD ses destekleniyor mu
     *   - networkType: Mevcut ağ türü (LTE, 5G, vb.)
     *   - isHdCall: Arama HD kalitesinde mi (tahmini)
     */
    @ReactMethod
    public void getVoLTEStatus(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();

            // Cihaz VoLTE destekliyor mu?
            boolean isVolteSupported = checkVolteSupport();
            result.putBoolean("isVolteSupported", isVolteSupported);

            // VoLTE etkin mi? (IMS kayıtlı mı?)
            boolean isVolteEnabled = checkVolteEnabled();
            result.putBoolean("isVolteEnabled", isVolteEnabled);

            // HD Voice destekleniyor mu?
            boolean isHdVoiceCapable = checkHdVoiceCapability();
            result.putBoolean("isHdVoiceCapable", isHdVoiceCapable);

            // Mevcut ağ türü
            String networkType = getNetworkTypeName();
            result.putString("networkType", networkType);

            // Tahmini HD durumu
            // VoLTE etkin + LTE/5G ağında = HD arama
            boolean isHdCall = isVolteEnabled && (networkType.equals("LTE") || networkType.equals("5G"));
            result.putBoolean("isHdCall", isHdCall);

            // Ek bilgiler
            result.putString("carrier", getCarrierName());
            result.putBoolean("isRoaming", isRoaming());

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("VOLTE_ERROR", "VoLTE durumu alınamadı: " + e.getMessage(), e);
        }
    }

    /**
     * Sadece HD durumunu kontrol et (hızlı kontrol)
     *
     * Aktif arama varsa GERÇEK HD durumunu döndürür.
     * Call.Details.PROPERTY_HIGH_DEF_AUDIO kullanır.
     */
    @ReactMethod
    public void isHdCall(Promise promise) {
        try {
            // Önce aktif arama var mı ve InCallService çalışıyor mu kontrol et
            if (LifeCallInCallService.hasActiveCall()) {
                // GERÇEK HD durumu - sistem tarafından belirlenir
                boolean isHd = LifeCallInCallService.isActiveCallHd();
                promise.resolve(isHd);
                return;
            }

            // Aktif arama yoksa, VoLTE durumuna göre tahmin et
            boolean isVolteEnabled = checkVolteEnabled();
            String networkType = getNetworkTypeName();
            boolean isHd = isVolteEnabled && (networkType.equals("LTE") || networkType.equals("5G"));
            promise.resolve(isHd);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    /**
     * Aktif aramanın GERÇEK HD durumunu al
     *
     * Bu metod Call.Details.PROPERTY_HIGH_DEF_AUDIO kullanır.
     * Sadece aktif arama varsa çalışır.
     */
    @ReactMethod
    public void getActiveCallHdStatus(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();

            if (LifeCallInCallService.hasActiveCall()) {
                // GERÇEK HD durumu
                boolean isHd = LifeCallInCallService.isActiveCallHd();
                result.putBoolean("hasActiveCall", true);
                result.putBoolean("isHdAudio", isHd);
                result.putString("source", "system"); // Gerçek sistem verisi
            } else {
                result.putBoolean("hasActiveCall", false);
                result.putBoolean("isHdAudio", false);
                result.putString("source", "none");
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("HD_CHECK_ERROR", "HD durumu alınamadı: " + e.getMessage(), e);
        }
    }

    /**
     * Cihazın VoLTE desteğini kontrol et
     */
    private boolean checkVolteSupport() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ için
                // isVolteAvailable() hidden API olduğu için reflection kullanıyoruz
                Method method = TelephonyManager.class.getMethod("isVolteAvailable");
                Object result = method.invoke(telephonyManager);
                if (result instanceof Boolean) {
                    return (Boolean) result;
                }
            }
        } catch (Exception e) {
            // Hidden API erişilemezse, ağ türüne göre tahmin et
        }

        // Fallback: LTE destekliyorsa VoLTE de muhtemelen desteklenir
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                int networkType = telephonyManager.getDataNetworkType();
                return networkType == TelephonyManager.NETWORK_TYPE_LTE ||
                       networkType == TelephonyManager.NETWORK_TYPE_NR;
            }
        } catch (SecurityException e) {
            // İzin yoksa
        }

        return false;
    }

    /**
     * VoLTE'nin şu an etkin olup olmadığını kontrol et
     */
    private boolean checkVolteEnabled() {
        try {
            // Yöntem 1: isImsRegistered (hidden API)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    Method method = TelephonyManager.class.getMethod("isImsRegistered");
                    Object result = method.invoke(telephonyManager);
                    if (result instanceof Boolean && (Boolean) result) {
                        return true;
                    }
                } catch (Exception e) {
                    // Hidden API erişilemez
                }
            }

            // Yöntem 2: ImsMmTelManager (API 30+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    // ImsManager kullanarak kontrol et
                    // Not: Bu READ_PRIVILEGED_PHONE_STATE gerektirir, normal uygulamalar için çalışmayabilir
                    return checkImsMmTelStatus();
                } catch (Exception e) {
                    // İzin yoksa
                }
            }

            // Yöntem 3: Ağ türü ve ses durumu kontrolü
            return checkNetworkBasedVolte();

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * ImsMmTelManager ile VoLTE durumu (API 30+)
     */
    private boolean checkImsMmTelStatus() {
        // Bu metod sistem uygulamaları için çalışır
        // Normal uygulamalar için false döner
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // ImsManager'a erişim dene
                Class<?> imsManagerClass = Class.forName("android.telephony.ims.ImsManager");
                Method getImsMmTelManager = imsManagerClass.getMethod("getImsMmTelManager", int.class);

                int subId = SubscriptionManager.getDefaultSubscriptionId();
                Object mmTelManager = getImsMmTelManager.invoke(
                    reactContext.getSystemService("telephony_ims"),
                    subId
                );

                if (mmTelManager != null) {
                    // isAvailable metodunu çağır
                    Method isAvailable = mmTelManager.getClass().getMethod(
                        "isAvailable", int.class, int.class
                    );
                    // CAPABILITY_TYPE_VOICE = 1, REGISTRATION_TECH_LTE = 0
                    Object result = isAvailable.invoke(mmTelManager, 1, 0);
                    if (result instanceof Boolean) {
                        return (Boolean) result;
                    }
                }
            }
        } catch (Exception e) {
            // İzin veya API erişimi yok
        }
        return false;
    }

    /**
     * Ağ türüne göre VoLTE tahmini
     */
    private boolean checkNetworkBasedVolte() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                int voiceNetworkType = telephonyManager.getVoiceNetworkType();

                // LTE veya NR (5G) üzerinden ses = VoLTE/VoNR
                return voiceNetworkType == TelephonyManager.NETWORK_TYPE_LTE ||
                       voiceNetworkType == TelephonyManager.NETWORK_TYPE_NR ||
                       voiceNetworkType == TelephonyManager.NETWORK_TYPE_LTE_CA;
            }
        } catch (SecurityException e) {
            // READ_PHONE_STATE izni gerekli
        }
        return false;
    }

    /**
     * HD Voice desteğini kontrol et
     */
    private boolean checkHdVoiceCapability() {
        // VoLTE destekliyorsa HD Voice de muhtemelen desteklenir
        // Çünkü VoLTE AMR-WB (HD) veya EVS (HD+) codec kullanır
        return checkVolteSupport();
    }

    /**
     * Mevcut ağ türü adını al
     */
    private String getNetworkTypeName() {
        try {
            int networkType;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                networkType = telephonyManager.getDataNetworkType();
            } else {
                networkType = telephonyManager.getNetworkType();
            }

            switch (networkType) {
                case TelephonyManager.NETWORK_TYPE_LTE:
                case TelephonyManager.NETWORK_TYPE_LTE_CA:
                    return "LTE";
                case TelephonyManager.NETWORK_TYPE_NR:
                    return "5G";
                case TelephonyManager.NETWORK_TYPE_HSDPA:
                case TelephonyManager.NETWORK_TYPE_HSUPA:
                case TelephonyManager.NETWORK_TYPE_HSPA:
                case TelephonyManager.NETWORK_TYPE_HSPAP:
                    return "3G+";
                case TelephonyManager.NETWORK_TYPE_UMTS:
                    return "3G";
                case TelephonyManager.NETWORK_TYPE_EDGE:
                    return "2G";
                case TelephonyManager.NETWORK_TYPE_GPRS:
                    return "2G";
                case TelephonyManager.NETWORK_TYPE_IWLAN:
                    return "WiFi";
                default:
                    return "Unknown";
            }
        } catch (SecurityException e) {
            return "Unknown";
        }
    }

    /**
     * Operatör adını al
     */
    private String getCarrierName() {
        try {
            String carrier = telephonyManager.getNetworkOperatorName();
            return carrier != null && !carrier.isEmpty() ? carrier : "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    /**
     * Roaming durumunu kontrol et
     */
    private boolean isRoaming() {
        try {
            return telephonyManager.isNetworkRoaming();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * WiFi Calling aktif mi kontrol et
     */
    @ReactMethod
    public void isWifiCallingEnabled(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    Method method = TelephonyManager.class.getMethod("isWifiCallingAvailable");
                    Object result = method.invoke(telephonyManager);
                    if (result instanceof Boolean) {
                        promise.resolve((Boolean) result);
                        return;
                    }
                } catch (Exception e) {
                    // Hidden API erişilemez
                }
            }

            // Fallback: IWLAN ağ türü kontrolü
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                int networkType = telephonyManager.getVoiceNetworkType();
                promise.resolve(networkType == TelephonyManager.NETWORK_TYPE_IWLAN);
                return;
            }

            promise.resolve(false);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}
