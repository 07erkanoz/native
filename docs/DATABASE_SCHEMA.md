# CallHub - Birleştirilmiş Veritabanı Şeması

Bu doküman SQLite (yerel) ve Supabase (bulut) veritabanı şemalarının birleştirilmiş ve senkronize edilmiş halini içerir.

---

## 1. Senkronizasyon Stratejisi

### 1.1 Temel Prensipler

```
┌─────────────────┐                    ┌─────────────────┐
│     SQLite      │◄───── Sync ──────►│    Supabase     │
│  (Yerel/Offline)│                    │  (Bulut/Online) │
└─────────────────┘                    └─────────────────┘
        │                                      │
        ▼                                      ▼
   - Hızlı erişim                      - Yedekleme
   - Offline çalışma                   - Cihazlar arası sync
   - Cihaz verileri                    - Mağaza verileri
```

### 1.2 Tablo Sınıflandırması

| Kategori | Tablolar | SQLite | Supabase | Sync Yönü |
|----------|----------|--------|----------|-----------|
| **Sadece Yerel** | call_logs, blocked_numbers, speed_dial | ✅ | ❌ | - |
| **Sadece Bulut** | store_themes, store_ringtones, purchases, reviews, theme_categories, ringtone_categories | ❌ | ✅ | - |
| **İki Yönlü Sync** | contacts, notes, events, calendars, reminders, call_notes, contact_groups, settings | ✅ | ✅ | ◄──► |
| **Buluttan İndirme** | themes (mağazadan), ringtones (mağazadan) | ✅ | ✅ | ◄── |

### 1.3 Sync Alanları (Tüm Sync Edilebilir Tablolarda)

```sql
-- SQLite tarafında eklenen sync alanları
user_id TEXT,                           -- Supabase user ID
sync_status TEXT DEFAULT 'pending',     -- pending, synced, modified, deleted, conflict
sync_version INTEGER DEFAULT 1,         -- Çakışma çözümü için
last_synced_at TEXT,                    -- Son sync zamanı
device_id TEXT,                         -- Hangi cihazdan değiştirildi
is_deleted INTEGER DEFAULT 0,           -- Soft delete (sync için)
server_id TEXT                          -- Supabase'deki karşılık ID
```

---

## 2. Ortak Veri Tipleri

### 2.1 UUID Standardı
- Tüm primary key'ler UUID formatında
- SQLite: TEXT olarak saklanır
- Supabase: UUID tipi kullanılır
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2.2 Tarih Formatı
- SQLite: ISO 8601 TEXT (`2026-01-31T14:30:00.000Z`)
- Supabase: TIMESTAMPTZ
- Her iki tarafta da UTC olarak saklanır

---

## 3. Senkronize Edilen Tablolar

### 3.1 contacts (Kişiler)

**SQLite Şeması:**
```sql
CREATE TABLE contacts (
    -- Birincil Anahtar
    id TEXT PRIMARY KEY,                    -- UUID
    server_id TEXT,                         -- Supabase'deki ID (eşleşme için)

    -- Sync Alanları
    user_id TEXT,                           -- Supabase user ID
    sync_status TEXT DEFAULT 'pending',     -- pending, synced, modified, deleted, conflict
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,
    device_id TEXT,
    is_deleted INTEGER DEFAULT 0,

    -- Cihaz Bağlantısı
    device_contact_id TEXT,                 -- Cihaz rehberi ID'si
    device_synced_at TEXT,                  -- Cihaz rehberi ile son sync

    -- Temel Bilgiler
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    company TEXT,
    job_title TEXT,

    -- Fotoğraf
    photo_uri TEXT,                         -- Yerel dosya yolu
    photo_url TEXT,                         -- Supabase storage URL
    photo_thumbnail TEXT,                   -- Base64 küçük resim
    use_device_photo INTEGER DEFAULT 1,

    -- Özelleştirme
    custom_ringtone_id TEXT,                -- ringtones tablosundan
    custom_ringtone_uri TEXT,               -- Yerel dosya yolu
    custom_notification_id TEXT,
    vibration_pattern TEXT,                 -- JSON
    led_color TEXT,

    -- Durum
    is_favorite INTEGER DEFAULT 0,
    favorite_order INTEGER,
    is_blocked INTEGER DEFAULT 0,

    -- Ek Bilgiler
    notes TEXT,
    birthday TEXT,                          -- YYYY-MM-DD
    anniversary TEXT,                       -- YYYY-MM-DD
    website TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_sync_status ON contacts(sync_status);
CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_device_id ON contacts(device_contact_id);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.contacts (
    -- Birincil Anahtar
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Kullanıcı
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sync
    sync_version INTEGER DEFAULT 1,
    device_id TEXT,

    -- Cihaz Bağlantısı
    device_contact_id TEXT,

    -- Temel Bilgiler
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    company TEXT,
    job_title TEXT,

    -- Fotoğraf
    photo_url TEXT,                         -- Storage URL
    photo_thumbnail TEXT,
    use_device_photo BOOLEAN DEFAULT true,

    -- Özelleştirme
    custom_ringtone_id UUID,
    vibration_pattern JSONB,
    led_color TEXT,

    -- Durum
    is_favorite BOOLEAN DEFAULT false,
    favorite_order INTEGER,
    is_blocked BOOLEAN DEFAULT false,

    -- Ek Bilgiler
    notes TEXT,
    birthday DATE,
    anniversary DATE,
    website TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ                  -- Soft delete
);

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_display_name ON public.contacts(display_name);
CREATE INDEX idx_contacts_favorite ON public.contacts(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_contacts_deleted ON public.contacts(deleted_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
    ON public.contacts FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.2 phone_numbers (Telefon Numaraları)

**SQLite Şeması:**
```sql
CREATE TABLE phone_numbers (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    contact_id TEXT NOT NULL,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Veri
    number TEXT NOT NULL,
    formatted_number TEXT,
    country_code TEXT,
    label TEXT DEFAULT 'mobile',            -- mobile, home, work, main, other
    is_primary INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_phone_numbers_contact ON phone_numbers(contact_id);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

    -- Veri
    number TEXT NOT NULL,
    formatted_number TEXT,
    country_code TEXT,
    label TEXT DEFAULT 'mobile',
    is_primary BOOLEAN DEFAULT false,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_phone_numbers_contact ON public.phone_numbers(contact_id);
CREATE INDEX idx_phone_numbers_number ON public.phone_numbers(number);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phone numbers"
    ON public.phone_numbers FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.3 email_addresses (E-posta Adresleri)

**SQLite Şeması:**
```sql
CREATE TABLE email_addresses (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    contact_id TEXT NOT NULL,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Veri
    email TEXT NOT NULL,
    label TEXT DEFAULT 'personal',          -- personal, work, other
    is_primary INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.email_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    label TEXT DEFAULT 'personal',
    is_primary BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.email_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own emails"
    ON public.email_addresses FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.4 addresses (Adresler)

**SQLite Şeması:**
```sql
CREATE TABLE addresses (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    contact_id TEXT NOT NULL,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Veri
    street TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    label TEXT DEFAULT 'home',              -- home, work, other
    formatted_address TEXT,
    latitude REAL,
    longitude REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

    street TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    label TEXT DEFAULT 'home',
    formatted_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
    ON public.addresses FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.5 notes (Notlar)

**SQLite Şeması:**
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,
    device_id TEXT,
    is_deleted INTEGER DEFAULT 0,

    -- Temel Bilgiler
    title TEXT,
    content TEXT NOT NULL,                  -- JSON (Rich Text - Quill Delta format)
    plain_text_content TEXT,                -- Arama için düz metin
    note_type TEXT DEFAULT 'text',          -- text, voice, checklist, call

    -- Organizasyon
    color TEXT DEFAULT '#FFFFFF',
    category_id TEXT,
    tags TEXT,                              -- JSON array
    is_pinned INTEGER DEFAULT 0,

    -- Sesli Not
    voice_note_path TEXT,                   -- Yerel dosya
    voice_note_url TEXT,                    -- Supabase storage
    voice_note_duration INTEGER,            -- Saniye
    voice_note_waveform TEXT,               -- JSON array

    -- Görseller
    images TEXT,                            -- JSON array [{path, url, caption}]

    -- İlişkiler
    linked_contact_id TEXT,
    linked_event_id TEXT,
    linked_call_id TEXT,                    -- Arama notu için

    -- Hatırlatıcı
    reminder_at TEXT,
    reminder_notified INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES note_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_sync ON notes(sync_status);
CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_pinned ON notes(is_pinned);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_category ON notes(category_id);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sync
    sync_version INTEGER DEFAULT 1,
    device_id TEXT,

    -- Temel Bilgiler
    title TEXT,
    content JSONB NOT NULL,                 -- Rich Text (Quill Delta)
    plain_text_content TEXT,
    note_type TEXT DEFAULT 'text',

    -- Organizasyon
    color TEXT DEFAULT '#FFFFFF',
    category_id UUID REFERENCES public.note_categories(id) ON DELETE SET NULL,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,

    -- Sesli Not
    voice_note_url TEXT,                    -- Storage URL
    voice_note_duration INTEGER,
    voice_note_waveform JSONB,

    -- Görseller
    images JSONB,                           -- [{url, caption}]

    -- İlişkiler
    linked_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    linked_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    linked_call_id TEXT,                    -- Yerel call_log referansı

    -- Hatırlatıcı
    reminder_at TIMESTAMPTZ,
    reminder_notified BOOLEAN DEFAULT false,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notes_user ON public.notes(user_id);
CREATE INDEX idx_notes_type ON public.notes(note_type);
CREATE INDEX idx_notes_pinned ON public.notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_updated ON public.notes(updated_at DESC);
CREATE INDEX idx_notes_search ON public.notes
    USING GIN(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(plain_text_content, '')));

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
    ON public.notes FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.6 note_categories (Not Kategorileri)

**SQLite Şeması:**
```sql
CREATE TABLE note_categories (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Veri
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.note_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own note categories"
    ON public.note_categories FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.7 events (Takvim Etkinlikleri)

**SQLite Şeması:**
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,
    device_id TEXT,
    is_deleted INTEGER DEFAULT 0,

    -- Dış Bağlantılar
    google_event_id TEXT,                   -- Google Calendar sync
    calendar_id TEXT DEFAULT 'default',

    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    location_latitude REAL,
    location_longitude REAL,

    -- Zaman
    start_datetime TEXT NOT NULL,           -- ISO 8601
    end_datetime TEXT NOT NULL,
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day INTEGER DEFAULT 0,

    -- Tekrar
    is_recurring INTEGER DEFAULT 0,
    recurrence_rule TEXT,                   -- RRULE format (RFC 5545)
    recurrence_exception_dates TEXT,        -- JSON array of excluded dates
    recurring_event_id TEXT,                -- Parent event ID for instances

    -- Görünüm
    color TEXT DEFAULT '#4285F4',

    -- Bildirim
    reminders TEXT,                         -- JSON array: [{minutes: 15}, {minutes: 60}]

    -- Katılımcılar
    attendees TEXT,                         -- JSON array [{email, name, status}]
    organizer_email TEXT,

    -- İlişkiler
    linked_contact_id TEXT,

    -- Durum
    status TEXT DEFAULT 'confirmed',        -- confirmed, tentative, cancelled
    visibility TEXT DEFAULT 'default',      -- default, public, private

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_sync ON events(sync_status);
CREATE INDEX idx_events_calendar ON events(calendar_id);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_events_google ON events(google_event_id);
CREATE INDEX idx_events_recurring ON events(recurring_event_id);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sync
    sync_version INTEGER DEFAULT 1,
    device_id TEXT,

    -- Dış Bağlantılar
    google_event_id TEXT,
    calendar_id UUID REFERENCES public.calendars(id) ON DELETE CASCADE,

    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    location_coords GEOGRAPHY(POINT, 4326),

    -- Zaman
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day BOOLEAN DEFAULT false,

    -- Tekrar
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    recurrence_exception_dates TIMESTAMPTZ[],
    recurring_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,

    -- Görünüm
    color TEXT DEFAULT '#4285F4',

    -- Bildirim
    reminders JSONB,

    -- Katılımcılar
    attendees JSONB,
    organizer_email TEXT,

    -- İlişkiler
    linked_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,

    -- Durum
    status TEXT DEFAULT 'confirmed',
    visibility TEXT DEFAULT 'default',

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_events_user ON public.events(user_id);
CREATE INDEX idx_events_calendar ON public.events(calendar_id);
CREATE INDEX idx_events_start ON public.events(start_datetime);
CREATE INDEX idx_events_google ON public.events(google_event_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events"
    ON public.events FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.8 calendars (Takvimler)

**SQLite Şeması:**
```sql
CREATE TABLE calendars (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Dış Bağlantı
    google_calendar_id TEXT,

    -- Temel Bilgiler
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4285F4',

    -- Ayarlar
    is_visible INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    is_google_calendar INTEGER DEFAULT 0,
    is_readonly INTEGER DEFAULT 0,
    sync_enabled INTEGER DEFAULT 1,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    google_calendar_id TEXT,

    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4285F4',

    is_visible BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_google_calendar BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendars"
    ON public.calendars FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.9 reminders (Hatırlatıcılar)

**SQLite Şeması:**
```sql
CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,
    device_id TEXT,
    is_deleted INTEGER DEFAULT 0,

    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,

    -- Zamanlama
    due_datetime TEXT NOT NULL,             -- ISO 8601
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day INTEGER DEFAULT 0,

    -- Tekrar
    repeat_type TEXT DEFAULT 'none',        -- none, daily, weekly, monthly, yearly, custom
    repeat_interval INTEGER DEFAULT 1,       -- Her X günde/haftada/ayda
    repeat_days TEXT,                       -- JSON: [1,3,5] (Pazartesi, Çarşamba, Cuma)
    repeat_end_date TEXT,
    repeat_count INTEGER,                   -- Kaç kez tekrar
    next_occurrence TEXT,                   -- Sonraki hatırlatma zamanı

    -- Bildirim
    notify_before TEXT,                     -- JSON array: [0, 15, 60] dakika önce
    notification_sound TEXT,

    -- Durum
    is_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    snoozed_until TEXT,
    snooze_count INTEGER DEFAULT 0,

    -- İlişkiler
    linked_contact_id TEXT,
    linked_event_id TEXT,
    linked_note_id TEXT,

    -- Öncelik
    priority TEXT DEFAULT 'medium',         -- low, medium, high, urgent

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_sync ON reminders(sync_status);
CREATE INDEX idx_reminders_due ON reminders(due_datetime);
CREATE INDEX idx_reminders_next ON reminders(next_occurrence);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);
CREATE INDEX idx_reminders_priority ON reminders(priority);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sync
    sync_version INTEGER DEFAULT 1,
    device_id TEXT,

    -- Temel Bilgiler
    title TEXT NOT NULL,
    description TEXT,

    -- Zamanlama
    due_datetime TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_all_day BOOLEAN DEFAULT false,

    -- Tekrar
    repeat_type TEXT DEFAULT 'none',
    repeat_interval INTEGER DEFAULT 1,
    repeat_days INTEGER[],
    repeat_end_date DATE,
    repeat_count INTEGER,
    next_occurrence TIMESTAMPTZ,

    -- Bildirim
    notify_before INTEGER[],                -- Dakika olarak
    notification_sound TEXT,

    -- Durum
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    snooze_count INTEGER DEFAULT 0,

    -- İlişkiler
    linked_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    linked_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    linked_note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,

    -- Öncelik
    priority TEXT DEFAULT 'medium',

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reminders_user ON public.reminders(user_id);
CREATE INDEX idx_reminders_due ON public.reminders(due_datetime);
CREATE INDEX idx_reminders_completed ON public.reminders(is_completed) WHERE is_completed = false;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
    ON public.reminders FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.10 call_notes (Arama Notları)

**SQLite Şeması:**
```sql
CREATE TABLE call_notes (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,
    is_deleted INTEGER DEFAULT 0,

    -- Arama Bağlantısı
    call_log_id TEXT NOT NULL,              -- Yerel call_logs referansı
    contact_id TEXT,
    phone_number TEXT,                      -- Arama numarası
    contact_name TEXT,                      -- O anki kişi adı

    -- Not İçeriği
    content TEXT,                           -- JSON (Rich Text)
    plain_text_content TEXT,                -- Arama için düz metin

    -- Sesli Not
    voice_note_path TEXT,                   -- Yerel dosya
    voice_note_url TEXT,                    -- Supabase storage
    voice_note_duration INTEGER,
    voice_note_waveform TEXT,               -- JSON array

    -- Arama Detayları
    call_type TEXT,                         -- incoming, outgoing, missed
    call_duration INTEGER,                  -- Arama süresi (saniye)
    call_datetime TEXT,                     -- Arama zamanı
    noted_at TEXT NOT NULL,                 -- Not alınma zamanı

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (call_log_id) REFERENCES call_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_call_notes_user ON call_notes(user_id);
CREATE INDEX idx_call_notes_sync ON call_notes(sync_status);
CREATE INDEX idx_call_notes_call ON call_notes(call_log_id);
CREATE INDEX idx_call_notes_contact ON call_notes(contact_id);
CREATE INDEX idx_call_notes_datetime ON call_notes(call_datetime DESC);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.call_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sync
    sync_version INTEGER DEFAULT 1,

    -- Arama Referansı (yerel ID saklanır, call_logs sync edilmez)
    local_call_log_id TEXT,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    phone_number TEXT,
    contact_name TEXT,

    -- Not İçeriği
    content JSONB,
    plain_text_content TEXT,

    -- Sesli Not
    voice_note_url TEXT,
    voice_note_duration INTEGER,
    voice_note_waveform JSONB,

    -- Arama Detayları
    call_type TEXT,
    call_duration INTEGER,
    call_datetime TIMESTAMPTZ,
    noted_at TIMESTAMPTZ NOT NULL,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_call_notes_user ON public.call_notes(user_id);
CREATE INDEX idx_call_notes_contact ON public.call_notes(contact_id);
CREATE INDEX idx_call_notes_datetime ON public.call_notes(call_datetime DESC);
CREATE INDEX idx_call_notes_search ON public.call_notes
    USING GIN(to_tsvector('simple', coalesce(plain_text_content, '')));

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own call notes"
    ON public.call_notes FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.11 contact_groups (Kişi Grupları)

**SQLite Şeması:**
```sql
CREATE TABLE contact_groups (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- Veri
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,

    -- Grup Özelleştirme
    group_ringtone_id TEXT,
    group_ringtone_uri TEXT,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_groups_user ON contact_groups(user_id);
CREATE INDEX idx_contact_groups_sync ON contact_groups(sync_status);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.contact_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,

    group_ringtone_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own groups"
    ON public.contact_groups FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.12 contact_group_members (Grup Üyeleri)

**SQLite Şeması:**
```sql
CREATE TABLE contact_group_members (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,

    -- İlişki
    group_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,

    added_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    UNIQUE(group_id, contact_id)
);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.contact_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

    added_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    UNIQUE(group_id, contact_id)
);

ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own group members"
    ON public.contact_group_members FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.13 user_settings (Kullanıcı Ayarları)

**SQLite Şeması:**
```sql
CREATE TABLE user_settings (
    id TEXT PRIMARY KEY,
    server_id TEXT,

    -- Sync
    user_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TEXT,

    -- Ayar
    category TEXT NOT NULL,                 -- general, display, calls, notifications, privacy, sync
    key TEXT NOT NULL,
    value TEXT NOT NULL,                    -- JSON encoded

    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, category, key)
);

CREATE INDEX idx_settings_user ON user_settings(user_id);
CREATE INDEX idx_settings_category ON user_settings(category);
```

**Supabase Şeması:**
```sql
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    sync_version INTEGER DEFAULT 1,

    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, category, key)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id);
```

---

## 4. Sadece Yerel Tablolar (Sync Edilmez)

Bu tablolar cihaz-spesifik verileri tutar ve sunucuya sync edilmez.

### 4.1 call_logs (Arama Geçmişi)

```sql
CREATE TABLE call_logs (
    id TEXT PRIMARY KEY,

    -- Kişi Referansı
    contact_id TEXT,
    phone_number TEXT NOT NULL,
    formatted_number TEXT,
    contact_name TEXT,
    contact_photo TEXT,

    -- Arama Detayları
    call_type TEXT NOT NULL,                -- incoming, outgoing, missed, rejected, blocked
    call_category TEXT DEFAULT 'voice',     -- voice, video
    duration INTEGER DEFAULT 0,             -- Saniye

    -- Zaman
    call_datetime TEXT NOT NULL,            -- ISO 8601
    call_timestamp INTEGER NOT NULL,        -- Unix timestamp (hızlı sıralama)

    -- Ek Bilgiler
    is_read INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 1,
    sim_slot INTEGER,
    geocoded_location TEXT,
    network_type TEXT,                      -- wifi, 4g, 5g

    -- İlişki
    has_note INTEGER DEFAULT 0,

    -- Meta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_call_logs_timestamp ON call_logs(call_timestamp DESC);
CREATE INDEX idx_call_logs_contact ON call_logs(contact_id);
CREATE INDEX idx_call_logs_number ON call_logs(phone_number);
CREATE INDEX idx_call_logs_type ON call_logs(call_type);
CREATE INDEX idx_call_logs_new ON call_logs(is_new) WHERE is_new = 1;
```

### 4.2 blocked_numbers (Engelli Numaralar)

```sql
CREATE TABLE blocked_numbers (
    id TEXT PRIMARY KEY,

    phone_number TEXT NOT NULL UNIQUE,
    contact_id TEXT,
    contact_name TEXT,

    reason TEXT,                            -- spam, unwanted, private
    block_calls INTEGER DEFAULT 1,
    block_messages INTEGER DEFAULT 1,

    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_blocked_number ON blocked_numbers(phone_number);
```

### 4.3 speed_dial (Hızlı Arama)

```sql
CREATE TABLE speed_dial (
    position INTEGER PRIMARY KEY CHECK (position >= 1 AND position <= 9),

    contact_id TEXT,
    phone_number TEXT,
    contact_name TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

### 4.4 google_accounts (Google Hesapları)

```sql
CREATE TABLE google_accounts (
    id TEXT PRIMARY KEY,

    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,

    -- Tokens (encrypted)
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
```

### 4.5 themes (İndirilen Temalar - Yerel)

```sql
CREATE TABLE themes (
    id TEXT PRIMARY KEY,

    -- Mağaza Referansı
    store_theme_id TEXT,                    -- Mağazadan indirildiyse

    -- Temel
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,                     -- app, incoming_voice, outgoing_voice, etc.

    -- Durum
    is_system INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0,

    -- İçerik
    config TEXT NOT NULL,                   -- JSON tema konfigürasyonu
    preview_image_path TEXT,

    -- Özelleştirme
    custom_config TEXT,                     -- Kullanıcı değişiklikleri

    -- Meta
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_themes_type ON themes(type);
CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = 1;
CREATE INDEX idx_themes_store ON themes(store_theme_id);
```

### 4.6 ringtones (İndirilen Zil Sesleri - Yerel)

```sql
CREATE TABLE ringtones (
    id TEXT PRIMARY KEY,

    -- Mağaza Referansı
    store_ringtone_id TEXT,

    -- Temel
    name TEXT NOT NULL,
    artist_name TEXT,

    -- Dosya
    file_path TEXT NOT NULL,
    duration INTEGER,
    file_size INTEGER,
    format TEXT,

    -- Kategori
    category TEXT,
    is_custom INTEGER DEFAULT 0,            -- Kullanıcı yükledi mi

    -- Varsayılan
    is_default_ringtone INTEGER DEFAULT 0,
    is_default_notification INTEGER DEFAULT 0,

    -- Meta
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ringtones_store ON ringtones(store_ringtone_id);
CREATE INDEX idx_ringtones_default ON ringtones(is_default_ringtone);
```

---

## 5. Sadece Bulut Tabloları

Bu tablolar mağaza ve platform verilerini tutar. Ayrıntılı şema için `SUPABASE_SCHEMA.md` dosyasına bakın.

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri |
| `theme_categories` | Tema kategorileri |
| `store_themes` | Tema mağazası |
| `ringtone_categories` | Zil sesi kategorileri |
| `store_ringtones` | Zil sesi mağazası |
| `purchases` | Satın almalar |
| `reviews` | Değerlendirmeler |

---

## 6. Senkronizasyon İşlemleri

### 6.1 Sync Durumları

```typescript
enum SyncStatus {
  PENDING = 'pending',       // Yeni oluşturuldu, henüz sync edilmedi
  SYNCED = 'synced',         // Sunucu ile senkronize
  MODIFIED = 'modified',     // Yerel değişiklik var, sync bekliyor
  DELETED = 'deleted',       // Silinmek üzere işaretlendi
  CONFLICT = 'conflict'      // Çakışma var, çözüm bekliyor
}
```

### 6.2 Çakışma Çözümü

```typescript
interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'newest_wins' | 'manual';

  // newest_wins için
  compareField: 'updated_at' | 'sync_version';
}

// Varsayılan strateji: newest_wins (updated_at karşılaştırması)
```

### 6.3 Sync Akışı

```
┌──────────────┐     Push      ┌──────────────┐
│    SQLite    │ ────────────► │   Supabase   │
│   (Local)    │               │   (Cloud)    │
│              │ ◄──────────── │              │
└──────────────┘     Pull      └──────────────┘

1. PUSH: sync_status = 'modified' veya 'pending' olan kayıtları gönder
2. PULL: last_synced_at'ten sonra değişen kayıtları al
3. MERGE: Çakışmaları çöz
4. UPDATE: sync_status = 'synced', last_synced_at = now() yap
```

### 6.4 TypeScript Sync Interface

```typescript
interface SyncableEntity {
  id: string;
  server_id?: string;
  user_id?: string;
  sync_status: SyncStatus;
  sync_version: number;
  last_synced_at?: string;
  device_id?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncOperation<T extends SyncableEntity> {
  table: string;
  action: 'create' | 'update' | 'delete';
  local_record: T;
  server_record?: T;
  resolved_record?: T;
  conflict?: boolean;
}
```

---

## 7. Migrasyon Rehberi

### 7.1 SQLite Migrasyon Örneği

```typescript
// src/database/migrations/001_add_sync_fields.ts

export const up = async (db: SQLiteDatabase) => {
  // contacts tablosuna sync alanları ekle
  await db.executeSql(`
    ALTER TABLE contacts ADD COLUMN server_id TEXT;
    ALTER TABLE contacts ADD COLUMN user_id TEXT;
    ALTER TABLE contacts ADD COLUMN sync_status TEXT DEFAULT 'pending';
    ALTER TABLE contacts ADD COLUMN sync_version INTEGER DEFAULT 1;
    ALTER TABLE contacts ADD COLUMN last_synced_at TEXT;
    ALTER TABLE contacts ADD COLUMN device_id TEXT;
    ALTER TABLE contacts ADD COLUMN is_deleted INTEGER DEFAULT 0;
  `);

  // Index ekle
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_contacts_sync ON contacts(sync_status);
    CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
  `);
};

export const down = async (db: SQLiteDatabase) => {
  // SQLite ALTER TABLE DROP COLUMN desteklemez
  // Yeni tablo oluştur, veriyi taşı, eski tabloyu sil
};
```

### 7.2 Supabase Migrasyon

```sql
-- supabase/migrations/20260131_create_sync_tables.sql

-- Contacts tablosu oluştur
CREATE TABLE IF NOT EXISTS public.contacts (
    -- ... şema yukarıdaki gibi
);

-- RLS etkinleştir
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Users can manage own contacts"
    ON public.contacts FOR ALL
    USING (auth.uid() = user_id);
```

---

## 8. Veri Tipi Eşleştirmeleri

| SQLite | PostgreSQL (Supabase) | TypeScript |
|--------|----------------------|------------|
| TEXT | TEXT | string |
| TEXT (UUID) | UUID | string |
| INTEGER | INTEGER | number |
| REAL | DECIMAL / REAL | number |
| TEXT (ISO 8601) | TIMESTAMPTZ | Date / string |
| TEXT (JSON) | JSONB | object / array |
| INTEGER (0/1) | BOOLEAN | boolean |
| TEXT[] (JSON) | TEXT[] | string[] |

---

*Son Güncelleme: Ocak 2026*
*Versiyon: 1.0*
