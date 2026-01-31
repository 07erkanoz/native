# LifeCall - VoLTE/HD Arama Tespiti Araştırması

Bu doküman Android'de VoLTE (Voice over LTE) ve HD Voice tespit etme yöntemlerini içerir.

---

## 1. VoLTE Nedir?

- **VoLTE** (Voice over LTE): LTE ağı üzerinden ses iletimi
- **HD Voice**: Geniş bant ses codec'leri kullanarak daha yüksek kaliteli ses
- **EVS** (Enhanced Voice Services): HD Voice'un gelişmiş versiyonu (HD+)

---

## 2. Android API'leri

### 2.1 ImsMmTelManager (API 30+)

IMS (IP Multimedia Subsystem) MmTel özelliklerini kontrol etmek için kullanılır.

```java
// ImsMmTelManager instance al
ImsManager imsManager = (ImsManager) context.getSystemService(Context.TELEPHONY_IMS_SERVICE);
ImsMmTelManager mmTelManager = imsManager.getImsMmTelManager(subscriptionId);

// VoLTE capability kontrol
mmTelManager.isAvailable(
    MmTelFeature.MmTelCapabilities.CAPABILITY_TYPE_VOICE,
    ImsRegistrationImplBase.REGISTRATION_TECH_LTE
);
```

**Gerekli İzinler:**
- `android.permission.READ_PRIVILEGED_PHONE_STATE` (sistem izni)
- `android.permission.READ_PRECISE_PHONE_STATE` (API 30+)

### 2.2 TelephonyManager

```java
TelephonyManager tm = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);

// VoLTE desteği var mı? (Cihaz seviyesi)
boolean isVolteAvailable = tm.isVolteAvailable(); // Hidden API

// IMS kayıt durumu
int imsState = tm.getImsMmTelRegistrationState(); // API 31+
```

### 2.3 TelephonyCallback (API 31+)

```java
// Arama durumu değişikliklerini dinle
telephonyManager.registerTelephonyCallback(executor, new TelephonyCallback() {
    @Override
    public void onCallStateChanged(int state) {
        // CALL_STATE_IDLE, CALL_STATE_RINGING, CALL_STATE_OFFHOOK
    }

    // IMS kayıt durumu
    @Override
    public void onImsRegistrationStateChanged(ImsReasonInfo info) {
        // IMS kayıt değişiklikleri
    }
});
```

---

## 3. HD Voice Tespiti - Mevcut Yöntemler

### 3.1 Yöntem 1: IMS Kayıt Durumu (Önerilen)

```java
public class VoLTEChecker {

    public static boolean isVolteRegistered(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) { // API 30+
            try {
                TelephonyManager tm = context.getSystemService(TelephonyManager.class);
                ImsManager imsManager = context.getSystemService(ImsManager.class);

                if (imsManager != null) {
                    ImsMmTelManager mmTelManager = imsManager.getImsMmTelManager(
                        SubscriptionManager.getDefaultSubscriptionId()
                    );

                    // IMS kayıtlı mı kontrol et
                    return mmTelManager.isAvailable(
                        MmTelFeature.MmTelCapabilities.CAPABILITY_TYPE_VOICE,
                        ImsRegistrationImplBase.REGISTRATION_TECH_LTE
                    );
                }
            } catch (Exception e) {
                Log.e("VoLTE", "VoLTE check failed", e);
            }
        }
        return false;
    }
}
```

### 3.2 Yöntem 2: Sistem Özelliklerini Kontrol

```java
// Bazı cihazlarda çalışır
public static boolean checkVolteSystemProperty() {
    try {
        String volteEnabled = System.getProperty("persist.dbg.volte_avail_ovr");
        return "1".equals(volteEnabled);
    } catch (Exception e) {
        return false;
    }
}
```

### 3.3 Yöntem 3: Hidden Radio Info (Kullanıcı için)

Kullanıcılar manuel olarak kontrol edebilir:
1. Telefon uygulamasında `*#*#4636#*#*` çevir
2. "Phone information" seç
3. "IMS Status" bölümüne bak:
   - `IMS Registration: Registered` = VoLTE aktif
   - `Voice over LTE: Available` = VoLTE kullanılabilir

---

## 4. Aktif Arama Sırasında HD Tespiti

### 4.1 ImsCallProfile (Sistem API)

```java
// Bu API sistem uygulamaları için
ImsCallProfile profile = imsCall.getCallProfile();

// Ses codec'i
int audioCodec = profile.getMediaProfile().getAudioCodec();

// HD ses mi?
boolean isHdAudio = (audioCodec == ImsStreamMediaProfile.AUDIO_QUALITY_AMR_WB ||
                     audioCodec == ImsStreamMediaProfile.AUDIO_QUALITY_EVS);
```

**Not:** Bu API sistem imzası gerektirir ve normal uygulamalar kullanamaz.

### 4.2 Call Codec Bilgisi (Android 12+)

```java
// API 31+ için
Call.Details details = call.getDetails();
String codecType = details.getExtras().getString("call_codec"); // Bazı cihazlarda
```

### 4.3 AudioManager ile Kalite İpucu

```java
AudioManager audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);

// Aktif ses modu
int mode = audioManager.getMode(); // MODE_IN_CALL

// HD/HQ ses aktif mi? (dolaylı kontrol)
// Not: Bu kesin sonuç vermez
```

---

## 5. Sınırlamalar

| Özellik | Normal Uygulama | Sistem Uygulaması |
|---------|-----------------|-------------------|
| VoLTE kayıt durumu | ⚠️ Kısıtlı (API 30+) | ✅ Tam erişim |
| Aktif arama codec'i | ❌ Erişilemez | ✅ ImsCallProfile |
| HD Voice göstergesi | ❌ Erişilemez | ✅ Sistem UI |
| Çağrı kalite metrikleri | ❌ Erişilemez | ✅ ImsCall |

**Sonuç:** Normal Android uygulamaları aktif arama sırasında HD Voice durumunu güvenilir şekilde tespit edemez. Bu bilgi sistem seviyesinde korunur.

---

## 6. LifeCall için Önerilen Yaklaşım

### 6.1 VoLTE Göstergesi (Mümkün)

Arama başlamadan önce VoLTE'nin kullanılabilir olup olmadığını gösterebiliriz:

```typescript
// React Native tarafı
interface VoLTEStatus {
  isVolteAvailable: boolean;  // Cihaz destekliyor mu
  isVolteEnabled: boolean;    // Kullanıcı açmış mı
  isImsRegistered: boolean;   // IMS kayıtlı mı
}
```

**UI Gösterimi:**
- Arama ekranında: "VoLTE" veya "HD" rozeti
- Sadece VoLTE etkinse göster
- Sistem durumuna göre güncelle

### 6.2 Native Modül Önerisi

```java
// VoLTEModule.java
@ReactModule(name = "VoLTEModule")
public class VoLTEModule extends ReactContextBaseJavaModule {

    @ReactMethod
    public void getVoLTEStatus(Promise promise) {
        WritableMap result = Arguments.createMap();

        // Cihaz VoLTE destekliyor mu?
        result.putBoolean("isSupported", checkVolteSupport());

        // IMS kayıtlı mı?
        result.putBoolean("isRegistered", checkImsRegistration());

        promise.resolve(result);
    }

    private boolean checkVolteSupport() {
        // TelephonyManager ile kontrol
        // Carrier config kontrolü
        return true; // Placeholder
    }

    private boolean checkImsRegistration() {
        // ImsMmTelManager ile kontrol (API 30+)
        return false; // Placeholder
    }
}
```

### 6.3 Basit UI Gösterimi

```
┌─────────────────────────────────┐
│    📞 Arıyor...                 │
│                                 │
│    +90 532 XXX XX XX            │
│    🇹🇷 Türkiye                  │
│                                 │
│    [HD] VoLTE                   │  ← Sadece VoLTE aktifse göster
│                                 │
└─────────────────────────────────┘
```

---

## 7. Alternatif: Codec Tahmin Yöntemi

VoLTE aktifse, büyük olasılıkla HD codec kullanılıyordur:

| Bağlantı Türü | Muhtemel Codec | Kalite |
|---------------|----------------|--------|
| 2G (GSM) | AMR-NB | Düşük |
| 3G (UMTS) | AMR-NB/WB | Orta |
| VoLTE | AMR-WB / EVS | Yüksek (HD) |
| WiFi Calling | AMR-WB / EVS | Yüksek (HD) |
| 5G (VoNR) | EVS | Çok Yüksek (HD+) |

Bu bilgiyle, ağ türüne göre "tahmini" HD durumu gösterebiliriz.

---

## 8. Sonuç

1. **VoLTE durumunu** arama öncesi gösterebiliriz ✅
2. **Aktif arama HD durumunu** güvenilir şekilde tespit edemeyiz ❌
3. **Ağ türüne göre tahmin** yapabiliriz ⚠️

**Öneri:**
- VoLTE etkin ve IMS kayıtlıysa "HD" rozeti göster
- Kullanıcıya "VoLTE" etkinken HD kalite beklenmeli şeklinde bilgi ver
- Aktif arama sırasında codec bilgisi gösterme (güvenilir değil)

---

## Kaynaklar

- [Android ImsMmTelManager API](https://developer.android.com/reference/android/telephony/ims/ImsMmTelManager)
- [Android TelephonyManager](https://developer.android.com/reference/android/telephony/TelephonyManager)
- [Voice over LTE - Wikipedia](https://en.wikipedia.org/wiki/Voice_over_LTE)
- [How to Check VoLTE on Android](https://medium.com/@jamesdwho/how-to-check-for-working-volte-calling-on-android-8c343362ecfe)

---

*Son Güncelleme: Ocak 2026*
