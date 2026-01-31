# LifeCall - Proje Geliştirme Planı

## Proje Özeti
LifeCall, Android için geliştirilmiş kapsamlı bir telefon, rehber, takvim ve notlar uygulamasıdır.

**Teknolojiler:**
- React Native 0.76+
- TypeScript
- Redux Toolkit + Redux Persist
- React Navigation 6
- React Native Paper (Material Design 3)
- i18next (Çoklu Dil)
- Native Android Modüller (Java)

---

## Faz 1: Temel Altyapı ✅ TAMAMLANDI

### 1.1 Proje Kurulumu ✅
- [x] React Native projesi oluşturma
- [x] TypeScript yapılandırması
- [x] ESLint ve Prettier kurulumu
- [x] Klasör yapısı organizasyonu

### 1.2 Navigasyon ✅
- [x] React Navigation kurulumu
- [x] Bottom Tab Navigator (5 sekme)
- [x] Stack Navigator (detay ekranları)
- [x] Navigation types tanımları

### 1.3 State Yönetimi ✅
- [x] Redux Toolkit kurulumu
- [x] Redux Persist entegrasyonu
- [x] Contacts slice
- [x] Calls slice
- [x] Settings slice
- [x] Theme slice

### 1.4 Tema Sistemi ✅
- [x] Light/Dark tema desteği
- [x] Material Design 3 renkleri
- [x] Özel tema yapısı (callColors dahil)
- [x] Tema mağazası sistemi
- [x] ThemeProvider bileşeni

### 1.5 Çoklu Dil Desteği ✅
- [x] i18next kurulumu
- [x] Türkçe çeviriler (tr.json)
- [x] İngilizce çeviriler (en.json)
- [x] Dil değiştirme özelliği

---

## Faz 2: Kişiler Modülü ✅ TAMAMLANDI

### 2.1 Kişi Listesi ✅
- [x] ContactsScreen - Ana kişi listesi
- [x] Arama ve filtreleme
- [x] Alfabe indeksi
- [x] Kişi avatarları

### 2.2 Kişi Detay ✅
- [x] ContactDetailScreen
- [x] Telefon numaraları listesi
- [x] E-posta adresleri
- [x] Adres bilgileri
- [x] Hızlı eylemler (ara, mesaj)

### 2.3 Kişi Düzenleme ✅
- [x] ContactEditScreen
- [x] Yeni kişi ekleme
- [x] Mevcut kişi düzenleme
- [x] Fotoğraf seçimi
- [x] Çoklu telefon/email desteği

### 2.4 Favoriler ✅
- [x] FavoritesScreen - Grid görünüm
- [x] Favori ekleme/çıkarma
- [x] Hızlı arama

---

## Faz 3: Arama Modülü ✅ TAMAMLANDI

### 3.1 Tuş Takımı ✅
- [x] DialerScreen
- [x] T9 arama desteği
- [x] Numara formatlama
- [x] Hızlı arama

### 3.2 Arama Geçmişi ✅
- [x] CallsScreen
- [x] Tarih gruplaması (Bugün, Dün, vb.)
- [x] Filtre çipleri (Tümü, Cevapsız, Gelen, Giden)
- [x] Arama detayları
- [x] react-native-call-log entegrasyonu

### 3.3 Gelen Arama Ekranı ✅
- [x] IncomingCallScreen - Tam ekran UI
- [x] Kaydırarak cevaplama
- [x] Hızlı SMS yanıtları
- [x] Tema desteği

### 3.4 Devam Eden Arama Ekranı ✅
- [x] OngoingCallScreen
- [x] Arama kontrolleri (Mute, Speaker, Hold)
- [x] DTMF tuş takımı
- [x] Arama süresi gösterimi
- [x] Tema desteği

### 3.5 Floating UI Sistemi ✅
- [x] FloatingCallBubble - Sürüklenebilir balon
- [x] FloatingCallNotification - Mini popup
- [x] CallOverlay - Uygulama seviyesi yönetici
- [x] Overlay izin kontrolü
- [x] Tema desteği

### 3.6 Çağrı Durum Yönetimi ✅
- [x] CallStateManager servisi
- [x] Çağrı durumları (idle, incoming, connected, vb.)
- [x] App state takibi (foreground/background)
- [x] Native event dinleyicileri

---

## Faz 4: Native Android Modülleri ✅ TAMAMLANDI

### 4.1 Varsayılan Uygulama Kaydı ✅
- [x] DefaultAppModule
- [x] RoleManager (Android 10+)
- [x] TelecomManager
- [x] PhoneAccount kaydı

### 4.2 İzin Yönetimi ✅
- [x] PermissionsModule
- [x] Kişiler izni
- [x] Telefon izni
- [x] Arama geçmişi izni
- [x] Bildirim izni
- [x] Overlay izni (SYSTEM_ALERT_WINDOW)

### 4.3 Çağrı Modülü ✅
- [x] CallModule (Java)
- [x] CallModule.ts (TypeScript wrapper)
- [x] answerCall / declineCall / endCall
- [x] makeCall
- [x] setMuted / setSpeakerphone
- [x] sendDTMF
- [x] Native event emission
- [x] NativeEventEmitter entegrasyonu

### 4.4 Servisler ve Receiver'lar ✅
- [x] CallConnectionService
- [x] IncomingCallService (Foreground)
- [x] PhoneStateReceiver
- [x] BootReceiver

### 4.5 AndroidManifest ✅
- [x] Tüm izin tanımları
- [x] Intent filtreleri (DIAL, VIEW tel:)
- [x] Service tanımları
- [x] Receiver tanımları
- [x] IncomingCallActivity

---

## Faz 5: Kurulum ve Yönlendirme ✅ TAMAMLANDI

### 5.1 Kurulum Sihirbazı ✅
- [x] SetupWizardScreen
- [x] 6 adımlı kurulum akışı
- [x] İzin kontrolü ve isteme
- [x] Varsayılan uygulama kaydı
- [x] Overlay izni

### 5.2 Marka Bazlı Yönlendirme ✅
- [x] Cihaz markası tespiti
- [x] Samsung özel talimatları
- [x] Xiaomi/Redmi/POCO talimatları
- [x] Huawei/Honor talimatları
- [x] OPPO/Realme talimatları
- [x] Vivo/iQOO talimatları
- [x] OnePlus talimatları
- [x] Pil optimizasyonu uyarıları

### 5.3 İlk Açılış Kontrolü ✅
- [x] AsyncStorage ile kurulum durumu
- [x] Otomatik sihirbaz gösterimi
- [x] Atlama seçeneği

---

## Faz 6: Takvim Modülü 🔄 DEVAM EDİYOR

### 6.1 Takvim Ekranları ✅
- [x] CalendarScreen - Ana takvim ekranı
  - [x] Aylık görünüm (varsayılan)
  - [ ] Haftalık görünüm
  - [ ] Günlük görünüm (agenda)
  - [x] Görünüm değiştirme butonu
  - [x] Etkinlik noktaları/göstergeleri
  - [x] Bugüne git butonu
  - [x] Ay/yıl seçici

### 6.2 Etkinlik Detay Ekranı ✅
- [x] EventDetailScreen
  - [x] Etkinlik başlığı ve açıklama
  - [x] Tarih ve saat bilgisi
  - [x] Konum bilgisi (harita entegrasyonu)
  - [ ] Katılımcılar listesi
  - [x] Hatırlatıcı bilgisi
  - [x] Tekrar bilgisi
  - [x] İlişkili kişi bağlantısı (arama hatırlatıcısı)
  - [ ] İlişkili not bağlantısı
  - [x] **Paylaşım butonu (Native Share)**
    - [x] WhatsApp paylaşımı
    - [x] SMS paylaşımı
    - [x] E-posta paylaşımı
    - [x] Diğer uygulamalar
  - [x] Düzenle/Sil butonları

### 6.3 Etkinlik Düzenleme Ekranı ✅
- [x] EventEditScreen
  - [x] Başlık girişi
  - [x] Açıklama (çoklu satır)
  - [x] Başlangıç tarihi/saati seçici
  - [x] Bitiş tarihi/saati seçici
  - [x] Tüm gün toggle
  - [ ] **Konum seçici** (temel yapı hazır)
    - [ ] Harita entegrasyonu
    - [ ] Adres arama
    - [ ] Mevcut konum
    - [ ] Kayıtlı adresler (kişilerden)
  - [x] **Hatırlatıcı ayarları**
    - [x] Çoklu hatırlatıcı desteği
    - [x] Zaman seçenekleri (5dk, 15dk, 30dk, 1saat, 1gün, vb.)
    - [ ] Özel zaman girişi
  - [ ] **Alarm/Zil sesi seçimi**
    - [ ] Varsayılan zil sesleri
    - [ ] Özel zil sesi seçimi
    - [ ] Titreşim ayarı
  - [x] **Tekrar ayarları**
    - [x] Günlük
    - [x] Haftalık (gün seçimi)
    - [x] Aylık
    - [x] Yıllık
    - [ ] Özel tekrar
    - [ ] Bitiş tarihi/sayısı
  - [x] **Kişi bağlama (Arama hatırlatıcısı)**
    - [ ] Kişi seçici
    - [ ] Çoklu kişi desteği
    - [x] Arama hatırlatıcısı oluştur
  - [ ] **Not bağlama**
    - [ ] Mevcut not seçimi
    - [ ] Yeni not oluştur
  - [x] Renk/kategori seçimi
  - [x] Takvim seçimi (yerel/Google)

### 6.4 Google Calendar Senkronizasyonu
- [ ] GoogleCalendarService
  - [ ] Google Sign-In entegrasyonu
  - [ ] OAuth 2.0 token yönetimi
  - [ ] Takvim listesi çekme
  - [ ] Etkinlik çekme (pull)
  - [ ] Etkinlik gönderme (push)
  - [ ] Çift yönlü senkronizasyon
  - [ ] Çakışma yönetimi
  - [ ] Son senkronizasyon zamanı kayıt
  - [ ] Otomatik senkronizasyon (arka plan)
  - [ ] Manuel senkronizasyon butonu

### 6.5 Import/Export Servisleri
- [ ] CalendarImportExportService
  - [ ] **ICS Import**
    - [ ] Dosya seçici
    - [ ] ICS parser
    - [ ] Önizleme ekranı
    - [ ] Seçili etkinlikleri içe aktar
    - [ ] Çakışma kontrolü
  - [ ] **ICS Export**
    - [ ] Tarih aralığı seçimi
    - [ ] Takvim seçimi
    - [ ] Dosya oluşturma
    - [ ] Paylaşım/Kaydetme
  - [ ] **Excel/CSV Import**
    - [ ] Dosya seçici
    - [ ] Sütun eşleştirme ekranı
    - [ ] Önizleme
    - [ ] İçe aktarma
  - [ ] **Excel/CSV Export**
    - [ ] Tarih aralığı seçimi
    - [ ] Sütun seçimi
    - [ ] Dosya formatı seçimi (xlsx/csv)
    - [ ] Dışa aktarma

### 6.6 Hatırlatıcı ve Bildirim Sistemi
- [ ] CalendarNotificationService
  - [ ] Native Android AlarmManager entegrasyonu
  - [ ] Zamanlanmış bildirimler
  - [ ] Bildirim kanalları (önem derecesi)
  - [ ] Bildirim aksiyonları
    - [ ] Ertele (5dk, 15dk, 30dk, 1saat)
    - [ ] Kapat
    - [ ] Detay görüntüle
    - [ ] Ara (arama hatırlatıcısı için)
  - [ ] Tam ekran bildirim (önemli etkinlikler)
  - [ ] Özel zil sesi desteği
  - [ ] Titreşim deseni

### 6.7 Takvim Ayarları Ekranı ✅
- [x] SettingsCalendarScreen
  - [x] **Google Senkronizasyon**
    - [x] Açma/Kapama toggle
    - [x] Bağlı hesap bilgisi
    - [x] Hesap değiştir/bağla
    - [x] Son senkronizasyon zamanı
    - [x] Şimdi senkronize et butonu
    - [x] Otomatik senkronizasyon aralığı
  - [x] **Varsayılan Ayarlar**
    - [x] Varsayılan görünüm (aylık/haftalık/günlük)
    - [x] Haftanın ilk günü
    - [x] Varsayılan hatırlatıcı süresi
    - [ ] Varsayılan etkinlik süresi
    - [ ] Varsayılan takvim
  - [x] **Bildirim Ayarları**
    - [x] Bildirim sesi açma/kapama
    - [ ] Varsayılan zil sesi seçimi
    - [x] Titreşim açma/kapama
    - [ ] Sessiz saatler
  - [x] **Import/Export** (UI hazır, servisler beklemede)
    - [x] ICS dosyasından içe aktar butonu
    - [ ] Excel/CSV'den içe aktar
    - [x] ICS olarak dışa aktar butonu
    - [ ] Excel/CSV olarak dışa aktar
  - [ ] **Veri Yönetimi**
    - [ ] Tüm etkinlikleri sil
    - [ ] Eski etkinlikleri temizle

### 6.8 Entegrasyonlar
- [ ] **Telefon/Arama Entegrasyonu**
  - [ ] Arama hatırlatıcısı oluşturma
  - [ ] Arama sonrası takip hatırlatıcısı
  - [ ] Kişi arama geçmişinden etkinlik
- [ ] **Kişiler Entegrasyonu**
  - [ ] Kişi doğum günleri takvimde
  - [ ] Kişi yıldönümleri
  - [ ] Kişiye bağlı etkinlikler
  - [ ] Kişi detayından etkinlik oluştur
- [ ] **Harita/Konum Entegrasyonu**
  - [ ] Google Maps / OpenStreetMap
  - [ ] Konum seçici modal
  - [ ] Navigasyon başlat
  - [ ] Yakınlık bildirimi
- [ ] **Notlar Entegrasyonu**
  - [ ] Etkinliğe not ekleme
  - [ ] Nottan etkinlik oluşturma
  - [ ] Çift yönlü bağlantı

### 6.9 Redux State ✅
- [x] calendarSlice
  - [x] events: CalendarEvent[]
  - [x] selectedDate: string
  - [x] viewMode: 'month' | 'week' | 'day'
  - [x] calendars: Calendar[]
  - [x] syncInfo: SyncInfo
  - [x] isSyncing: boolean
  - [x] settings: CalendarSettings
  - [x] Async Thunks (loadEvents, syncWithGoogle, connectGoogleAccount, importICSFile)
  - [x] Selectors (selectEventsByDate, selectVisibleEvents, selectEventsForMonth)

### 6.10 Tipler
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: EventLocation;
  reminders: EventReminder[];
  recurrence?: EventRecurrence;
  color?: string;
  calendarId: string;
  contactIds?: string[];
  noteIds?: string[];
  isGoogleEvent: boolean;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventLocation {
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

interface EventReminder {
  id: string;
  minutes: number;
  type: 'notification' | 'alarm' | 'email';
  ringtoneUri?: string;
}

interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
}

interface Calendar {
  id: string;
  name: string;
  color: string;
  isLocal: boolean;
  isGoogleCalendar: boolean;
  googleCalendarId?: string;
  isVisible: boolean;
  isPrimary: boolean;
}

interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  firstDayOfWeek: 0 | 1 | 6; // Sun, Mon, Sat
  defaultReminderMinutes: number;
  defaultEventDuration: number;
  defaultCalendarId: string;
  showDeclinedEvents: boolean;
  showWeekNumbers: boolean;
}
```

---

## Faz 7: Notlar Modülü 📝 BEKLEMEDE

### 7.1 Not Listesi
- [ ] NotesScreen
- [ ] Arama ve filtreleme
- [ ] Kategoriler/etiketler

### 7.2 Not Detay
- [ ] NoteDetailScreen
- [ ] Zengin metin editörü
- [ ] Resim ekleme
- [ ] Sesli not

### 7.3 Arama Notu
- [ ] Arama sonrası not ekleme
- [ ] Kişiye bağlı notlar

---

## Faz 8: Ayarlar ve Mağaza 🔄 KISMEN TAMAMLANDI

### 8.1 Ayarlar Ekranları ✅
- [x] SettingsScreen - Ana ayarlar
- [x] SettingsAppearanceScreen
- [x] SettingsLanguageScreen

### 8.2 Tema Mağazası ✅
- [x] ThemeStoreScreen
- [x] Tema önizleme
- [x] Tema uygulama

### 8.3 Zil Sesi Mağazası
- [ ] RingtoneStoreScreen
- [ ] Zil sesi önizleme
- [ ] Zil sesi indirme

### 8.4 Diğer Ayarlar
- [ ] SettingsContactsScreen
- [ ] SettingsCallsScreen
- [ ] SettingsCalendarScreen (Faz 6.7'de detaylı)
- [ ] SettingsNotificationsScreen
- [ ] SettingsPrivacyScreen
- [ ] SettingsBackupScreen

---

## Faz 9: Gelişmiş Özellikler 📝 BEKLEMEDE

### 9.1 Arama Kaydı
- [ ] Arama kaydetme
- [ ] Kayıt listesi
- [ ] Kayıt oynatma

### 9.2 Engelleme
- [ ] Numara engelleme
- [ ] Engel listesi yönetimi
- [ ] Spam tespit

### 9.3 Yedekleme
- [ ] Kişi yedekleme
- [ ] Ayar yedekleme
- [ ] Bulut senkronizasyonu

### 9.4 Widget'lar
- [ ] Favori kişiler widget
- [ ] Hızlı arama widget
- [ ] Arama geçmişi widget

---

## Mevcut Dosya Yapısı

```
CallHub/
├── android/
│   └── app/src/main/java/com/lifecall/
│       ├── CallModule.java
│       ├── DefaultAppModule.java
│       ├── PermissionsModule.java
│       ├── LifeCallPackage.java
│       ├── MainActivity.java
│       ├── MainApplication.java
│       ├── IncomingCallActivity.java
│       ├── CallConnectionService.java
│       ├── receivers/
│       │   ├── PhoneStateReceiver.java
│       │   ├── BootReceiver.java
│       │   └── CalendarReminderReceiver.java (Faz 6)
│       └── services/
│           ├── IncomingCallService.java
│           └── CalendarNotificationService.java (Faz 6)
├── src/
│   ├── components/
│   │   ├── CallOverlay.tsx
│   │   ├── FloatingCallBubble.tsx
│   │   ├── FloatingCallNotification.tsx
│   │   ├── calendar/                    (Faz 6)
│   │   │   ├── CalendarView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── MonthView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   ├── ReminderPicker.tsx
│   │   │   ├── RecurrencePicker.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── tr.json
│   │   │   └── en.json
│   │   └── index.ts
│   ├── native/
│   │   ├── CallModule.ts
│   │   ├── CalendarModule.ts            (Faz 6)
│   │   └── index.ts
│   ├── navigation/
│   │   ├── MainTabNavigator.tsx
│   │   ├── RootNavigator.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   ├── screens/
│   │   ├── CallsScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   ├── ContactDetailScreen.tsx
│   │   ├── ContactEditScreen.tsx
│   │   ├── DialerScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── IncomingCallScreen.tsx
│   │   ├── OngoingCallScreen.tsx
│   │   ├── SetupWizardScreen.tsx
│   │   ├── CalendarScreen.tsx           (Faz 6)
│   │   ├── calendar/                    (Faz 6)
│   │   │   ├── EventDetailScreen.tsx
│   │   │   ├── EventEditScreen.tsx
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── SettingsAppearanceScreen.tsx
│   │   │   ├── SettingsLanguageScreen.tsx
│   │   │   └── SettingsCalendarScreen.tsx (Faz 6)
│   │   └── store/
│   │       └── ThemeStoreScreen.tsx
│   ├── services/
│   │   ├── CallStateManager.ts
│   │   ├── defaultAppService.ts
│   │   ├── permissionsService.ts
│   │   ├── calendar/                    (Faz 6)
│   │   │   ├── GoogleCalendarService.ts
│   │   │   ├── CalendarImportExportService.ts
│   │   │   ├── CalendarNotificationService.ts
│   │   │   ├── ICSParser.ts
│   │   │   ├── ExcelParser.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── store/
│   │   ├── slices/
│   │   │   ├── contactsSlice.ts
│   │   │   ├── callsSlice.ts
│   │   │   ├── settingsSlice.ts
│   │   │   ├── themeSlice.ts
│   │   │   └── calendarSlice.ts         (Faz 6)
│   │   └── index.ts
│   ├── theme/
│   │   ├── themes.ts
│   │   ├── ThemeProvider.tsx
│   │   └── index.ts
│   └── types/
│       ├── index.ts
│       └── calendar.ts                  (Faz 6)
├── App.tsx
└── PROJECT_PLAN.md
```

---

## Son Güncelleme
**Tarih:** 2026-01-31

**Tamamlanan Son İşler:**
1. Çağrı ekranları ve floating UI sistemi
2. Native CallModule (Java + TypeScript)
3. Kurulum sihirbazı (marka bazlı)
4. Overlay izin kontrolü
5. NativeEventEmitter entegrasyonu
6. **Faz 6 Takvim Modülü Temel Ekranları:**
   - calendar.ts (tipler ve sabitler)
   - calendarSlice.ts (Redux state yönetimi)
   - CalendarScreen (aylık görünüm, etkinlik noktaları)
   - EventEditScreen (etkinlik oluşturma/düzenleme)
   - EventDetailScreen (detay görüntüleme, paylaşım)
   - SettingsCalendarScreen (Google sync, import/export ayarları)
   - Çoklu dil desteği (TR/EN)

**Aktif Geliştirme:**
- Faz 6: Takvim Modülü (temel ekranlar tamamlandı, servisler devam ediyor)

**Sonraki Adımlar:**
1. Takvim modülü servislerini tamamla:
   - Native bildirim servisi (CalendarNotificationService)
   - Google Calendar API entegrasyonu
   - ICS/Excel parser servisleri
   - Konum seçici (harita entegrasyonu)
2. Notlar modülü (Faz 7)
3. Arama kaydı özelliği (Faz 9)
4. Widget'lar (Faz 9)

---

## Gerekli Paketler (Faz 6)

```bash
# Takvim UI
npm install react-native-calendars

# Google Sign-In
npm install @react-native-google-signin/google-signin

# Dosya işlemleri
npm install react-native-document-picker
npm install react-native-fs
npm install xlsx

# Konum/Harita
npm install react-native-maps
npm install react-native-google-places-autocomplete

# Paylaşım
npm install react-native-share

# Tarih işlemleri
npm install date-fns
```

---

## Öncelik Sırası (Faz 6)

| Sıra | Görev | Öncelik | Bağımlılık | Durum |
|------|-------|---------|------------|-------|
| 1 | calendarSlice + types | Yüksek | - | ✅ Tamamlandı |
| 2 | CalendarScreen (temel) | Yüksek | 1 | ✅ Tamamlandı |
| 3 | EventEditScreen | Yüksek | 1, 2 | ✅ Tamamlandı |
| 4 | EventDetailScreen | Yüksek | 1, 2 | ✅ Tamamlandı |
| 5 | Native bildirim servisi | Yüksek | 1 | 🔄 Sırada |
| 6 | SettingsCalendarScreen | Orta | 1 | ✅ Tamamlandı |
| 7 | Google Calendar sync | Orta | 1, 6 | 📝 Beklemede |
| 8 | ICS import/export | Orta | 1 | 📝 Beklemede |
| 9 | Excel import/export | Düşük | 1, 8 | 📝 Beklemede |
| 10 | Konum/harita entegrasyonu | Düşük | 3, 4 | 📝 Beklemede |
| 11 | Native paylaşım | Düşük | 4 | ✅ Tamamlandı |
