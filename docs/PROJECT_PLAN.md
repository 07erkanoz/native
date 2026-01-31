# CallHub - All-in-One PIM Uygulaması

## Proje Özeti

React Native ile geliştirilecek kapsamlı bir **Kişisel Bilgi Yönetimi (PIM)** uygulaması. Tek bir uygulama içinde:
- **Rehber** (Kişi Yönetimi)
- **Telefon** (Arama Yönetimi)
- **Ajanda** (Notlar)
- **Takvim** (Etkinlikler + Google Sync)
- **Hatırlatıcılar**
- **Tema Mağazası**
- **Zil Sesi Mağazası**

---

## 1. Ana Modüller ve Ekranlar

### 1.1 Tab Bar Yapısı

```
┌─────────────────────────────────────────────────────┐
│  [⭐]    [🕐]    [👥]    [📅]    [⚙️]              │
│  Fav     Arama   Rehber  Takvim  Ayarlar           │
└─────────────────────────────────────────────────────┘
```

### 1.2 Tüm Ekranlar

| Modül | Ekran | Açıklama |
|-------|-------|----------|
| **Favoriler** | FavoritesScreen | Grid görünümde favori kişiler |
| **Aramalar** | CallHistoryScreen | Detaylı çağrı geçmişi |
| | DialerScreen | Tuş takımı |
| | IncomingCallScreen | Gelen sesli arama UI |
| | IncomingVideoCallScreen | Gelen görüntülü arama UI |
| | OutgoingCallScreen | Giden sesli arama UI |
| | OutgoingVideoCallScreen | Giden görüntülü arama UI |
| | InCallScreen | Arama sırasında UI |
| | InVideoCallScreen | Görüntülü arama sırasında UI |
| | FloatingCallScreen | Floating/PiP arama UI |
| **Rehber** | ContactListScreen | Alfabetik kişi listesi |
| | ContactDetailScreen | Kişi detayı |
| | ContactEditScreen | Kişi ekleme/düzenleme |
| | ContactGroupsScreen | Kişi grupları |
| **Takvim** | CalendarScreen | Aylık/haftalık takvim |
| | EventDetailScreen | Etkinlik detayı |
| | EventEditScreen | Etkinlik ekleme/düzenleme |
| | AgendaScreen | Günlük ajanda görünümü |
| **Notlar** | NotesListScreen | Not listesi |
| | NoteDetailScreen | Not detayı/düzenleme |
| | NoteEditorScreen | Zengin metin editörü |
| **Hatırlatıcılar** | RemindersScreen | Hatırlatıcı listesi |
| | ReminderEditScreen | Hatırlatıcı ekleme/düzenleme |
| **Mağaza** | ThemeStoreScreen | Tema mağazası |
| | ThemeDetailScreen | Tema önizleme/satın alma |
| | RingtoneStoreScreen | Zil sesi mağazası |
| | RingtoneDetailScreen | Zil sesi önizleme |
| | MyPurchasesScreen | Satın alınanlar |
| **Ayarlar** | SettingsScreen | Ana ayarlar |
| | AppearanceSettingsScreen | Görünüm ayarları |
| | CallSettingsScreen | Arama ayarları |
| | ContactSettingsScreen | Rehber ayarları |
| | CalendarSettingsScreen | Takvim ayarları |
| | NotificationSettingsScreen | Bildirim ayarları |
| | SyncSettingsScreen | Senkronizasyon ayarları |
| | PrivacySettingsScreen | Gizlilik ayarları |
| | BackupSettingsScreen | Yedekleme ayarları |
| **Kimlik** | LoginScreen | Giriş |
| | RegisterScreen | Kayıt |
| | ProfileScreen | Profil yönetimi |

---

## 2. Özellik Detayları

### 2.1 Çağrı Yönetimi (Call Management)

#### Detaylı Call Log
```typescript
interface CallLogEntry {
  id: string;
  contactId?: string;
  phoneNumber: string;
  formattedNumber: string;
  contactName?: string;
  contactPhoto?: string;

  // Çağrı Detayları
  callType: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'blocked';
  callCategory: 'voice' | 'video';
  duration: number;              // Saniye
  callDate: string;              // ISO 8601
  callTime: string;              // HH:mm:ss

  // Ek Bilgiler
  isRead: boolean;
  isNew: boolean;
  simSlot?: number;              // Dual SIM
  geocodedLocation?: string;     // Şehir/Ülke
  networkType?: string;          // WiFi, 4G, 5G

  // Arama Kaydı
  hasRecording: boolean;
  recordingPath?: string;
  recordingDuration?: number;
}
```

#### Çağrı İstatistikleri
- Günlük/Haftalık/Aylık arama sayısı
- En çok aranan kişiler
- Ortalama arama süresi
- Cevapsız arama oranı

### 2.2 Görüntülü Arama UI Altyapısı

#### Gelen Görüntülü Arama Ekranı
```
┌─────────────────────────────────────┐
│         ┌─────────────┐             │
│         │             │             │
│         │   📹 Video  │   ← Arayan  │
│         │   Preview   │     Video   │
│         │             │             │
│         └─────────────┘             │
│                                     │
│         Senem Daşkıran              │
│       Görüntülü Arama...            │
│                                     │
│    ┌─────────┐    ┌─────────┐      │
│    │   🎥    │    │   📞    │      │
│    │ Video   │    │ Sesli   │      │
│    │ Cevapla │    │ Cevapla │      │
│    └─────────┘    └─────────┘      │
│                                     │
│           ┌─────────┐               │
│           │   ❌    │               │
│           │ Reddet  │               │
│           └─────────┘               │
└─────────────────────────────────────┘
```

#### Görüntülü Arama Sırasında Ekran
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      Karşı Taraf Video          │ │
│ │         (Tam Ekran)             │ │
│ │                                 │ │
│ │                    ┌───────┐    │ │
│ │                    │ Kendi │    │ │
│ │                    │ Video │    │ │
│ │                    └───────┘    │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Senem Daşkıran        02:45       │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ 🔇 │ │ 📷 │ │ 🔄 │ │ 🔊 │      │
│  │Mute│ │Cam │ │Flip│ │Spkr│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│         ┌───────────────┐           │
│         │      📞       │           │
│         │   Bitir       │           │
│         └───────────────┘           │
└─────────────────────────────────────┘
```

### 2.3 Floating/PiP Arama UI

Başka uygulama açıkken görünen floating UI:

```
┌──────────────────────────────────────────┐
│                                          │
│         [Diğer Uygulama İçeriği]         │
│                                          │
│                                          │
│     ┌─────────────────────────────┐      │
│     │ 👤 Senem D.     02:45  [X] │      │
│     │ [🔇] [⌨️] [🔊]    [📞 Bitir]│      │
│     └─────────────────────────────┘      │
│         ↑ Floating Call Widget           │
└──────────────────────────────────────────┘
```

#### Video Call Floating (PiP)
```
┌──────────────────────────────────────────┐
│                                          │
│         [Diğer Uygulama İçeriği]         │
│                                          │
│            ┌───────────────┐             │
│            │   📹 Video    │             │
│            │   Preview     │             │
│            │  ┌────┐       │             │
│            │  │You │ 02:45 │             │
│            │  └────┘       │             │
│            │ [🔇][📷][📞] │             │
│            └───────────────┘             │
│                                          │
└──────────────────────────────────────────┘
```

### 2.4 Takvim ve Hatırlatıcılar

#### Takvim Özellikleri
- Aylık/Haftalık/Günlük görünüm
- Google Takvim senkronizasyonu (çift yönlü)
- Etkinlik renk kodlaması
- Tekrarlayan etkinlikler
- Konum ekleme
- Katılımcı ekleme
- Bildirim zamanlaması

#### Google Calendar Sync
```typescript
interface CalendarSyncConfig {
  enabled: boolean;
  googleAccountEmail: string;
  syncDirection: 'both' | 'from_google' | 'to_google';
  calendarsToSync: string[];        // Calendar IDs
  syncFrequency: number;            // Dakika
  syncRange: {
    pastDays: number;
    futureDays: number;
  };
  conflictResolution: 'google_wins' | 'local_wins' | 'newest_wins';
}
```

#### Takvim Ekranı
```
┌─────────────────────────────────────┐
│  ◀  Ocak 2026  ▶           [+] [📅]│
├─────────────────────────────────────┤
│  Pzt Sal Çar Per Cum Cmt Paz       │
│                   1   2   3   4    │
│   5   6   7   8   9  10  11       │
│  12  13  14  15  16  17  18       │
│  19  20  21 •22• 23  24  25       │
│  26  27  28  29  30  31           │
├─────────────────────────────────────┤
│  22 Ocak 2026, Perşembe            │
│  ─────────────────────────────────  │
│  🔵 09:00 Toplantı - Ofis          │
│  🟢 12:00 Öğle Yemeği - Ali ile    │
│  🔴 15:00 Doktor Randevusu         │
│  🟡 18:00 Spor Salonu              │
├─────────────────────────────────────┤
│ [⭐] [🕐] [👥] [📅] [⚙️]            │
└─────────────────────────────────────┘
```

### 2.5 Notlar Modülü (Gelişmiş)

#### Not Türleri
| Tür | Açıklama | İkon |
|-----|----------|------|
| **Metin Notu** | Zengin metin editörü ile | 📝 |
| **Sesli Not** | Ses kaydı ile | 🎤 |
| **Görsel Not** | Resim + metin | 🖼️ |
| **Arama Notu** | Görüşme sırasında/sonrası | 📞 |
| **Checklist** | Yapılacaklar listesi | ✅ |

#### Rich Text Editor Özellikleri
- **Metin Biçimlendirme**: Bold, italic, underline, strikethrough
- **Başlıklar**: H1, H2, H3
- **Listeler**: Numaralı liste, madde işaretli liste, checklist
- **Medya**: Resim ekleme (galeri/kamera)
- **Sesli Not**: Kayıt ve oynatma
- **Bağlantılar**: URL, kişi bağlama, etkinlik bağlama
- **Alıntı**: Blockquote
- **Kod Bloğu**: Monospace metin
- **Yatay Çizgi**: Ayraç

#### Sesli Not Özellikleri
```typescript
interface VoiceNote {
  id: string;
  noteId: string;

  // Ses Dosyası
  filePath: string;
  duration: number;                  // Saniye
  fileSize: number;                  // Byte
  format: 'aac' | 'm4a';

  // Dalga Formu (Waveform)
  waveformData: number[];            // Görselleştirme için

  // Meta
  recordedAt: string;
  createdAt: string;
}
```

#### Not Editörü Toolbar
```
┌─────────────────────────────────────────────────────────────┐
│ [B] [I] [U] [S] │ [H1][H2][H3] │ [•][1.][☐] │ [🖼️][🎤][🔗] │
└─────────────────────────────────────────────────────────────┘
  Bold Italic      Başlıklar      Listeler     Medya/Ses/Link
  Underline Strike
```

#### Sesli Not Kayıt UI
```
┌─────────────────────────────────────┐
│                                     │
│      ┌───────────────────┐          │
│      │ ▁▃▅▇▅▃▁▃▅▇▅▃▁▃▅▇ │ Waveform │
│      └───────────────────┘          │
│                                     │
│            02:34                    │
│                                     │
│    ┌─────────┐  ┌─────────┐        │
│    │   ⏹️    │  │   ✅    │        │
│    │  Durdur │  │ Kaydet  │        │
│    └─────────┘  └─────────┘        │
│                                     │
└─────────────────────────────────────┘
```

#### Not Yapısı (Güncellenmiş)
```typescript
interface Note {
  id: string;
  title: string;

  // İçerik Türleri
  noteType: 'text' | 'voice' | 'visual' | 'call' | 'checklist';
  content: string;                   // JSON (Rich Text Content)
  plainTextContent: string;          // Arama için düz metin

  // Sesli Notlar
  voiceNotes: VoiceNote[];

  // Görseller
  images: NoteImage[];

  // Checklist
  checklistItems?: ChecklistItem[];

  // Arama Bağlantısı (Görüşme sırasında alınan notlar)
  linkedCallId?: string;
  callTimestamp?: string;
  callContactName?: string;

  // Organizasyon
  color: string;
  categoryId?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;

  // İlişkiler
  linkedContactId?: string;
  linkedEventId?: string;

  // Hatırlatıcı
  reminderAt?: string;
  reminderNotified: boolean;

  // Meta
  createdAt: string;
  updatedAt: string;
}

interface NoteImage {
  id: string;
  noteId: string;
  uri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  caption?: string;
  position: number;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  position: number;
}
```

### 2.5.1 Arama Sırasında Not Alma

#### Özellikler
- Arama ekranında not butonu
- Hızlı not açılır penceresi (bottom sheet)
- Sesli not kaydetme (arama sırasında)
- Arama bittikten sonra not istemi
- Otomatik kişi ve zaman bağlantısı

#### Arama Sırasında Not UI
```
┌─────────────────────────────────────┐
│       Senem Daşkıran    02:45      │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ 🔇 │ │ ⌨️  │ │ 🔊 │ │ 📝 │ ← Not│
│  │Mute│ │Tuş │ │Spkr│ │ Not│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│         ┌───────────────┐           │
│         │      📞       │           │
│         │   Bitir       │           │
│         └───────────────┘           │
└─────────────────────────────────────┘

       ↓ Not butonuna basıldığında

┌─────────────────────────────────────┐
│  📝 Arama Notu          [X] Kapat  │
├─────────────────────────────────────┤
│  Senem Daşkıran ile görüşme        │
│  02:45 - Devam ediyor              │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Not yazın...                │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🎤 Sesli Not]      [✅ Kaydet]   │
│                                     │
└─────────────────────────────────────┘
```

#### Arama Sonrası Not İstemi
```
┌─────────────────────────────────────┐
│                                     │
│        Arama Sonlandı               │
│                                     │
│     Senem Daşkıran                  │
│     Süre: 05:32                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   📝 Bu görüşme için        │   │
│  │      not eklemek ister      │   │
│  │      misiniz?               │   │
│  └─────────────────────────────┘   │
│                                     │
│   [Hayır]           [Not Ekle]     │
│                                     │
└─────────────────────────────────────┘
```

#### Arama Notu Konfigürasyonu
```typescript
interface CallNoteSettings {
  // Arama sırasında
  showNoteButtonInCall: boolean;     // Not butonu göster
  enableVoiceNoteDuringCall: boolean; // Sesli not izni

  // Arama sonrası
  promptNoteAfterCall: boolean;      // Arama sonrası sor
  promptOnlyForContacts: boolean;    // Sadece kayıtlı kişiler
  promptMinDuration: number;         // Min süre (saniye)

  // Varsayılan
  defaultNoteColor: string;
  autoLinkContact: boolean;          // Kişiyi otomatik bağla
}
```

### 2.6 Hatırlatıcılar

```typescript
interface Reminder {
  id: string;
  title: string;
  description?: string;

  // Zamanlama
  dueDate: string;
  dueTime?: string;
  isAllDay: boolean;

  // Tekrar
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  repeatConfig?: RepeatConfig;

  // Bildirim
  notifyBefore: number[];           // Dakika: [0, 15, 60, 1440]

  // Durum
  isCompleted: boolean;
  completedAt?: string;

  // İlişkiler
  linkedContactId?: string;
  linkedEventId?: string;

  // Meta
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}
```

### 2.7 Kişi Özelleştirme

#### Kişiye Özel Zil Sesi
```typescript
interface ContactCustomization {
  contactId: string;

  // Zil Sesi
  ringtoneType: 'default' | 'custom' | 'store';
  ringtoneUri?: string;
  ringtoneName?: string;

  // Bildirim Sesi
  notificationToneUri?: string;

  // Titreşim
  vibrationPattern: 'default' | 'short' | 'long' | 'custom' | 'none';
  customVibrationPattern?: number[];

  // LED
  ledColor?: string;

  // Özel Profil Resmi
  customPhotoUri?: string;          // Uygulama içi özel fotoğraf
  useDevicePhoto: boolean;          // Cihaz rehberinden fotoğraf
}
```

#### Profil Resmi Senkronizasyonu

**Fotoğraf Öncelik Sıralaması:**
```
1. Kullanıcının manuel eklediği özel fotoğraf
2. Cihaz rehberindeki fotoğraf
3. Google Contacts fotoğrafı (People API)
4. Gravatar fotoğrafı (e-posta ile)
5. Otomatik avatar (baş harfler + renk)
```

##### Google People API Entegrasyonu

Google hesabındaki kişilerin fotoğraflarını telefon numarasına göre eşleştirme:

```typescript
// Google People API ile kişi fotoğraflarını çekme
interface GoogleContactPhoto {
  resourceName: string;
  phoneNumber: string;
  photoUrl: string;
}

// Gerekli OAuth Scope
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly'
];

// API Endpoint
// GET https://people.googleapis.com/v1/people/me/connections
//     ?personFields=names,phoneNumbers,photos
//     &pageSize=1000

async function syncGoogleContactPhotos(): Promise<GoogleContactPhoto[]> {
  const { accessToken } = await GoogleSignin.getTokens();

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,photos&pageSize=1000',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const data = await response.json();

  return data.connections
    .filter(c => c.photos?.length > 0 && c.phoneNumbers?.length > 0)
    .map(c => ({
      resourceName: c.resourceName,
      phoneNumber: normalizePhoneNumber(c.phoneNumbers[0].value),
      photoUrl: c.photos[0].url
    }));
}
```

**Dikkat:** Bu özellik "sensitive scope" kategorisinde olduğundan Google App Verification gerektirir.

##### Gravatar Entegrasyonu

E-posta adresinden profil fotoğrafı çekme (API key gerektirmez):

```typescript
import CryptoJS from 'crypto-js';

function getGravatarUrl(email: string, size: number = 200): string {
  const cleanEmail = email.trim().toLowerCase();
  const hash = CryptoJS.SHA256(cleanEmail).toString();

  // d=404: fotoğraf yoksa 404 döner (kontrol için)
  // d=identicon: fotoğraf yoksa geometrik pattern
  return `https://gravatar.com/avatar/${hash}?d=404&s=${size}`;
}

async function checkGravatarExists(email: string): Promise<string | null> {
  const url = getGravatarUrl(email);
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok ? url.replace('d=404', 'd=identicon') : null;
  } catch {
    return null;
  }
}
```

**Gravatar Fallback Seçenekleri:**
| Parametre | Sonuç |
|-----------|-------|
| `d=mp` | Mystery Person (siluet) |
| `d=identicon` | Geometrik pattern |
| `d=robohash` | Robot avatarı |
| `d=retro` | 8-bit piksel yüz |

##### Birleşik Fotoğraf Servisi

```typescript
interface ContactPhotoSource {
  type: 'custom' | 'device' | 'google' | 'gravatar' | 'avatar';
  url: string;
  priority: number;
}

async function getContactPhoto(contact: Contact): Promise<ContactPhotoSource> {
  // 1. Özel fotoğraf (en yüksek öncelik)
  if (contact.customPhotoUri) {
    return { type: 'custom', url: contact.customPhotoUri, priority: 1 };
  }

  // 2. Cihaz rehberi fotoğrafı
  if (contact.thumbnailPath) {
    return { type: 'device', url: contact.thumbnailPath, priority: 2 };
  }

  // 3. Google Contacts fotoğrafı (telefon numarasına göre)
  const googlePhoto = await getGoogleContactPhoto(contact.phoneNumbers?.[0]?.number);
  if (googlePhoto) {
    return { type: 'google', url: googlePhoto, priority: 3 };
  }

  // 4. Gravatar (e-posta adresine göre)
  if (contact.emailAddresses?.length > 0) {
    const gravatarUrl = await checkGravatarExists(contact.emailAddresses[0].email);
    if (gravatarUrl) {
      return { type: 'gravatar', url: gravatarUrl, priority: 4 };
    }
  }

  // 5. Otomatik avatar (baş harfler)
  return {
    type: 'avatar',
    url: generateAvatarUrl(contact.displayName),
    priority: 5
  };
}
```

##### Fotoğraf Önbelleği

```typescript
interface PhotoCache {
  contactId: string;
  sourceType: 'custom' | 'device' | 'google' | 'gravatar' | 'avatar';
  localPath: string;           // Önbelleklenmiş dosya yolu
  originalUrl?: string;        // Kaynak URL
  lastUpdated: Date;
  expiresAt: Date;             // Google/Gravatar için yenileme süresi
}

// SQLite tablosu
CREATE TABLE photo_cache (
  contact_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  local_path TEXT NOT NULL,
  original_url TEXT,
  last_updated TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
```

**Özellikler:**
- Fotoğraf kalitesi ayarı (düşük/orta/yüksek)
- Thumbnail oluşturma (liste görünümü için)
- Önbellek yönetimi (7 gün sonra yenileme)
- Offline kullanım için yerel kayıt

### 2.8 Tema Mağazası

#### Tema Türleri
| Tür | Açıklama |
|-----|----------|
| **app** | Uygulama genel teması |
| **incoming_voice** | Gelen sesli arama UI |
| **incoming_video** | Gelen görüntülü arama UI |
| **outgoing_voice** | Giden sesli arama UI |
| **outgoing_video** | Giden görüntülü arama UI |
| **in_call** | Arama sırasında UI |
| **in_video_call** | Görüntülü arama sırasında UI |
| **floating_call** | Floating arama widget |
| **dialer** | Tuş takımı teması |

#### Varsayılan Tema Çeşitleri
```typescript
const defaultThemes = [
  // Temel
  { id: 'light', name: 'Aydınlık', type: 'light' },
  { id: 'dark', name: 'Karanlık', type: 'dark' },

  // Mavi Tonları
  { id: 'ocean-blue', name: 'Okyanus Mavisi', primary: '#0066CC' },
  { id: 'navy-blue', name: 'Lacivert', primary: '#001F5C' },
  { id: 'sky-blue', name: 'Gök Mavisi', primary: '#00BFFF' },
  { id: 'midnight-blue', name: 'Gece Mavisi', primary: '#191970' },

  // Yeşil Tonları
  { id: 'emerald', name: 'Zümrüt', primary: '#50C878' },
  { id: 'forest', name: 'Orman', primary: '#228B22' },
  { id: 'mint', name: 'Nane', primary: '#98FF98' },

  // Mor Tonları
  { id: 'purple', name: 'Mor', primary: '#800080' },
  { id: 'lavender', name: 'Lavanta', primary: '#E6E6FA' },
  { id: 'violet', name: 'Menekşe', primary: '#8F00FF' },

  // Diğer
  { id: 'rose', name: 'Gül', primary: '#FF007F' },
  { id: 'coral', name: 'Mercan', primary: '#FF7F50' },
  { id: 'gold', name: 'Altın', primary: '#FFD700' },
  { id: 'graphite', name: 'Grafit', primary: '#383838' },

  // Özel Temalar
  { id: 'neon', name: 'Neon', special: true },
  { id: 'retro', name: 'Retro', special: true },
  { id: 'minimal', name: 'Minimal', special: true },
  { id: 'nature', name: 'Doğa', special: true },
];
```

#### Tema Özelleştirme Seçenekleri
```typescript
interface ThemeCustomization {
  baseThemeId: string;

  // Renk Özelleştirme
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
  };

  // Yazı Tipi
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large';

  // Köşe Yuvarlaklığı
  borderRadius?: 'sharp' | 'rounded' | 'pill';

  // Animasyonlar
  animationsEnabled?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}
```

### 2.9 Zil Sesi Mağazası

#### Zil Sesi Yapısı
```typescript
interface Ringtone {
  id: string;
  name: string;
  artistName?: string;

  // Dosya
  previewUrl: string;               // Önizleme için
  downloadUrl: string;              // İndirme için
  duration: number;                 // Saniye
  fileSize: number;                 // Byte
  format: 'mp3' | 'ogg' | 'm4a';

  // Kategori
  category: 'classic' | 'modern' | 'nature' | 'music' | 'funny' | 'minimal';
  tags: string[];

  // Fiyat
  isPremium: boolean;
  price: number;

  // İstatistik
  downloadCount: number;
  rating: number;

  // Meta
  createdAt: string;
}
```

#### Zil Sesi Mağazası Ekranı
```
┌─────────────────────────────────────┐
│  🔍 Zil sesi ara...                 │
├─────────────────────────────────────┤
│  Kategoriler                        │
│  [Klasik] [Modern] [Doğa] [Müzik]  │
├─────────────────────────────────────┤
│  🔥 Popüler                         │
│  ┌────────────────────────────────┐ │
│  │ 🎵 Ocean Waves          ▶ FREE│ │
│  │ 🎵 Digital Beep         ▶ $0.99│ │
│  │ 🎵 Classic Ring         ▶ FREE│ │
│  │ 🎵 Morning Bird         ▶ $0.99│ │
│  └────────────────────────────────┘ │
│                                     │
│  ⭐ Premium                         │
│  ┌────────────────────────────────┐ │
│  │ 🎵 Symphony             ▶ $1.99│ │
│  │ 🎵 Zen Garden           ▶ $1.99│ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 3. Veritabanı Şeması

> **Detaylı şema için:** [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) dosyasına bakın.
> Bu dosya SQLite ve Supabase şemalarının birleştirilmiş ve senkronize edilmiş halini içerir.

### 3.1 Şema Özeti

#### Senkronizasyon Stratejisi

| Kategori | Tablolar | SQLite | Supabase | Sync |
|----------|----------|--------|----------|------|
| **Sadece Yerel** | call_logs, blocked_numbers, speed_dial | ✅ | ❌ | - |
| **Sadece Bulut** | store_themes, store_ringtones, purchases, reviews | ❌ | ✅ | - |
| **İki Yönlü Sync** | contacts, notes, events, reminders, call_notes | ✅ | ✅ | ◄──► |

#### Sync Alanları (Tüm Sync Edilebilir Tablolarda)

```sql
user_id TEXT,                           -- Supabase user ID
sync_status TEXT DEFAULT 'pending',     -- pending, synced, modified, deleted, conflict
sync_version INTEGER DEFAULT 1,         -- Çakışma çözümü için
last_synced_at TEXT,                    -- Son sync zamanı
device_id TEXT,                         -- Hangi cihazdan değiştirildi
is_deleted INTEGER DEFAULT 0,           -- Soft delete (sync için)
server_id TEXT                          -- Supabase'deki karşılık ID
```

### 3.2 Tablo Listesi

#### SQLite (Yerel)
| Tablo | Açıklama |
|-------|----------|
| `contacts` | Kişiler (sync edilir) |
| `phone_numbers` | Telefon numaraları |
| `email_addresses` | E-posta adresleri |
| `addresses` | Adresler |
| `call_logs` | Arama geçmişi (sadece yerel) |
| `call_notes` | Arama notları (sync edilir) |
| `blocked_numbers` | Engelli numaralar (sadece yerel) |
| `events` | Takvim etkinlikleri (sync edilir) |
| `calendars` | Takvimler |
| `notes` | Notlar (sync edilir) |
| `note_categories` | Not kategorileri |
| `reminders` | Hatırlatıcılar (sync edilir) |
| `themes` | İndirilen temalar |
| `ringtones` | İndirilen zil sesleri |
| `contact_groups` | Kişi grupları |
| `contact_group_members` | Grup üyeleri |
| `speed_dial` | Hızlı arama (sadece yerel) |
| `google_accounts` | Google hesapları |
| `user_settings` | Kullanıcı ayarları (sync edilir) |

#### Supabase (Bulut)
| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri |
| `contacts` | Kişiler (sync) |
| `phone_numbers` | Telefon numaraları |
| `email_addresses` | E-posta adresleri |
| `addresses` | Adresler |
| `notes` | Notlar (sync) |
| `note_categories` | Not kategorileri |
| `events` | Etkinlikler (sync) |
| `calendars` | Takvimler |
| `reminders` | Hatırlatıcılar (sync) |
| `call_notes` | Arama notları (sync) |
| `contact_groups` | Kişi grupları |
| `user_settings` | Kullanıcı ayarları |
| `theme_categories` | Tema kategorileri |
| `store_themes` | Tema mağazası |
| `ringtone_categories` | Zil sesi kategorileri |
| `store_ringtones` | Zil sesi mağazası |
| `purchases` | Satın almalar |
| `reviews` | Değerlendirmeler |

> **Detaylı SQL şemaları için:**
> - [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) - Birleştirilmiş şema (SQLite + Supabase)
> - [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md) - Sadece bulut tabloları (mağaza, satın alma, RLS)

### 3.3 Veri Tipi Eşleştirmeleri

| SQLite | PostgreSQL | TypeScript |
|--------|------------|------------|
| TEXT | TEXT | string |
| TEXT (UUID) | UUID | string |
| INTEGER | INTEGER | number |
| REAL | DECIMAL | number |
| TEXT (ISO 8601) | TIMESTAMPTZ | Date |
| TEXT (JSON) | JSONB | object |
| INTEGER (0/1) | BOOLEAN | boolean |
    custom_photo_uri TEXT,                  -- Uygulama içi özel fotoğraf
    photo_thumbnail TEXT,                   -- Base64 thumbnail
    use_device_photo INTEGER DEFAULT 1,

    -- Özelleştirme
    custom_ringtone_uri TEXT,
    custom_ringtone_name TEXT,
    custom_notification_uri TEXT,
    vibration_pattern TEXT,
    led_color TEXT,

    -- Durum
    is_favorite INTEGER DEFAULT 0,
    favorite_order INTEGER,
    is_blocked INTEGER DEFAULT 0,

    -- Diğer
    notes TEXT,
    birthday TEXT,
    anniversary TEXT,
    website TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced_at TEXT,
    device_synced_at TEXT                   -- Cihaz rehberi ile son sync
);

-- =============================================
-- TELEFON NUMARALARI TABLOSU
-- =============================================
CREATE TABLE phone_numbers (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    number TEXT NOT NULL,
    formatted_number TEXT,
    country_code TEXT,
    label TEXT DEFAULT 'mobile',
    is_primary INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- E-POSTA ADRESLERİ TABLOSU
-- =============================================
CREATE TABLE email_addresses (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    email TEXT NOT NULL,
    label TEXT DEFAULT 'personal',
    is_primary INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- ADRESLER TABLOSU
-- =============================================
CREATE TABLE addresses (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    street TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    label TEXT DEFAULT 'home',
    formatted_address TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- ÇAĞRI GEÇMİŞİ TABLOSU (Detaylı)
-- =============================================
CREATE TABLE call_logs (
    id TEXT PRIMARY KEY,
    contact_id TEXT,
    phone_number TEXT NOT NULL,
    formatted_number TEXT,
    contact_name TEXT,
    contact_photo TEXT,

    -- Çağrı Detayları
    call_type TEXT NOT NULL,                -- incoming, outgoing, missed, rejected, blocked
    call_category TEXT DEFAULT 'voice',     -- voice, video
    duration INTEGER DEFAULT 0,

    -- Zaman Bilgisi
    call_date TEXT NOT NULL,
    call_time TEXT NOT NULL,
    call_timestamp INTEGER NOT NULL,        -- Unix timestamp

    -- Ek Bilgiler
    is_read INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 1,
    sim_slot INTEGER,
    geocoded_location TEXT,
    network_type TEXT,

    -- Arama Notu Bağlantısı (Kayıt yerine not)
    has_note INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- ARAMA NOTLARI TABLOSU (Google Play Uyumlu)
-- =============================================
CREATE TABLE call_notes (
    id TEXT PRIMARY KEY,
    call_log_id TEXT NOT NULL,           -- Bağlı olduğu arama
    contact_id TEXT,

    -- Not İçeriği
    content TEXT,                        -- Metin notu (JSON/Rich Text)
    plain_text_content TEXT,             -- Arama için düz metin

    -- Sesli Not (Arama bittikten sonra kaydedilen)
    voice_note_path TEXT,
    voice_note_duration INTEGER,
    voice_note_waveform TEXT,            -- JSON array

    -- Zaman
    noted_at TEXT NOT NULL,              -- Not alınma zamanı
    call_duration INTEGER,               -- Arama ne kadar sürdü

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (call_log_id) REFERENCES call_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- ENGELLİ NUMARALAR TABLOSU
-- =============================================
CREATE TABLE blocked_numbers (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    contact_id TEXT,
    contact_name TEXT,
    reason TEXT,
    block_calls INTEGER DEFAULT 1,
    block_messages INTEGER DEFAULT 1,
    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- TAKVİM ETKİNLİKLERİ TABLOSU
-- =============================================
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    google_event_id TEXT,                   -- Google Calendar sync için
    calendar_id TEXT DEFAULT 'default',

    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    location_latitude REAL,
    location_longitude REAL,

    -- Zaman
    start_date TEXT NOT NULL,
    start_time TEXT,
    end_date TEXT NOT NULL,
    end_time TEXT,
    is_all_day INTEGER DEFAULT 0,
    timezone TEXT,

    -- Tekrar
    is_recurring INTEGER DEFAULT 0,
    recurrence_rule TEXT,                   -- RRULE format
    recurrence_end_date TEXT,

    -- Görünüm
    color TEXT DEFAULT '#4285F4',

    -- Bildirim
    reminders TEXT,                         -- JSON array: [15, 60, 1440]

    -- Katılımcılar
    attendees TEXT,                         -- JSON array

    -- İlişkiler
    linked_contact_id TEXT,

    -- Sync
    is_synced INTEGER DEFAULT 0,
    sync_status TEXT,                       -- pending, synced, error
    last_synced_at TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- TAKVİMLER TABLOSU
-- =============================================
CREATE TABLE calendars (
    id TEXT PRIMARY KEY,
    google_calendar_id TEXT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4285F4',
    is_visible INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    is_google_calendar INTEGER DEFAULT 0,
    sync_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- NOTLAR TABLOSU
-- =============================================
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,                  -- HTML/Markdown
    plain_text_content TEXT,                -- Arama için

    -- Organizasyon
    color TEXT DEFAULT '#FFFFFF',
    category_id TEXT,
    tags TEXT,                              -- JSON array
    is_pinned INTEGER DEFAULT 0,

    -- İlişkiler
    linked_contact_id TEXT,
    linked_event_id TEXT,

    -- Hatırlatıcı
    reminder_at TEXT,
    reminder_notified INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- =============================================
-- NOT KATEGORİLERİ TABLOSU
-- =============================================
CREATE TABLE note_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HATIRLATICILAR TABLOSU
-- =============================================
CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,

    -- Zamanlama
    due_date TEXT NOT NULL,
    due_time TEXT,
    is_all_day INTEGER DEFAULT 0,

    -- Tekrar
    repeat_type TEXT DEFAULT 'none',        -- none, daily, weekly, monthly, yearly, custom
    repeat_config TEXT,                     -- JSON
    next_occurrence TEXT,

    -- Bildirim
    notify_before TEXT,                     -- JSON array: [0, 15, 60]

    -- Durum
    is_completed INTEGER DEFAULT 0,
    completed_at TEXT,

    -- İlişkiler
    linked_contact_id TEXT,
    linked_event_id TEXT,
    linked_note_id TEXT,

    -- Öncelik
    priority TEXT DEFAULT 'medium',         -- low, medium, high

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
);

-- =============================================
-- TEMALAR TABLOSU
-- =============================================
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    store_theme_id TEXT,                    -- Mağazadan indirilen tema
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,                     -- app, incoming_voice, incoming_video, etc.

    -- Durum
    is_system INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0,

    -- İçerik
    config TEXT NOT NULL,                   -- JSON tema konfigürasyonu
    preview_image TEXT,

    -- Özelleştirme
    custom_config TEXT,                     -- Kullanıcı özelleştirmeleri

    -- Meta
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ZİL SESLERİ TABLOSU
-- =============================================
CREATE TABLE ringtones (
    id TEXT PRIMARY KEY,
    store_ringtone_id TEXT,                 -- Mağazadan indirilen
    name TEXT NOT NULL,
    artist_name TEXT,

    -- Dosya
    file_path TEXT NOT NULL,
    duration INTEGER,
    file_size INTEGER,
    format TEXT,

    -- Kategori
    category TEXT,
    is_custom INTEGER DEFAULT 0,            -- Kullanıcı ekledi mi

    -- Durum
    is_default_ringtone INTEGER DEFAULT 0,
    is_default_notification INTEGER DEFAULT 0,

    -- Meta
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GRUPLAR TABLOSU
-- =============================================
CREATE TABLE contact_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,

    -- Grup Zil Sesi
    group_ringtone_uri TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GRUP ÜYELERİ TABLOSU
-- =============================================
CREATE TABLE contact_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    UNIQUE(group_id, contact_id)
);

-- =============================================
-- HIZLI ARAMA TABLOSU
-- =============================================
CREATE TABLE speed_dial (
    position INTEGER PRIMARY KEY,
    contact_id TEXT,
    phone_number TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- GOOGLE HESAPLARI TABLOSU
-- =============================================
CREATE TABLE google_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TEXT,

    -- Sync Ayarları
    calendar_sync_enabled INTEGER DEFAULT 1,
    contacts_sync_enabled INTEGER DEFAULT 0,

    -- Meta
    connected_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TEXT
);

-- =============================================
-- AYARLAR TABLOSU
-- =============================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- İNDEXLER
-- =============================================
CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_blocked ON contacts(is_blocked);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX idx_phone_numbers_contact ON phone_numbers(contact_id);
CREATE INDEX idx_call_logs_timestamp ON call_logs(call_timestamp DESC);
CREATE INDEX idx_call_logs_contact ON call_logs(contact_id);
CREATE INDEX idx_call_logs_number ON call_logs(phone_number);
CREATE INDEX idx_call_logs_type ON call_logs(call_type);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_calendar ON events(calendar_id);
CREATE INDEX idx_events_google_id ON events(google_event_id);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
CREATE INDEX idx_reminders_due ON reminders(due_date);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);
CREATE INDEX idx_themes_type ON themes(type);
CREATE INDEX idx_themes_active ON themes(is_active);
```

### 3.2 Supabase (Bulut Veritabanı)

```sql
-- =============================================
-- KULLANICI PROFİLLERİ
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,

    -- Premium
    is_premium BOOLEAN DEFAULT false,
    premium_plan TEXT,                      -- monthly, yearly, lifetime
    premium_expires_at TIMESTAMPTZ,

    -- Tercihler
    preferred_language TEXT DEFAULT 'tr',
    preferred_currency TEXT DEFAULT 'TRY',

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);

-- =============================================
-- TEMA MAĞAZASI
-- =============================================
CREATE TABLE store_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id),

    -- Temel
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    category TEXT,

    -- Fiyat
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',

    -- İçerik
    config JSONB NOT NULL,
    preview_images TEXT[],
    preview_video_url TEXT,

    -- Etiketler
    tags TEXT[],
    supported_versions TEXT[],

    -- İstatistik
    download_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Durum
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ZİL SESİ MAĞAZASI
-- =============================================
CREATE TABLE store_ringtones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id),

    -- Temel
    name TEXT NOT NULL,
    artist_name TEXT,
    description TEXT,

    -- Dosya
    preview_url TEXT NOT NULL,
    download_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    format TEXT NOT NULL,

    -- Kategori
    category TEXT NOT NULL,
    tags TEXT[],

    -- Fiyat
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',

    -- İstatistik
    download_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Durum
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SATIN ALMALAR
-- =============================================
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),

    -- Ürün
    item_type TEXT NOT NULL,                -- theme, ringtone, premium
    item_id UUID,

    -- Ödeme
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,

    -- Durum
    status TEXT DEFAULT 'completed',        -- pending, completed, refunded

    -- Meta
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    refunded_at TIMESTAMPTZ,

    UNIQUE(user_id, item_type, item_id)
);

-- =============================================
-- DEĞERLENDİRMELER
-- =============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),

    -- Ürün
    item_type TEXT NOT NULL,                -- theme, ringtone
    item_id UUID NOT NULL,

    -- Değerlendirme
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, item_type, item_id)
);

-- =============================================
-- KULLANICI VERİ SENKRONİZASYONU
-- =============================================
CREATE TABLE user_sync_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),

    -- Veri
    data_type TEXT NOT NULL,                -- favorites, blocked, settings, speed_dial, theme_prefs
    data JSONB NOT NULL,

    -- Meta
    synced_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, data_type)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_data ENABLE ROW LEVEL SECURITY;

-- Profil politikaları
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Satın alma politikaları
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Değerlendirme politikaları
CREATE POLICY "Users can view all reviews" ON reviews
    FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON reviews
    FOR ALL USING (auth.uid() = user_id);

-- Sync data politikaları
CREATE POLICY "Users can manage own sync data" ON user_sync_data
    FOR ALL USING (auth.uid() = user_id);

-- Mağaza temaları herkes görebilir
CREATE POLICY "Anyone can view approved themes" ON store_themes
    FOR SELECT USING (is_approved = true AND is_active = true);

-- Mağaza zil sesleri herkes görebilir
CREATE POLICY "Anyone can view approved ringtones" ON store_ringtones
    FOR SELECT USING (is_approved = true AND is_active = true);
```

---

## 4. Kullanılacak React Native Bileşenleri

### 4.1 UI Kütüphaneleri

| Kütüphane | Kullanım Alanı | Öncelik |
|-----------|----------------|---------|
| **React Native Paper** | Ana UI bileşenleri (Button, Card, Dialog, List, TextInput, FAB, Snackbar, Menu) | ⭐⭐⭐ |
| **React Native Elements** | Avatar, Badge, Overlay, SearchBar, Slider | ⭐⭐⭐ |
| **NativeBase** | Alternatif/ek bileşenler gerekirse | ⭐⭐ |
| **Shoutem UI** | Özel kart tasarımları, banner'lar | ⭐ |

### 4.2 Navigasyon

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **React Navigation** | Stack, Tab, Drawer navigasyonları |
| **@react-navigation/bottom-tabs** | Ana tab bar |
| **@react-navigation/stack** | Ekran yığınları |
| **@react-navigation/drawer** | Yan menü |

### 4.3 Animasyon ve Gesture

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **React Native Reanimated** | Performanslı animasyonlar, shared transitions |
| **React Native Gesture Handler** | Swipe, pinch, long press |
| **Lottie for React Native** | JSON animasyonlar, loading, success/error |
| **React Native Animatable** | Basit fade, zoom, rotate animasyonları |

### 4.4 Native Modüller

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **react-native-contacts** | Cihaz rehberine erişim |
| **react-native-callkeep** | Çağrı yönetimi, VoIP desteği |
| **react-native-call-log** | Çağrı geçmişi okuma |
| **react-native-incall-manager** | Arama sırasında ses/proximity yönetimi |
| **react-native-permissions** | İzin yönetimi |
| **react-native-fs** | Dosya sistemi işlemleri |
| **react-native-sound** | Zil sesi çalma/önizleme |
| **react-native-video** | Video arama preview |
| **@react-native-google-signin/google-signin** | Google hesap girişi |
| **react-native-calendar-events** | Cihaz takvimi erişimi |

### 4.5 Veritabanı ve Depolama

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **react-native-sqlite-storage** | Yerel SQLite veritabanı |
| **@supabase/supabase-js** | Bulut veritabanı, auth, realtime |
| **@react-native-async-storage/async-storage** | Key-value depolama |

### 4.6 Diğer Önemli Kütüphaneler

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **React Native Vector Icons** | İkonlar (MaterialIcons, FontAwesome, Ionicons) |
| **react-native-linear-gradient** | Gradient arka planlar |
| **@gorhom/bottom-sheet** | Alt sayfa modalleri |
| **react-native-modal** | Modal diyaloglar |
| **react-native-modalize** | Gelişmiş alt kaydırmalı modaller |
| **react-native-calendars** | Takvim bileşeni |
| **react-native-push-notification** | Yerel bildirimler |
| **@react-native-firebase/messaging** | FCM push bildirimleri |
| **react-native-image-picker** | Fotoğraf seçme/çekme |
| **react-native-fast-image** | Performanslı resim yükleme |
| **date-fns** | Tarih formatlama |
| **libphonenumber-js** | Telefon numarası formatlama |
| **react-native-uuid** | UUID oluşturma |

### 4.7 Floating/PiP için

| Kütüphane | Kullanım Alanı |
|-----------|----------------|
| **react-native-pip-android** | Picture-in-Picture modu |
| **react-native-floating-bubble** | Floating widget (Android) |
| **react-native-system-setting** | Sistem overlay izni kontrolü |

---

## 5. Ayarlar Yapısı (Kullanıcı Dostu)

> **Detaylı ayarlar dokümantasyonu için:** [`SETTINGS.md`](./SETTINGS.md) dosyasına bakın.

### ⚠️ KRİTİK: Proximity Sensörü (Yakınlık Sensörü)

**Bu özellik ZORUNLUDUR ve varsayılan olarak AÇIK olmalıdır.**

```typescript
// Proximity Sensörü - Arama sırasında
// Telefon kulağa yaklaştığında:
// 1. Ekran kapanır
// 2. Dokunmatik devre dışı kalır
// Telefon kulaktan uzaklaştığında:
// 1. Ekran açılır
// 2. Dokunmatik aktif olur

interface ProximitySensorSettings {
  enabled: boolean;                    // Varsayılan: true (ZORUNLU)
  sensitivity: 'low' | 'normal' | 'high';
  screenOnDelay: number;               // ms (200ms önerilen)
}
```

**Neden Kritik?**
- Yanlış dokunuşları önler (arama sırasında yanakla tuşa basma)
- Pil tasarrufu sağlar
- Kullanıcı deneyimi için temel özellik
- Tüm telefon uygulamalarında standart

### 5.1 Ayarlar Ana Ekranı

```
┌─────────────────────────────────────┐
│  ⚙️  Ayarlar                        │
├─────────────────────────────────────┤
│                                     │
│  🎨 Görünüm                         │
│     Tema, sekmeler, yazı boyutu     │
│                                     │
│  ⚡ Davranış                        │
│     Hızlı eylemler, arama bilgi     │
│                                     │
│  🔢 Tuş Takımı                      │
│     T9, sesler, titreşim            │
│                                     │
│  👥 Kişiler                         │
│     Sıralama, görünüm, sync         │
│                                     │
│  📋 Arama Geçmişi                   │
│     Gruplama, filtreleme            │
│                                     │
│  📞 Gelen/Giden Çağrılar ★          │
│     Ekranlar, PROXIMITY SENSÖRÜ     │
│                                     │
│  📱 Çift SIM                        │
│     SIM tercihleri                  │
│                                     │
│  🚫 Kara Liste                      │
│     Engellenen numaralar            │
│                                     │
│  📅 Takvim & Notlar                 │
│     Google sync, hatırlatıcılar     │
│                                     │
│  🔔 Bildirimler                     │
│     Sesler, titreşim, LED           │
│                                     │
│  ☁️ Yedekleme                       │
│  🔔 Bildirimler                     │
│     Sesler, Titreşim, LED          │
│                                     │
│  🔒 Gizlilik                        │
│     Engelleme, Kilit, Gizli Mod    │
│                                     │
│  ☁️ Yedekleme                       │
│     Otomatik, Manuel, Geri Yükle   │
│                                     │
│  ℹ️ Hakkında                        │
│     Sürüm, Yardım, Geri Bildirim   │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 Detaylı Ayar Kategorileri

```typescript
interface AppSettings {
  // ═══════════════════════════════════
  // GÖRÜNÜM AYARLARI
  // ═══════════════════════════════════
  appearance: {
    // Tema
    appTheme: string;                       // Tema ID
    followSystemTheme: boolean;             // Sistem temasını takip et

    // Arama Ekranı Temaları
    incomingVoiceTheme: string;
    incomingVideoTheme: string;
    outgoingVoiceTheme: string;
    outgoingVideoTheme: string;
    inCallTheme: string;
    inVideoCallTheme: string;
    floatingCallTheme: string;
    dialerTheme: string;

    // Yazı
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;

    // Animasyonlar
    animationsEnabled: boolean;
    reduceMotion: boolean;
  };

  // ═══════════════════════════════════
  // ARAMA AYARLARI
  // ═══════════════════════════════════
  calls: {
    // Zil Sesi
    defaultRingtone: string;
    ringtoneVolume: number;

    // Titreşim
    vibrateOnRing: boolean;
    vibrationPattern: 'default' | 'short' | 'long' | 'none';

    // Flaş
    flashOnRing: boolean;

    // Davranış
    answerOnHeadset: boolean;
    endCallOnPowerButton: boolean;
    proximityScreenOff: boolean;

    // Otomatik Cevaplama
    autoAnswer: {
      enabled: boolean;
      delay: number;
      onlyFavorites: boolean;
      onlyBluetooth: boolean;
    };

    // Mesajla Reddet (SMS uygulamasını açar - Google Play uyumlu)
    rejectWithSms: {
      enabled: boolean;
      templates: string[];
      openSmsApp: true;                // SMS uygulamasına yönlendirir
    };

    // Arama Sırasında Not (Google Play Uyumlu - Kayıt yerine)
    callNotes: {
      enabled: boolean;
      showNoteButtonInCall: boolean;   // Arama ekranında not butonu
      promptNoteAfterCall: boolean;    // Arama sonrası not sor
      promptOnlyForContacts: boolean;  // Sadece kayıtlı kişiler için
      promptMinDuration: number;       // Min süre (saniye)
      enableVoiceNote: boolean;        // Sesli not kaydı (arama bittikten sonra)
    };

    // Floating UI
    floatingCall: {
      enabled: boolean;
      autoMinimize: boolean;
      showOnLockScreen: boolean;
    };
  };

  // ═══════════════════════════════════
  // REHBER AYARLARI
  // ═══════════════════════════════════
  contacts: {
    // Görünüm
    sortBy: 'firstName' | 'lastName' | 'displayName';
    nameFormat: 'firstLast' | 'lastFirst';
    listStyle: 'compact' | 'comfortable' | 'large';
    showPhotos: boolean;
    defaultPhoto: 'initials' | 'icon' | 'silhouette';

    // Senkronizasyon
    deviceSync: {
      enabled: boolean;
      autoSync: boolean;
      syncPhotos: boolean;
      syncInterval: number;
    };

    // Akıllı Öneriler
    showFrequentContacts: boolean;
    showBirthdayReminders: boolean;
  };

  // ═══════════════════════════════════
  // TAKVİM AYARLARI
  // ═══════════════════════════════════
  calendar: {
    // Görünüm
    defaultView: 'month' | 'week' | 'day' | 'agenda';
    weekStartsOn: 'sunday' | 'monday';
    showWeekNumbers: boolean;

    // Google Sync
    googleSync: {
      enabled: boolean;
      accountEmail: string;
      syncDirection: 'both' | 'from_google' | 'to_google';
      calendarsToSync: string[];
      syncFrequency: number;
    };

    // Varsayılan Hatırlatıcı
    defaultReminders: number[];             // Dakika cinsinden

    // Zaman Dilimi
    timezone: string;
    autoTimezone: boolean;
  };

  // ═══════════════════════════════════
  // BİLDİRİM AYARLARI
  // ═══════════════════════════════════
  notifications: {
    // Cevapsız Arama
    missedCall: {
      enabled: boolean;
      sound: string;
      vibrate: boolean;
      showPreview: boolean;
    };

    // Mesaj (gelecekte SMS desteği için)
    message: {
      enabled: boolean;
      sound: string;
      vibrate: boolean;
      showPreview: boolean;
    };

    // Takvim
    calendar: {
      enabled: boolean;
      sound: string;
      vibrate: boolean;
    };

    // Hatırlatıcı
    reminder: {
      enabled: boolean;
      sound: string;
      vibrate: boolean;
      persistent: boolean;
    };

    // LED
    ledEnabled: boolean;
    ledColor: string;

    // Rahatsız Etme
    doNotDisturb: {
      enabled: boolean;
      allowFavorites: boolean;
      allowRepeatCallers: boolean;
      schedule: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        days: number[];
      };
    };
  };

  // ═══════════════════════════════════
  // GİZLİLİK AYARLARI
  // ═══════════════════════════════════
  privacy: {
    // Engelleme
    blockUnknownCallers: boolean;
    blockHiddenNumbers: boolean;
    blockSpamCallers: boolean;

    // Uygulama Kilidi
    appLock: {
      enabled: boolean;
      method: 'pin' | 'pattern' | 'biometric';
      lockDelay: number;                    // Saniye
      lockOnBackground: boolean;
    };

    // Gizli Mod
    incognitoMode: {
      enabled: boolean;
      hideCallHistory: boolean;
      hideContacts: boolean;
    };

    // Arayan Kimliği
    showMyCallerId: 'always' | 'never' | 'contacts_only';
  };

  // ═══════════════════════════════════
  // SENKRONİZASYON AYARLARI
  // ═══════════════════════════════════
  sync: {
    // Bulut Sync
    cloudSync: {
      enabled: boolean;
      wifiOnly: boolean;
      syncFavorites: boolean;
      syncBlocked: boolean;
      syncSettings: boolean;
      syncThemes: boolean;
    };

    // Otomatik Yedekleme
    autoBackup: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      includeCallHistory: boolean;
      includeNotes: boolean;
      includeCalendar: boolean;
      wifiOnly: boolean;
    };
  };

  // ═══════════════════════════════════
  // GELİŞMİŞ AYARLAR
  // ═══════════════════════════════════
  advanced: {
    // Varsayılan Uygulama
    defaultDialerEnabled: boolean;
    defaultContactsEnabled: boolean;

    // Performans
    lowPowerMode: boolean;
    cacheSize: 'small' | 'medium' | 'large';

    // Geliştirici
    debugMode: boolean;
    showPerformanceOverlay: boolean;
  };
}
```

---

## 6. Proje Klasör Yapısı

```
src/
├── app/
│   ├── App.tsx
│   ├── store.ts
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── MainTabNavigator.tsx
│       ├── CallStackNavigator.tsx
│       ├── ContactStackNavigator.tsx
│       ├── CalendarStackNavigator.tsx
│       ├── SettingsStackNavigator.tsx
│       └── types.ts
│
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── authSlice.ts
│   │
│   ├── contacts/
│   │   ├── screens/
│   │   │   ├── ContactListScreen.tsx
│   │   │   ├── ContactDetailScreen.tsx
│   │   │   ├── ContactEditScreen.tsx
│   │   │   ├── FavoritesScreen.tsx
│   │   │   └── ContactGroupsScreen.tsx
│   │   ├── components/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactAvatar.tsx
│   │   │   ├── AlphabetScroller.tsx
│   │   │   ├── ContactActionSheet.tsx
│   │   │   └── RingtoneSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useContacts.ts
│   │   │   ├── useFavorites.ts
│   │   │   └── useContactSync.ts
│   │   ├── services/
│   │   │   ├── contactsService.ts
│   │   │   └── deviceContactsService.ts
│   │   └── contactsSlice.ts
│   │
│   ├── calls/
│   │   ├── screens/
│   │   │   ├── CallHistoryScreen.tsx
│   │   │   ├── CallDetailScreen.tsx
│   │   │   ├── DialerScreen.tsx
│   │   │   ├── IncomingCallScreen.tsx
│   │   │   ├── IncomingVideoCallScreen.tsx
│   │   │   ├── OutgoingCallScreen.tsx
│   │   │   ├── OutgoingVideoCallScreen.tsx
│   │   │   ├── InCallScreen.tsx
│   │   │   ├── InVideoCallScreen.tsx
│   │   │   └── FloatingCallScreen.tsx
│   │   ├── components/
│   │   │   ├── CallLogItem.tsx
│   │   │   ├── CallLogStats.tsx
│   │   │   ├── Dialpad.tsx
│   │   │   ├── CallActionButton.tsx
│   │   │   ├── CallTimer.tsx
│   │   │   ├── FloatingCallWidget.tsx
│   │   │   └── VideoCallControls.tsx
│   │   ├── hooks/
│   │   │   ├── useCallManager.ts
│   │   │   ├── useCallHistory.ts
│   │   │   └── useFloatingCall.ts
│   │   ├── services/
│   │   │   ├── callService.ts
│   │   │   └── callNotesService.ts      # Arama sırasında/sonrası not
│   │   └── callsSlice.ts
│   │
│   ├── calendar/
│   │   ├── screens/
│   │   │   ├── CalendarScreen.tsx
│   │   │   ├── AgendaScreen.tsx
│   │   │   ├── EventDetailScreen.tsx
│   │   │   └── EventEditScreen.tsx
│   │   ├── components/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   └── MonthView.tsx
│   │   ├── hooks/
│   │   │   ├── useCalendar.ts
│   │   │   └── useGoogleCalendarSync.ts
│   │   ├── services/
│   │   │   ├── calendarService.ts
│   │   │   └── googleCalendarService.ts
│   │   └── calendarSlice.ts
│   │
│   ├── notes/
│   │   ├── screens/
│   │   │   ├── NotesListScreen.tsx
│   │   │   ├── NoteDetailScreen.tsx
│   │   │   └── NoteEditorScreen.tsx
│   │   ├── components/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── NoteCategories.tsx
│   │   ├── hooks/
│   │   │   └── useNotes.ts
│   │   ├── services/
│   │   │   └── notesService.ts
│   │   └── notesSlice.ts
│   │
│   ├── reminders/
│   │   ├── screens/
│   │   │   ├── RemindersScreen.tsx
│   │   │   └── ReminderEditScreen.tsx
│   │   ├── components/
│   │   │   ├── ReminderCard.tsx
│   │   │   └── ReminderForm.tsx
│   │   ├── hooks/
│   │   │   └── useReminders.ts
│   │   ├── services/
│   │   │   └── remindersService.ts
│   │   └── remindersSlice.ts
│   │
│   ├── themes/
│   │   ├── screens/
│   │   │   ├── ThemeStoreScreen.tsx
│   │   │   ├── ThemeDetailScreen.tsx
│   │   │   ├── ThemeCustomizeScreen.tsx
│   │   │   └── MyThemesScreen.tsx
│   │   ├── components/
│   │   │   ├── ThemeCard.tsx
│   │   │   ├── ThemePreview.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── ThemeSelector.tsx
│   │   ├── presets/
│   │   │   ├── index.ts
│   │   │   ├── lightThemes.ts
│   │   │   ├── darkThemes.ts
│   │   │   ├── blueThemes.ts
│   │   │   ├── callThemes.ts
│   │   │   └── specialThemes.ts
│   │   ├── hooks/
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   └── themeService.ts
│   │   ├── ThemeProvider.tsx
│   │   └── themesSlice.ts
│   │
│   ├── ringtones/
│   │   ├── screens/
│   │   │   ├── RingtoneStoreScreen.tsx
│   │   │   ├── RingtoneDetailScreen.tsx
│   │   │   └── MyRingtonesScreen.tsx
│   │   ├── components/
│   │   │   ├── RingtoneCard.tsx
│   │   │   ├── RingtonePlayer.tsx
│   │   │   └── RingtoneCategories.tsx
│   │   ├── hooks/
│   │   │   └── useRingtones.ts
│   │   ├── services/
│   │   │   └── ringtoneService.ts
│   │   └── ringtonesSlice.ts
│   │
│   └── settings/
│       ├── screens/
│       │   ├── SettingsScreen.tsx
│       │   ├── AppearanceSettingsScreen.tsx
│       │   ├── CallSettingsScreen.tsx
│       │   ├── ContactSettingsScreen.tsx
│       │   ├── CalendarSettingsScreen.tsx
│       │   ├── NotificationSettingsScreen.tsx
│       │   ├── SyncSettingsScreen.tsx
│       │   ├── PrivacySettingsScreen.tsx
│       │   ├── BackupSettingsScreen.tsx
│       │   ├── BlockedNumbersScreen.tsx
│       │   └── AboutScreen.tsx
│       ├── components/
│       │   ├── SettingItem.tsx
│       │   ├── SettingSection.tsx
│       │   ├── SettingSwitch.tsx
│       │   └── SettingPicker.tsx
│       └── settingsSlice.ts
│
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Badge.tsx
│   │   ├── Divider.tsx
│   │   ├── FAB.tsx
│   │   └── ConfirmDialog.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── usePermissions.ts
│   │   ├── useDebounce.ts
│   │   ├── useKeyboard.ts
│   │   └── useNetworkStatus.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       ├── helpers.ts
│       ├── colors.ts
│       └── constants.ts
│
├── database/
│   ├── sqlite/
│   │   ├── database.ts
│   │   ├── migrations/
│   │   │   ├── 001_initial.ts
│   │   │   ├── 002_calendar.ts
│   │   │   ├── 003_notes.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── contactsRepository.ts
│   │   │   ├── callLogsRepository.ts
│   │   │   ├── eventsRepository.ts
│   │   │   ├── notesRepository.ts
│   │   │   ├── remindersRepository.ts
│   │   │   ├── themesRepository.ts
│   │   │   ├── ringtonesRepository.ts
│   │   │   └── settingsRepository.ts
│   │   └── models/
│   │       └── index.ts
│   └── supabase/
│       ├── client.ts
│       ├── auth.ts
│       ├── themeStore.ts
│       ├── ringtoneStore.ts
│       └── sync.ts
│
├── services/
│   ├── native/
│   │   ├── CallManager.ts
│   │   ├── ContactsManager.ts
│   │   ├── CalendarManager.ts
│   │   ├── NotificationManager.ts
│   │   ├── PermissionsManager.ts
│   │   └── FloatingWindowManager.ts
│   └── api/
│       ├── googleCalendarApi.ts
│       └── storeApi.ts
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── config.ts
│   └── permissions.ts
│
└── types/
    ├── contact.ts
    ├── call.ts
    ├── calendar.ts
    ├── note.ts
    ├── reminder.ts
    ├── theme.ts
    ├── ringtone.ts
    ├── settings.ts
    └── navigation.ts
```

---

## 7. Android Manifest İzinleri

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- ═══════════════════════════════════ -->
    <!-- TEMEL İZİNLER                        -->
    <!-- ═══════════════════════════════════ -->

    <!-- Rehber -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />

    <!-- Telefon -->
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.WRITE_CALL_LOG" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.MANAGE_OWN_CALLS" />

    <!-- Takvim -->
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    <uses-permission android:name="android.permission.WRITE_CALENDAR" />

    <!-- ═══════════════════════════════════ -->
    <!-- MEDYA VE DEPOLAMA                    -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- ═══════════════════════════════════ -->
    <!-- BİLDİRİMLER VE SİSTEM               -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />

    <!-- ═══════════════════════════════════ -->
    <!-- AĞ                                   -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- ═══════════════════════════════════ -->
    <!-- FOREGROUND SERVICE                   -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <!-- ═══════════════════════════════════ -->
    <!-- FLOATING WINDOW / PIP               -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- ═══════════════════════════════════ -->
    <!-- BİYOMETRİK                           -->
    <!-- ═══════════════════════════════════ -->

    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />

    <!-- ═══════════════════════════════════ -->
    <!-- FEATURES                             -->
    <!-- ═══════════════════════════════════ -->

    <uses-feature android:name="android.hardware.telephony" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:name=".MainApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <!-- ═══════════════════════════════════ -->
        <!-- VARSAYILAN ARAMA UYGULAMASI         -->
        <!-- ═══════════════════════════════════ -->

        <activity
            android:name=".MainActivity"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true"
            android:supportsPictureInPicture="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Dialer Intent -->
            <intent-filter>
                <action android:name="android.intent.action.DIAL" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.DIAL" />
                <data android:scheme="tel" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>

            <!-- View tel: links -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <data android:scheme="tel" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
            </intent-filter>

            <!-- Call Intent -->
            <intent-filter>
                <action android:name="android.intent.action.CALL" />
                <data android:scheme="tel" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>

        </activity>

        <!-- ═══════════════════════════════════ -->
        <!-- INCALL SERVICE                      -->
        <!-- ═══════════════════════════════════ -->

        <service
            android:name=".InCallService"
            android:permission="android.permission.BIND_INCALL_SERVICE"
            android:exported="true">
            <meta-data
                android:name="android.telecom.IN_CALL_SERVICE_UI"
                android:value="true" />
            <meta-data
                android:name="android.telecom.IN_CALL_SERVICE_RINGING"
                android:value="true" />
            <intent-filter>
                <action android:name="android.telecom.InCallService" />
            </intent-filter>
        </service>

        <!-- ═══════════════════════════════════ -->
        <!-- CALL RECEIVER                       -->
        <!-- ═══════════════════════════════════ -->

        <receiver
            android:name=".CallReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.PHONE_STATE" />
            </intent-filter>
        </receiver>

        <!-- ═══════════════════════════════════ -->
        <!-- BOOT RECEIVER (Hatırlatıcılar)      -->
        <!-- ═══════════════════════════════════ -->

        <receiver
            android:name=".BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

        <!-- ═══════════════════════════════════ -->
        <!-- FLOATING CALL SERVICE               -->
        <!-- ═══════════════════════════════════ -->

        <service
            android:name=".FloatingCallService"
            android:exported="false"
            android:foregroundServiceType="phoneCall" />

    </application>

</manifest>
```

---

## 8. Geliştirme Fazları

### Faz 1: Temel Altyapı (2-3 hafta)
- [ ] React Native + TypeScript proje kurulumu
- [ ] Klasör yapısı oluşturma
- [ ] React Navigation kurulumu
- [ ] Redux Toolkit + RTK Query kurulumu
- [ ] SQLite veritabanı ve şema
- [ ] Supabase client kurulumu
- [ ] Temel UI bileşenleri (Paper + Elements)
- [ ] Tema Provider altyapısı
- [ ] İzin yönetim sistemi

### Faz 2: Rehber Modülü (2-3 hafta)
- [ ] Kişi listesi ekranı (alfabetik kaydırma)
- [ ] Kişi detay ekranı
- [ ] Kişi ekleme/düzenleme
- [ ] Favoriler ekranı (grid görünüm)
- [ ] Cihaz rehberi senkronizasyonu
- [ ] Profil resmi sync
- [ ] Kişiye özel zil sesi
- [ ] Arama ve filtreleme

### Faz 3: Çağrı Modülü (3-4 hafta)
- [ ] Detaylı çağrı geçmişi ekranı
- [ ] Çağrı istatistikleri
- [ ] Tuş takımı ekranı
- [ ] Gelen arama ekranı (sesli)
- [ ] Giden arama ekranı (sesli)
- [ ] Arama sırasında ekran
- [ ] Video arama UI altyapısı
- [ ] Floating call widget
- [ ] CallKeep entegrasyonu
- [ ] Varsayılan uygulama kaydı

### Faz 4: Takvim ve Hatırlatıcılar (2-3 hafta)
- [ ] Takvim ekranı (ay/hafta/gün)
- [ ] Etkinlik ekleme/düzenleme
- [ ] Google Calendar OAuth
- [ ] Google Calendar sync (çift yönlü)
- [ ] Hatırlatıcılar modülü
- [ ] Bildirim zamanlaması
- [ ] Tekrarlayan etkinlikler

### Faz 5: Notlar Modülü (1-2 hafta)
- [ ] Not listesi ekranı
- [ ] Zengin metin editörü
- [ ] Not kategorileri
- [ ] Kişi/etkinlik bağlantısı
- [ ] Arama ve filtreleme

### Faz 6: Tema Sistemi (2-3 hafta)
- [ ] Varsayılan temalar (15+ renk)
- [ ] Tema context ve provider
- [ ] Arama ekranı temaları
- [ ] Tema önizleme
- [ ] Tema özelleştirme
- [ ] Tema kaydetme/yükleme

### Faz 7: Mağazalar (2-3 hafta)
- [ ] Tema mağazası ekranı
- [ ] Tema detay ve önizleme
- [ ] Zil sesi mağazası ekranı
- [ ] Zil sesi önizleme/indirme
- [ ] Satın alma sistemi
- [ ] Değerlendirme sistemi

### Faz 8: Ayarlar (2 hafta)
- [ ] Tüm ayar ekranları
- [ ] Ayar kalıcılığı
- [ ] Google hesap bağlama
- [ ] Engelli numaralar yönetimi
- [ ] Yedekleme/geri yükleme
- [ ] Uygulama kilidi

### Faz 9: Kimlik Doğrulama (1-2 hafta)
- [ ] Supabase Auth entegrasyonu
- [ ] Giriş/kayıt ekranları
- [ ] Google ile giriş
- [ ] Profil yönetimi
- [ ] Premium sistem

### Faz 10: Test ve İyileştirme (2-3 hafta)
- [ ] Unit testler
- [ ] Integration testler
- [ ] E2E testler
- [ ] Performans optimizasyonu
- [ ] Bellek yönetimi
- [ ] Bug düzeltmeleri
- [ ] UI/UX iyileştirmeleri

---

## 9. Önemli Notlar

### Performans
1. FlatList ile sanallaştırma (1000+ kişi)
2. Resimler için FastImage + thumbnail
3. SQLite index'leri aktif kullan
4. Memo ve useCallback optimizasyonları
5. Lazy loading ile ekran yükleme

### Güvenlik
1. Hassas verileri şifrele (Keychain/Keystore)
2. Supabase RLS aktif
3. API anahtarlarını .env'de sakla
4. Biometric authentication desteği

### Android Uyumluluk
1. Android 10+: Scoped storage
2. Android 12+: Exact alarms izni
3. Android 13+: Granular media permissions
4. Android 14+: Foreground service tipi zorunlu

### Test Cihazları
- Samsung (OneUI)
- Xiaomi (MIUI)
- Huawei (EMUI)
- Stock Android (Pixel)

---

## 10. Çoklu Dil Desteği (i18n)

### 10.1 Desteklenen Diller

| Kod | Dil | Durum |
|-----|-----|-------|
| `tr` | Türkçe | Varsayılan |
| `en` | English | Desteklenir |
| `de` | Deutsch | Desteklenir |
| `fr` | Français | Desteklenir |
| `es` | Español | Desteklenir |
| `ar` | العربية | Desteklenir (RTL) |
| `ru` | Русский | Desteklenir |

### 10.2 Kullanılacak Kütüphane

```bash
npm install i18next react-i18next react-native-localize
```

### 10.3 Klasör Yapısı

```
src/
├── locales/
│   ├── index.ts              # i18n konfigürasyonu
│   ├── tr/
│   │   ├── common.json       # Ortak metinler
│   │   ├── contacts.json     # Rehber metinleri
│   │   ├── calls.json        # Arama metinleri
│   │   ├── calendar.json     # Takvim metinleri
│   │   ├── notes.json        # Not metinleri
│   │   ├── settings.json     # Ayar metinleri
│   │   └── errors.json       # Hata mesajları
│   ├── en/
│   │   ├── common.json
│   │   ├── contacts.json
│   │   └── ...
│   └── de/
│       └── ...
```

### 10.4 JSON Dil Dosyası Örneği

```json
// locales/tr/common.json
{
  "app": {
    "name": "CallHub",
    "tagline": "Tüm iletişimin tek yeri"
  },
  "tabs": {
    "favorites": "Favoriler",
    "calls": "Aramalar",
    "contacts": "Rehber",
    "calendar": "Takvim",
    "settings": "Ayarlar"
  },
  "actions": {
    "save": "Kaydet",
    "cancel": "İptal",
    "delete": "Sil",
    "edit": "Düzenle",
    "add": "Ekle",
    "search": "Ara",
    "confirm": "Onayla",
    "back": "Geri",
    "next": "İleri",
    "done": "Tamam",
    "retry": "Tekrar Dene"
  },
  "messages": {
    "loading": "Yükleniyor...",
    "noResults": "Sonuç bulunamadı",
    "error": "Bir hata oluştu",
    "success": "İşlem başarılı",
    "confirmDelete": "Silmek istediğinize emin misiniz?"
  },
  "time": {
    "now": "Şimdi",
    "today": "Bugün",
    "yesterday": "Dün",
    "tomorrow": "Yarın",
    "justNow": "Az önce",
    "minutesAgo": "{{count}} dakika önce",
    "hoursAgo": "{{count}} saat önce",
    "daysAgo": "{{count}} gün önce"
  }
}

// locales/tr/contacts.json
{
  "title": "Rehber",
  "searchPlaceholder": "{{count}} kişi içinde ara...",
  "addContact": "Kişi Ekle",
  "editContact": "Kişiyi Düzenle",
  "deleteContact": "Kişiyi Sil",
  "favorites": "Favoriler",
  "frequentContacts": "Sık İletişim Kurulanlar",
  "allContacts": "Tüm Kişiler",
  "noContacts": "Henüz kişi eklenmemiş",
  "fields": {
    "firstName": "Ad",
    "lastName": "Soyad",
    "phone": "Telefon",
    "email": "E-posta",
    "company": "Şirket",
    "address": "Adres",
    "birthday": "Doğum Günü",
    "notes": "Notlar"
  },
  "labels": {
    "mobile": "Cep",
    "home": "Ev",
    "work": "İş",
    "other": "Diğer"
  },
  "actions": {
    "call": "Ara",
    "message": "Mesaj",
    "video": "Görüntülü",
    "addToFavorites": "Favorilere Ekle",
    "removeFromFavorites": "Favorilerden Kaldır",
    "block": "Engelle",
    "share": "Paylaş"
  }
}

// locales/tr/calls.json
{
  "title": "Aramalar",
  "history": "Çağrı Geçmişi",
  "dialer": "Tuş Takımı",
  "types": {
    "incoming": "Gelen",
    "outgoing": "Giden",
    "missed": "Cevapsız",
    "rejected": "Reddedilen",
    "blocked": "Engellenen"
  },
  "categories": {
    "voice": "Sesli",
    "video": "Görüntülü"
  },
  "duration": {
    "seconds": "{{count}} sn",
    "minutes": "{{count}} dk",
    "hours": "{{count}} sa"
  },
  "inCall": {
    "calling": "Aranıyor...",
    "ringing": "Çalıyor...",
    "connected": "Bağlandı",
    "onHold": "Beklemede",
    "ended": "Arama Sonlandı"
  },
  "actions": {
    "answer": "Cevapla",
    "reject": "Reddet",
    "endCall": "Bitir",
    "mute": "Sessiz",
    "unmute": "Sesi Aç",
    "speaker": "Hoparlör",
    "keypad": "Tuş Takımı",
    "hold": "Beklet",
    "addCall": "Arama Ekle",
    "merge": "Birleştir",
    "swap": "Değiştir"
  },
  "floating": {
    "minimize": "Küçült",
    "maximize": "Büyüt"
  }
}

// locales/tr/settings.json
{
  "title": "Ayarlar",
  "sections": {
    "account": "Hesap",
    "appearance": "Görünüm",
    "calls": "Aramalar",
    "contacts": "Rehber",
    "calendar": "Takvim",
    "notifications": "Bildirimler",
    "privacy": "Gizlilik",
    "backup": "Yedekleme",
    "about": "Hakkında"
  },
  "appearance": {
    "theme": "Tema",
    "darkMode": "Karanlık Mod",
    "lightMode": "Aydınlık Mod",
    "systemTheme": "Sistem Temasını Kullan",
    "customTheme": "Özel Tema",
    "themeStore": "Tema Mağazası",
    "fontSize": "Yazı Boyutu",
    "language": "Dil"
  },
  "language": {
    "title": "Dil Seçimi",
    "systemLanguage": "Sistem Dili",
    "selectLanguage": "Dil Seçin"
  }
}
```

### 10.5 i18n Konfigürasyonu

```typescript
// src/locales/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Dil dosyaları
import trCommon from './tr/common.json';
import trContacts from './tr/contacts.json';
import trCalls from './tr/calls.json';
import trCalendar from './tr/calendar.json';
import trSettings from './tr/settings.json';

import enCommon from './en/common.json';
import enContacts from './en/contacts.json';
import enCalls from './en/calls.json';
import enCalendar from './en/calendar.json';
import enSettings from './en/settings.json';

// Kaynak tanımları
const resources = {
  tr: {
    common: trCommon,
    contacts: trContacts,
    calls: trCalls,
    calendar: trCalendar,
    settings: trSettings,
  },
  en: {
    common: enCommon,
    contacts: enContacts,
    calls: enCalls,
    calendar: enCalendar,
    settings: enSettings,
  },
};

// Cihaz dilini al
const getDeviceLanguage = (): string => {
  const locales = RNLocalize.getLocales();
  const deviceLanguage = locales[0]?.languageCode || 'tr';
  return Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'tr';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'tr',
    defaultNS: 'common',
    ns: ['common', 'contacts', 'calls', 'calendar', 'settings'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Dil değiştirme fonksiyonu
export const changeLanguage = async (languageCode: string) => {
  await i18n.changeLanguage(languageCode);
  // AsyncStorage'a kaydet
  // RNRestart.Restart(); // RTL değişikliği için restart gerekebilir
};

// Desteklenen diller listesi
export const supportedLanguages = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', rtl: false },
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
];
```

### 10.6 Kullanım Örneği

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const ContactListScreen = () => {
  const { t } = useTranslation(['contacts', 'common']);
  const contactCount = 1979;

  return (
    <View>
      <Text>{t('contacts:title')}</Text>
      <Text>{t('contacts:searchPlaceholder', { count: contactCount })}</Text>
      <Text>{t('common:actions.save')}</Text>
    </View>
  );
};
```

### 10.7 Yeni Dil Ekleme Rehberi

1. `src/locales/` altında yeni dil klasörü oluştur (örn: `it/` İtalyanca için)
2. Tüm JSON dosyalarını kopyala ve çevir
3. `src/locales/index.ts` dosyasına import ekle
4. `resources` objesine yeni dili ekle
5. `supportedLanguages` listesine ekle

```typescript
// Yeni dil ekleme örneği
import itCommon from './it/common.json';
// ...

const resources = {
  // ...mevcut diller
  it: {
    common: itCommon,
    // ...
  },
};

export const supportedLanguages = [
  // ...mevcut diller
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
];
```

---

*Son Güncelleme: Ocak 2026*
*Versiyon: 2.1*
