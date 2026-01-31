# CallHub - Birleştirilmiş Veritabanı Şeması

Bu doküman SQLite (yerel) ve Supabase (bulut) veritabanı şemalarının birleştirilmiş halini içerir.

---

## 1. Senkronizasyon Stratejisi

### 1.1 WhatsApp Tarzı Yedekleme Yaklaşımı

```
┌─────────────────┐                      ┌─────────────────┐
│     SQLite      │                      │    Supabase     │
│  (Yerel/Birincil)│                      │  (Bulut/Yedek)  │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         │  ┌──────────────────────────────┐     │
         │  │      SYNC TÜRLERİ            │     │
         │  ├──────────────────────────────┤     │
         ├──┤ 🔴 Anlık    : Purchases      ├─────┤
         │  │              Profiles        │     │
         │  ├──────────────────────────────┤     │
         ├──┤ 🟡 Günlük   : Notes          ├─────┤ (Gece/Wi-Fi)
         │  │   Yedekleme   Events         │     │
         │  │              Call Logs       │     │
         │  │              Call Notes      │     │
         │  │              Reminders       │     │
         │  ├──────────────────────────────┤     │
         └──┤ 🟢 Sadece   : Contacts       │     │
            │   Yerel      Blocked Numbers │     │
            │              Speed Dial      │     │
            └──────────────────────────────┘
```

### 1.2 Tablo Sınıflandırması

| Kategori | Tablolar | SQLite | Supabase | Sync Tipi |
|----------|----------|--------|----------|-----------|
| **🔴 Anlık Sync** | profiles, purchases | ✅ | ✅ | Her işlemde |
| **🟡 Günlük Yedekleme** | notes, events, call_logs, call_notes, reminders, calendars | ✅ | ✅ | Günde 1x (Wi-Fi) |
| **🟢 Sadece Yerel** | contacts, blocked_numbers, speed_dial, contact_groups | ✅ | ❌ | Yedeklenmez |
| **🔵 Sadece Bulut** | store_themes, store_ringtones, reviews, categories | ❌ | ✅ | Mağaza verileri |
| **⬇️ İndirme** | themes, ringtones (satın alınan) | ✅ | ✅ | Satın alma sonrası |

### 1.3 Yedekleme Ayarları

```typescript
interface BackupSettings {
  // Otomatik Yedekleme
  autoBackupEnabled: boolean;          // Otomatik yedekleme açık/kapalı
  frequency: 'daily' | 'weekly';       // Yedekleme sıklığı
  time: string;                        // Saat (örn: "03:00")
  onlyOnWifi: boolean;                 // Sadece Wi-Fi'da

  // İçerik Seçimi
  includeCallLogs: boolean;            // Arama geçmişi dahil
  includeNotes: boolean;               // Notlar dahil
  includeCalendar: boolean;            // Takvim dahil
  includeReminders: boolean;           // Hatırlatıcılar dahil
  includeVoiceNotes: boolean;          // Sesli notlar dahil (boyut artar)

  // Son Yedekleme Bilgisi
  lastBackupAt: string | null;         // Son yedekleme zamanı
  lastBackupSize: number;              // Son yedekleme boyutu (bytes)
  lastBackupType: 'auto' | 'manual';   // Son yedekleme türü
}
```

### 1.4 Manuel Yedekleme

Kullanıcı istediği zaman manuel yedekleme yapabilir:

```typescript
interface ManualBackupOptions {
  // Seçici yedekleme
  backupNotes: boolean;
  backupCallLogs: boolean;
  backupCalendar: boolean;
  backupReminders: boolean;
  backupVoiceNotes: boolean;

  // Ek seçenekler
  compressData: boolean;               // Sıkıştırılmış yedekleme
}

// Kullanım
const backupService = new BackupService();

// Hepsini yedekle
await backupService.backupNow();

// Sadece notları yedekle
await backupService.backupNow({
  backupNotes: true,
  backupCallLogs: false,
  backupCalendar: false,
  backupReminders: false
});
```

**UI Akışı:**
```
Ayarlar > Yedekleme
├── [Şimdi Yedekle] butonu
├── Son yedekleme: 2 saat önce (Manuel)
├── Yedekleme boyutu: 12.5 MB
│
├── Otomatik Yedekleme: [Açık/Kapalı]
│   ├── Sıklık: Günlük / Haftalık
│   ├── Saat: 03:00
│   └── Sadece Wi-Fi: [Açık]
│
├── Yedekleme İçeriği:
│   ├── [✓] Notlar
│   ├── [✓] Arama geçmişi
│   ├── [✓] Takvim
│   ├── [✓] Hatırlatıcılar
│   └── [ ] Sesli notlar (büyük dosyalar)
│
└── [Yedeği Geri Yükle]
```

### 1.5 Yedekleme Tabloları için Ek Alanlar

```sql
-- SQLite tablolarına eklenen yedekleme alanları (sadece günlük yedekleme tabloları için)
backup_status TEXT DEFAULT 'pending',  -- pending, backed_up, modified
last_backup_at TEXT,                   -- Son yedekleme zamanı
```

### 1.6 Kişiler Hakkında Not

Kişiler (`contacts`) tablosu buluta **yedeklenmez** çünkü:
1. Cihaz rehberi zaten Google/iCloud ile senkronize
2. Gizlilik açısından hassas veri
3. Gereksiz veri tekrarı

Uygulama, cihaz rehberini okur ve yerel SQLite'a kopyalar. Özelleştirmeler (zil sesi, fotoğraf) yerel kalır.

---

## 2. Ortak Veri Tipleri

| SQLite | PostgreSQL | TypeScript | Açıklama |
|--------|------------|------------|----------|
| TEXT | TEXT | string | Metin |
| TEXT | UUID | string | Benzersiz ID |
| INTEGER | INTEGER | number | Tam sayı |
| REAL | DECIMAL | number | Ondalık |
| TEXT | TIMESTAMPTZ | string/Date | ISO 8601 tarih |
| TEXT | JSONB | object | JSON veri |
| INTEGER (0/1) | BOOLEAN | boolean | Mantıksal |

---

## 3. Sadece Yerel Tablolar (SQLite)

Bu tablolar cihazda kalır, buluta yedeklenmez.

### 3.1 contacts (Kişiler)

```sql
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    device_contact_id TEXT,                 -- Cihaz rehberi ID'si
    device_synced_at TEXT,                  -- Son cihaz sync

    -- Temel Bilgiler
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    company TEXT,
    job_title TEXT,

    -- Fotoğraf
    photo_uri TEXT,
    photo_thumbnail TEXT,                   -- Base64

    -- Özelleştirme (yerel)
    custom_ringtone_id TEXT,
    custom_ringtone_uri TEXT,
    vibration_pattern TEXT,                 -- JSON
    led_color TEXT,

    -- Durum
    is_favorite INTEGER DEFAULT 0,
    favorite_order INTEGER,
    is_blocked INTEGER DEFAULT 0,

    -- Ek Bilgiler
    notes TEXT,
    birthday TEXT,
    anniversary TEXT,
    website TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_device_id ON contacts(device_contact_id);
```

### 3.2 phone_numbers

```sql
CREATE TABLE phone_numbers (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    number TEXT NOT NULL,
    formatted_number TEXT,
    country_code TEXT,
    label TEXT DEFAULT 'mobile',
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_phone_numbers_contact ON phone_numbers(contact_id);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
```

### 3.3 blocked_numbers

```sql
CREATE TABLE blocked_numbers (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    contact_id TEXT,
    contact_name TEXT,
    reason TEXT,
    block_calls INTEGER DEFAULT 1,
    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);
```

### 3.4 speed_dial

```sql
CREATE TABLE speed_dial (
    position INTEGER PRIMARY KEY CHECK (position >= 1 AND position <= 9),
    contact_id TEXT,
    phone_number TEXT,
    contact_name TEXT,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

### 3.5 contact_groups

```sql
CREATE TABLE contact_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    group_ringtone_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_group_members (
    group_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    PRIMARY KEY (group_id, contact_id),
    FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

### 3.6 themes (İndirilen)

```sql
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    store_theme_id TEXT,                    -- Mağazadan indirildiyse
    name TEXT NOT NULL,
    type TEXT NOT NULL,                     -- app, incoming_call, in_call, etc.
    is_system INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0,
    config TEXT NOT NULL,                   -- JSON
    preview_image_path TEXT,
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_themes_type ON themes(type);
CREATE INDEX idx_themes_active ON themes(is_active);
```

### 3.7 ringtones (İndirilen)

```sql
CREATE TABLE ringtones (
    id TEXT PRIMARY KEY,
    store_ringtone_id TEXT,
    name TEXT NOT NULL,
    artist_name TEXT,
    file_path TEXT NOT NULL,
    duration INTEGER,
    file_size INTEGER,
    category TEXT,
    is_custom INTEGER DEFAULT 0,
    is_default_ringtone INTEGER DEFAULT 0,
    is_default_notification INTEGER DEFAULT 0,
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 3.8 google_accounts

```sql
CREATE TABLE google_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    access_token TEXT,                      -- Encrypted
    refresh_token TEXT,                     -- Encrypted
    token_expires_at TEXT,
    calendar_sync_enabled INTEGER DEFAULT 1,
    last_synced_at TEXT,
    connected_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Günlük Yedekleme Tabloları (SQLite + Supabase)

Bu tablolar yerel olarak çalışır, günde bir kez buluta yedeklenir.

### 4.1 notes (Notlar)

**SQLite:**
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,

    -- Yedekleme
    backup_status TEXT DEFAULT 'pending',   -- pending, backed_up, modified
    last_backup_at TEXT,

    -- İçerik
    title TEXT,
    content TEXT NOT NULL,                  -- JSON (Rich Text)
    plain_text_content TEXT,
    note_type TEXT DEFAULT 'text',          -- text, voice, checklist, call

    -- Organizasyon
    color TEXT DEFAULT '#FFFFFF',
    category_id TEXT,
    tags TEXT,                              -- JSON array
    is_pinned INTEGER DEFAULT 0,

    -- Sesli Not
    voice_note_path TEXT,
    voice_note_duration INTEGER,
    voice_note_waveform TEXT,               -- JSON

    -- Görseller
    images TEXT,                            -- JSON array

    -- İlişkiler
    linked_contact_id TEXT,
    linked_event_id TEXT,
    linked_call_id TEXT,

    -- Hatırlatıcı
    reminder_at TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_notes_backup ON notes(backup_status);
CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
```

**Supabase (Yedek):**
```sql
CREATE TABLE public.user_backups_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title TEXT,
    content JSONB,
    plain_text_content TEXT,
    note_type TEXT,
    color TEXT,
    tags TEXT[],
    is_pinned BOOLEAN,

    -- Sesli not Supabase Storage'da saklanır
    voice_note_url TEXT,
    voice_note_duration INTEGER,

    images JSONB,
    reminder_at TIMESTAMPTZ,

    local_created_at TIMESTAMPTZ,
    local_updated_at TIMESTAMPTZ,
    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_backups_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their backups" ON public.user_backups_notes
    FOR ALL USING (auth.uid() = user_id);
```

### 4.2 call_logs (Arama Geçmişi)

**SQLite:**
```sql
CREATE TABLE call_logs (
    id TEXT PRIMARY KEY,

    -- Yedekleme
    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    -- Kişi
    contact_id TEXT,
    phone_number TEXT NOT NULL,
    formatted_number TEXT,
    contact_name TEXT,
    contact_photo TEXT,

    -- Arama Detayları
    call_type TEXT NOT NULL,                -- incoming, outgoing, missed, rejected, blocked
    call_category TEXT DEFAULT 'voice',     -- voice, video
    duration INTEGER DEFAULT 0,

    -- Zaman
    call_datetime TEXT NOT NULL,
    call_timestamp INTEGER NOT NULL,

    -- Ek
    is_read INTEGER DEFAULT 0,
    sim_slot INTEGER,
    geocoded_location TEXT,
    has_note INTEGER DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_call_logs_timestamp ON call_logs(call_timestamp DESC);
CREATE INDEX idx_call_logs_backup ON call_logs(backup_status);
CREATE INDEX idx_call_logs_type ON call_logs(call_type);
```

**Supabase (Yedek):**
```sql
CREATE TABLE public.user_backups_call_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    phone_number TEXT NOT NULL,
    contact_name TEXT,
    call_type TEXT NOT NULL,
    call_category TEXT,
    duration INTEGER,
    call_datetime TIMESTAMPTZ NOT NULL,
    geocoded_location TEXT,

    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_backups_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their backups" ON public.user_backups_call_logs
    FOR ALL USING (auth.uid() = user_id);
```

### 4.3 call_notes (Arama Notları)

**SQLite:**
```sql
CREATE TABLE call_notes (
    id TEXT PRIMARY KEY,

    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    call_log_id TEXT NOT NULL,
    contact_id TEXT,
    phone_number TEXT,
    contact_name TEXT,

    content TEXT,                           -- JSON (Rich Text)
    plain_text_content TEXT,

    voice_note_path TEXT,
    voice_note_duration INTEGER,
    voice_note_waveform TEXT,

    call_type TEXT,
    call_duration INTEGER,
    call_datetime TEXT,
    noted_at TEXT NOT NULL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (call_log_id) REFERENCES call_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_call_notes_backup ON call_notes(backup_status);
CREATE INDEX idx_call_notes_call ON call_notes(call_log_id);
```

**Supabase (Yedek):**
```sql
CREATE TABLE public.user_backups_call_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    phone_number TEXT,
    contact_name TEXT,
    content JSONB,
    plain_text_content TEXT,

    voice_note_url TEXT,
    voice_note_duration INTEGER,

    call_type TEXT,
    call_duration INTEGER,
    call_datetime TIMESTAMPTZ,
    noted_at TIMESTAMPTZ,

    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_backups_call_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their backups" ON public.user_backups_call_notes
    FOR ALL USING (auth.uid() = user_id);
```

### 4.4 events (Takvim Etkinlikleri)

**SQLite:**
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,

    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    google_event_id TEXT,
    calendar_id TEXT DEFAULT 'default',

    title TEXT NOT NULL,
    description TEXT,
    location TEXT,

    start_datetime TEXT NOT NULL,
    end_datetime TEXT NOT NULL,
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day INTEGER DEFAULT 0,

    is_recurring INTEGER DEFAULT 0,
    recurrence_rule TEXT,

    color TEXT DEFAULT '#4285F4',
    reminders TEXT,                         -- JSON
    attendees TEXT,                         -- JSON

    linked_contact_id TEXT,
    status TEXT DEFAULT 'confirmed',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_backup ON events(backup_status);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_events_calendar ON events(calendar_id);
```

**Supabase (Yedek):**
```sql
CREATE TABLE public.user_backups_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    location TEXT,

    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    timezone TEXT,
    is_all_day BOOLEAN,

    is_recurring BOOLEAN,
    recurrence_rule TEXT,
    color TEXT,
    reminders JSONB,

    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_backups_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their backups" ON public.user_backups_events
    FOR ALL USING (auth.uid() = user_id);
```

### 4.5 calendars

**SQLite:**
```sql
CREATE TABLE calendars (
    id TEXT PRIMARY KEY,
    google_calendar_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4285F4',
    is_visible INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    is_google_calendar INTEGER DEFAULT 0,
    sync_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 reminders (Hatırlatıcılar)

**SQLite:**
```sql
CREATE TABLE reminders (
    id TEXT PRIMARY KEY,

    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    title TEXT NOT NULL,
    description TEXT,

    due_datetime TEXT NOT NULL,
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day INTEGER DEFAULT 0,

    repeat_type TEXT DEFAULT 'none',
    repeat_interval INTEGER DEFAULT 1,
    repeat_days TEXT,                       -- JSON
    repeat_end_date TEXT,
    next_occurrence TEXT,

    notify_before TEXT,                     -- JSON array
    notification_sound TEXT,

    is_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    snoozed_until TEXT,

    linked_contact_id TEXT,
    linked_event_id TEXT,
    linked_note_id TEXT,

    priority TEXT DEFAULT 'medium',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_reminders_backup ON reminders(backup_status);
CREATE INDEX idx_reminders_due ON reminders(due_datetime);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);
```

**Supabase (Yedek):**
```sql
CREATE TABLE public.user_backups_reminders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    due_datetime TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN,

    repeat_type TEXT,
    repeat_interval INTEGER,
    repeat_days INTEGER[],

    is_completed BOOLEAN,
    completed_at TIMESTAMPTZ,
    priority TEXT,

    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_backups_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their backups" ON public.user_backups_reminders
    FOR ALL USING (auth.uid() = user_id);
```

### 4.7 note_categories

**SQLite:**
```sql
CREATE TABLE note_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Anlık Sync Tabloları (Supabase)

Bu tablolar her işlemde anında senkronize edilir.

### 5.1 profiles (Kullanıcı Profilleri)

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Temel Bilgiler
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,

    -- Premium
    is_premium BOOLEAN DEFAULT false,
    premium_plan TEXT,                      -- monthly, yearly, lifetime
    premium_started_at TIMESTAMPTZ,
    premium_expires_at TIMESTAMPTZ,

    -- Tercihler
    preferred_language TEXT DEFAULT 'tr',
    preferred_currency TEXT DEFAULT 'TRY',
    timezone TEXT DEFAULT 'Europe/Istanbul',

    -- İstatistikler
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);

-- Yeni kullanıcı için otomatik profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### 5.2 purchases (Satın Almalar)

```sql
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Ürün
    item_type TEXT NOT NULL,                -- theme, ringtone, premium
    item_id UUID,
    item_name TEXT,

    -- Fiyat
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',

    -- Ödeme
    payment_method TEXT,                    -- google_play, app_store
    transaction_id TEXT,
    receipt_data TEXT,

    -- Premium için
    premium_plan TEXT,
    premium_duration_days INTEGER,

    -- Durum
    status TEXT DEFAULT 'completed',        -- pending, completed, refunded

    -- Meta
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_item ON public.purchases(item_type, item_id);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
    ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert purchases"
    ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5.3 user_settings (Kullanıcı Ayarları)

```sql
-- Ayarlar da anlık sync olabilir (opsiyonel)
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    settings_json JSONB NOT NULL DEFAULT '{}',

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL USING (auth.uid() = user_id);
```

---

## 6. Mağaza Tabloları (Sadece Supabase)

### 6.1 theme_categories

```sql
CREATE TABLE public.theme_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_tr TEXT,
    name_en TEXT,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan kategoriler
INSERT INTO public.theme_categories (name, name_tr, name_en, slug, sort_order) VALUES
    ('Minimalist', 'Minimalist', 'Minimalist', 'minimalist', 1),
    ('Dark', 'Karanlık', 'Dark', 'dark', 2),
    ('Colorful', 'Renkli', 'Colorful', 'colorful', 3),
    ('Nature', 'Doğa', 'Nature', 'nature', 4),
    ('Neon', 'Neon', 'Neon', 'neon', 5);
```

### 6.2 store_themes

```sql
CREATE TABLE public.store_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,

    -- Bilgiler
    name TEXT NOT NULL,
    name_tr TEXT,
    name_en TEXT,
    description TEXT,

    -- Tür
    theme_type TEXT NOT NULL,               -- app, incoming_call, in_call, dialer
    category_id UUID REFERENCES public.theme_categories(id),

    -- Fiyat
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',

    -- İçerik
    config JSONB NOT NULL,
    preview_images TEXT[],
    thumbnail_url TEXT,

    -- Etiketler
    tags TEXT[],

    -- İstatistik
    download_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Durum
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_themes_category ON public.store_themes(category_id);
CREATE INDEX idx_store_themes_free ON public.store_themes(is_free);
CREATE INDEX idx_store_themes_approved ON public.store_themes(is_approved, is_active);

-- Herkes onaylı temaları görebilir
CREATE POLICY "Anyone can view approved themes"
    ON public.store_themes FOR SELECT
    USING (is_approved = true AND is_active = true);
```

### 6.3 ringtone_categories

```sql
CREATE TABLE public.ringtone_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_tr TEXT,
    name_en TEXT,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.ringtone_categories (name, name_tr, name_en, slug, sort_order) VALUES
    ('Classic', 'Klasik', 'Classic', 'classic', 1),
    ('Modern', 'Modern', 'Modern', 'modern', 2),
    ('Nature', 'Doğa', 'Nature', 'nature', 3),
    ('Music', 'Müzik', 'Music', 'music', 4);
```

### 6.4 store_ringtones

```sql
CREATE TABLE public.store_ringtones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    artist_name TEXT,

    -- Bilgiler
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.ringtone_categories(id),

    -- Dosya
    file_url TEXT NOT NULL,
    preview_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    format TEXT NOT NULL,

    -- Fiyat
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',

    -- Etiketler
    tags TEXT[],

    -- İstatistik
    download_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Durum
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_ringtones_category ON public.store_ringtones(category_id);
CREATE INDEX idx_store_ringtones_approved ON public.store_ringtones(is_approved, is_active);

CREATE POLICY "Anyone can view approved ringtones"
    ON public.store_ringtones FOR SELECT
    USING (is_approved = true AND is_active = true);
```

### 6.5 reviews

```sql
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    item_type TEXT NOT NULL,                -- theme, ringtone
    item_id UUID NOT NULL,

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,

    helpful_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_reviews_item ON public.reviews(item_type, item_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
    ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can manage own reviews"
    ON public.reviews FOR ALL USING (auth.uid() = user_id);
```

---

## 7. Storage Buckets

```sql
-- Tema görselleri
INSERT INTO storage.buckets (id, name, public) VALUES ('theme-assets', 'theme-assets', true);

-- Zil sesi dosyaları
INSERT INTO storage.buckets (id, name, public) VALUES ('ringtones', 'ringtones', true);

-- Kullanıcı yedekleri (sesli notlar vs.)
INSERT INTO storage.buckets (id, name, public) VALUES ('user-backups', 'user-backups', false);

-- Yedekleme bucket politikası
CREATE POLICY "Users can manage own backups"
    ON storage.objects FOR ALL
    USING (bucket_id = 'user-backups' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
```

---

## 8. Yedekleme Servisi

```typescript
// src/services/backupService.ts

interface BackupService {
  // Yedekleme başlat
  startBackup(): Promise<BackupResult>;

  // Yedekleme durumu
  getBackupStatus(): BackupStatus;

  // Geri yükleme
  restoreFromBackup(backupId: string): Promise<RestoreResult>;

  // Ayarlar
  updateBackupSettings(settings: BackupSettings): void;
}

interface BackupResult {
  success: boolean;
  backedUpAt: string;
  itemCounts: {
    notes: number;
    callLogs: number;
    callNotes: number;
    events: number;
    reminders: number;
  };
  totalSize: number;
  errors?: string[];
}
```

---

## 9. Özet

| Kategori | Tablo Sayısı | Açıklama |
|----------|--------------|----------|
| Sadece Yerel | 8 | contacts, phone_numbers, blocked_numbers, speed_dial, contact_groups, themes, ringtones, google_accounts |
| Günlük Yedekleme | 6 | notes, call_logs, call_notes, events, calendars, reminders |
| Anlık Sync | 3 | profiles, purchases, user_settings |
| Mağaza | 5 | theme_categories, store_themes, ringtone_categories, store_ringtones, reviews |

---

*Son Güncelleme: Ocak 2026*
*Versiyon: 2.0 (WhatsApp Yedekleme Modeli)*
