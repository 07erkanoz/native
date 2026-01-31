/**
 * LifeCall - SQLite Veritabanı Şeması
 *
 * DATABASE_SCHEMA.md dokümantasyonuyla uyumlu
 * Tablo kategorileri:
 * - Sadece Yerel: contacts, phone_numbers, blocked_numbers, speed_dial, contact_groups, themes, ringtones, google_accounts
 * - Günlük Yedekleme: notes, call_logs, call_notes, events, calendars, reminders
 */

// Veritabanı versiyonu
export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'lifecall.db';

/**
 * Tablo oluşturma SQL'leri
 */
export const CREATE_TABLES_SQL = `
-- =====================================================
-- SADECE YEREL TABLOLAR (Yedeklenmez)
-- =====================================================

-- 3.1 contacts (Kişiler)
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    device_contact_id TEXT,
    device_synced_at TEXT,

    -- Temel Bilgiler
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    company TEXT,
    job_title TEXT,

    -- Fotoğraf
    photo_uri TEXT,
    photo_thumbnail TEXT,

    -- Özelleştirme (yerel)
    custom_ringtone_id TEXT,
    custom_ringtone_uri TEXT,
    vibration_pattern TEXT,
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

CREATE INDEX IF NOT EXISTS idx_contacts_display_name ON contacts(display_name);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_contacts_device_id ON contacts(device_contact_id);

-- 3.2 phone_numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    number TEXT NOT NULL,
    formatted_number TEXT,
    country_code TEXT,
    label TEXT DEFAULT 'mobile',
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_contact ON phone_numbers(contact_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(number);

-- 3.3 email_addresses
CREATE TABLE IF NOT EXISTS email_addresses (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    email TEXT NOT NULL,
    label TEXT DEFAULT 'personal',
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_addresses_contact ON email_addresses(contact_id);

-- 3.4 blocked_numbers
CREATE TABLE IF NOT EXISTS blocked_numbers (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    contact_id TEXT,
    contact_name TEXT,
    reason TEXT,
    block_calls INTEGER DEFAULT 1,
    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- 3.5 speed_dial
CREATE TABLE IF NOT EXISTS speed_dial (
    position INTEGER PRIMARY KEY CHECK (position >= 1 AND position <= 9),
    contact_id TEXT,
    phone_number TEXT,
    contact_name TEXT,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- 3.6 contact_groups
CREATE TABLE IF NOT EXISTS contact_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    group_ringtone_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_group_members (
    group_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    PRIMARY KEY (group_id, contact_id),
    FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- 3.7 themes (İndirilen)
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    store_theme_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0,
    config TEXT NOT NULL,
    preview_image_path TEXT,
    downloaded_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_themes_type ON themes(type);
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active);

-- 3.8 ringtones (İndirilen)
CREATE TABLE IF NOT EXISTS ringtones (
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

-- 3.9 google_accounts
CREATE TABLE IF NOT EXISTS google_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TEXT,
    calendar_sync_enabled INTEGER DEFAULT 1,
    last_synced_at TEXT,
    connected_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GÜNLÜK YEDEKLEME TABLOLARI (Supabase'e yedeklenir)
-- =====================================================

-- 4.1 notes (Notlar)
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,

    -- Yedekleme
    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    -- İçerik
    title TEXT,
    content TEXT NOT NULL,
    plain_text_content TEXT,
    note_type TEXT DEFAULT 'text',

    -- Organizasyon
    color TEXT DEFAULT '#FFFFFF',
    category_id TEXT,
    tags TEXT,
    is_pinned INTEGER DEFAULT 0,

    -- Sesli Not
    voice_note_path TEXT,
    voice_note_duration INTEGER,
    voice_note_waveform TEXT,

    -- Görseller
    images TEXT,

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

CREATE INDEX IF NOT EXISTS idx_notes_backup ON notes(backup_status);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

-- 4.2 call_logs (Arama Geçmişi)
CREATE TABLE IF NOT EXISTS call_logs (
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
    call_type TEXT NOT NULL,
    call_category TEXT DEFAULT 'voice',
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

CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON call_logs(call_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_backup ON call_logs(backup_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_type ON call_logs(call_type);

-- 4.3 call_notes (Arama Notları)
CREATE TABLE IF NOT EXISTS call_notes (
    id TEXT PRIMARY KEY,

    backup_status TEXT DEFAULT 'pending',
    last_backup_at TEXT,

    call_log_id TEXT NOT NULL,
    contact_id TEXT,
    phone_number TEXT,
    contact_name TEXT,

    content TEXT,
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

CREATE INDEX IF NOT EXISTS idx_call_notes_backup ON call_notes(backup_status);
CREATE INDEX IF NOT EXISTS idx_call_notes_call ON call_notes(call_log_id);

-- 4.4 calendars
CREATE TABLE IF NOT EXISTS calendars (
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

-- 4.5 events (Takvim Etkinlikleri)
CREATE TABLE IF NOT EXISTS events (
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
    reminders TEXT,
    attendees TEXT,

    linked_contact_id TEXT,
    status TEXT DEFAULT 'confirmed',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_backup ON events(backup_status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendar_id);

-- 4.6 reminders (Hatırlatıcılar)
CREATE TABLE IF NOT EXISTS reminders (
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
    repeat_days TEXT,
    repeat_end_date TEXT,
    next_occurrence TEXT,

    notify_before TEXT,
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

CREATE INDEX IF NOT EXISTS idx_reminders_backup ON reminders(backup_status);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_datetime);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);

-- 4.7 note_categories
CREATE TABLE IF NOT EXISTS note_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FAVORİLER TABLOSU (Yerel)
-- =====================================================

CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    photo_uri TEXT,
    phone_number TEXT,
    sort_order INTEGER DEFAULT 0,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_order ON favorites(sort_order);

-- =====================================================
-- AYARLAR TABLOSU (Yerel)
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VERSİYON BİLGİSİ
-- =====================================================

CREATE TABLE IF NOT EXISTS db_version (
    version INTEGER PRIMARY KEY,
    migrated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan takvim oluştur
INSERT OR IGNORE INTO calendars (id, name, is_default) VALUES ('default', 'Varsayılan', 1);

-- Veritabanı versiyonunu kaydet
INSERT OR IGNORE INTO db_version (version) VALUES (1);
`;

/**
 * Tablo silme SQL'leri (geliştirme amaçlı)
 */
export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS contact_group_members;
DROP TABLE IF EXISTS contact_groups;
DROP TABLE IF EXISTS call_notes;
DROP TABLE IF EXISTS call_logs;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS calendars;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS note_categories;
DROP TABLE IF EXISTS speed_dial;
DROP TABLE IF EXISTS blocked_numbers;
DROP TABLE IF EXISTS email_addresses;
DROP TABLE IF EXISTS phone_numbers;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS ringtones;
DROP TABLE IF EXISTS google_accounts;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS db_version;
`;

/**
 * Varsayılan temalar
 */
export const INSERT_DEFAULT_THEMES_SQL = `
INSERT OR IGNORE INTO themes (id, name, type, is_system, is_active, config)
VALUES
  ('theme_light', 'Light', 'app', 1, 1, '{"mode":"light"}'),
  ('theme_dark', 'Dark', 'app', 1, 0, '{"mode":"dark"}'),
  ('theme_system', 'System', 'app', 1, 0, '{"mode":"system"}');
`;
