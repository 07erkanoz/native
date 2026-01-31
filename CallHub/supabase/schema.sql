-- =====================================================
-- LifeCall - Supabase PostgreSQL Şeması
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- =====================================================

-- =====================================================
-- 1. SPAM RAPORLARI TABLOSU
-- Kullanıcıların spam numara raporları
-- =====================================================
CREATE TABLE IF NOT EXISTS spam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Numara bilgileri
    phone_number TEXT NOT NULL,
    normalized_number TEXT NOT NULL,

    -- Rapor detayları
    category TEXT NOT NULL CHECK (category IN (
        'spam', 'scam', 'telemarketing', 'robocall',
        'fraud', 'survey', 'political', 'charity', 'other'
    )),
    description TEXT,
    caller_name TEXT,
    call_duration INTEGER,

    -- Raporlayan
    reported_by TEXT NOT NULL DEFAULT 'anonymous',
    device_id TEXT,

    -- Durum
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),

    -- Zaman damgaları
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_spam_reports_number ON spam_reports(normalized_number);
CREATE INDEX IF NOT EXISTS idx_spam_reports_status ON spam_reports(status);
CREATE INDEX IF NOT EXISTS idx_spam_reports_category ON spam_reports(category);
CREATE INDEX IF NOT EXISTS idx_spam_reports_reported_at ON spam_reports(reported_at DESC);

-- =====================================================
-- 2. SPAM NUMARALARI TABLOSU
-- Onaylanmış spam numaraları (toplu veri)
-- =====================================================
CREATE TABLE IF NOT EXISTS spam_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Numara bilgileri
    phone_number TEXT NOT NULL,
    normalized_number TEXT NOT NULL UNIQUE,
    country_code TEXT,

    -- Spam metrikleri
    spam_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    report_count INTEGER NOT NULL DEFAULT 1,

    -- Kategori ve detaylar
    category TEXT,
    caller_names TEXT[], -- Bilinen isimler dizisi

    -- Doğrulama
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by TEXT,

    -- Zaman damgaları
    first_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_spam_numbers_normalized ON spam_numbers(normalized_number);
CREATE INDEX IF NOT EXISTS idx_spam_numbers_score ON spam_numbers(spam_score DESC);
CREATE INDEX IF NOT EXISTS idx_spam_numbers_verified ON spam_numbers(is_verified);
CREATE INDEX IF NOT EXISTS idx_spam_numbers_country ON spam_numbers(country_code);

-- =====================================================
-- 3. KULLANICI YEDEKLEMELERİ TABLOSU (Opsiyonel)
-- Bulut yedekleme için
-- =====================================================
CREATE TABLE IF NOT EXISTS user_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Kullanıcı (anonim ID veya hesap)
    user_id TEXT NOT NULL,
    device_id TEXT,

    -- Yedekleme verisi
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'notes', 'calendar', 'settings')),
    backup_data JSONB NOT NULL,
    backup_size INTEGER,

    -- Şifreleme (client tarafında şifrelenmiş)
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    encryption_hint TEXT,

    -- Zaman damgaları
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_backups_user ON user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backups_type ON user_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_user_backups_created ON user_backups(created_at DESC);

-- Otomatik temizleme için (eski yedekleri sil)
CREATE INDEX IF NOT EXISTS idx_user_backups_expires ON user_backups(expires_at);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =====================================================

-- ========================
-- SPAM_REPORTS TABLOSU
-- Herkes okuyabilir ve rapor ekleyebilir (anonim dahil)
-- ========================
ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;

-- Okuma: Herkes (anon ve authenticated)
CREATE POLICY "spam_reports_select_policy"
    ON spam_reports
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Ekleme: Herkes rapor gönderebilir
CREATE POLICY "spam_reports_insert_policy"
    ON spam_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Güncelleme: Sadece service_role (admin)
-- (Varsayılan olarak izin yok, service_role RLS'i bypass eder)

-- Silme: Sadece service_role (admin)
-- (Varsayılan olarak izin yok)

-- ========================
-- SPAM_NUMBERS TABLOSU
-- Herkes okuyabilir, sadece trigger/admin yazabilir
-- ========================
ALTER TABLE spam_numbers ENABLE ROW LEVEL SECURITY;

-- Okuma: Herkes
CREATE POLICY "spam_numbers_select_policy"
    ON spam_numbers
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Ekleme/Güncelleme: Sadece trigger ve service_role
-- Trigger'lar SECURITY DEFINER olduğu için RLS'i bypass eder

-- ========================
-- USER_BACKUPS TABLOSU
-- Kullanıcılar sadece kendi verilerine erişebilir
-- Anonim kullanıcılar device_id ile tanımlanır
-- ========================
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- Okuma: Kendi device_id veya user_id ile eşleşen kayıtlar
CREATE POLICY "user_backups_select_policy"
    ON user_backups
    FOR SELECT
    TO anon, authenticated
    USING (
        -- Authenticated kullanıcı: JWT'deki user_id ile eşleşmeli
        (auth.role() = 'authenticated' AND user_id = auth.uid()::text)
        OR
        -- Anonim kullanıcı: device_id header'ı ile eşleşmeli
        (auth.role() = 'anon' AND device_id = current_setting('request.headers', true)::json->>'x-device-id')
    );

-- Ekleme: Kendi device_id veya user_id ile
CREATE POLICY "user_backups_insert_policy"
    ON user_backups
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- Authenticated: user_id zorunlu
        (auth.role() = 'authenticated' AND user_id = auth.uid()::text)
        OR
        -- Anonim: device_id zorunlu
        (auth.role() = 'anon' AND device_id IS NOT NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id')
    );

-- Güncelleme: Kendi yedeklerini güncelleyebilir
CREATE POLICY "user_backups_update_policy"
    ON user_backups
    FOR UPDATE
    TO anon, authenticated
    USING (
        (auth.role() = 'authenticated' AND user_id = auth.uid()::text)
        OR
        (auth.role() = 'anon' AND device_id = current_setting('request.headers', true)::json->>'x-device-id')
    )
    WITH CHECK (
        (auth.role() = 'authenticated' AND user_id = auth.uid()::text)
        OR
        (auth.role() = 'anon' AND device_id = current_setting('request.headers', true)::json->>'x-device-id')
    );

-- Silme: Kendi yedeklerini silebilir
CREATE POLICY "user_backups_delete_policy"
    ON user_backups
    FOR DELETE
    TO anon, authenticated
    USING (
        (auth.role() = 'authenticated' AND user_id = auth.uid()::text)
        OR
        (auth.role() = 'anon' AND device_id = current_setting('request.headers', true)::json->>'x-device-id')
    );

-- =====================================================
-- 5. FONKSİYONLAR
-- =====================================================

-- Spam raporu eklendiğinde spam_numbers tablosunu güncelle
CREATE OR REPLACE FUNCTION update_spam_number_on_report()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO spam_numbers (phone_number, normalized_number, category, report_count, first_reported_at, last_reported_at)
    VALUES (NEW.phone_number, NEW.normalized_number, NEW.category, 1, NOW(), NOW())
    ON CONFLICT (normalized_number) DO UPDATE SET
        report_count = spam_numbers.report_count + 1,
        last_reported_at = NOW(),
        spam_score = LEAST(100, spam_numbers.spam_score + 5),
        caller_names = CASE
            WHEN NEW.caller_name IS NOT NULL AND NOT (NEW.caller_name = ANY(spam_numbers.caller_names))
            THEN array_append(spam_numbers.caller_names, NEW.caller_name)
            ELSE spam_numbers.caller_names
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_spam_report_insert ON spam_reports;
CREATE TRIGGER on_spam_report_insert
    AFTER INSERT ON spam_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_spam_number_on_report();

-- Eski yedekleri temizle (cron job için)
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_backups WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ÖRNEK VERİLER (Test için - isteğe bağlı)
-- =====================================================

-- Test spam numaraları (Türkiye formatında sahte numaralar)
-- INSERT INTO spam_numbers (phone_number, normalized_number, country_code, spam_score, report_count, category, is_verified)
-- VALUES
--     ('0850 123 4567', '+908501234567', 'TR', 85, 150, 'telemarketing', true),
--     ('0212 999 8888', '+902129998888', 'TR', 70, 45, 'survey', true),
--     ('0532 000 0000', '+905320000000', 'TR', 95, 500, 'scam', true);

-- =====================================================
-- KURULUM TAMAMLANDI
-- =====================================================
-- Şimdi yapmanız gerekenler:
-- 1. Supabase Dashboard > Settings > API'den URL ve anon key'i alın
-- 2. GitHub Secrets'a ekleyin:
--    - SUPABASE_URL
--    - SUPABASE_ANON_KEY
-- 3. GitHub Actions'ı çalıştırın veya push yapın
-- =====================================================
