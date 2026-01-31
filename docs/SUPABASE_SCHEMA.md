# CallHub - Supabase Veritabanı Şeması

Bu doküman, CallHub uygulamasının Supabase bulut veritabanı şemasını detaylı olarak açıklar.

---

## 1. Genel Bakış

### Supabase Özellikleri
- **Authentication**: E-posta, Google OAuth ile kullanıcı girişi
- **Database**: PostgreSQL veritabanı
- **Storage**: Tema görselleri, zil sesi dosyaları
- **Realtime**: Canlı senkronizasyon (gelecekte)
- **Edge Functions**: Ödeme işlemleri, bildirimler

### Tablo Listesi

| Tablo | Açıklama | RLS |
|-------|----------|-----|
| `profiles` | Kullanıcı profilleri | ✅ |
| `store_themes` | Tema mağazası | ✅ |
| `store_ringtones` | Zil sesi mağazası | ✅ |
| `purchases` | Satın almalar | ✅ |
| `reviews` | Değerlendirmeler | ✅ |
| `user_sync_data` | Kullanıcı verileri sync | ✅ |
| `user_favorites` | Favori kişiler sync | ✅ |
| `user_blocked` | Engelli numaralar sync | ✅ |
| `user_settings` | Ayarlar sync | ✅ |
| `theme_categories` | Tema kategorileri | ❌ |
| `ringtone_categories` | Zil sesi kategorileri | ❌ |

---

## 2. Kimlik Doğrulama (Authentication)

### Supabase Auth Ayarları

```sql
-- Supabase Auth otomatik olarak auth.users tablosunu yönetir
-- Biz sadece profiles tablosu ile genişletiyoruz
```

### Auth Providers
- **Email/Password**: Varsayılan
- **Google OAuth**: Google ile giriş
- **Apple Sign In**: iOS için (gelecekte)

---

## 3. Tablo Şemaları

### 3.1 profiles (Kullanıcı Profilleri)

```sql
-- =============================================
-- KULLANICI PROFİLLERİ
-- =============================================
CREATE TABLE public.profiles (
    -- Birincil Anahtar (Auth ile bağlantılı)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Temel Bilgiler
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,

    -- Premium Üyelik
    is_premium BOOLEAN DEFAULT false,
    premium_plan TEXT CHECK (premium_plan IN ('monthly', 'yearly', 'lifetime')),
    premium_started_at TIMESTAMPTZ,
    premium_expires_at TIMESTAMPTZ,

    -- Tercihler
    preferred_language TEXT DEFAULT 'tr',
    preferred_currency TEXT DEFAULT 'TRY',
    timezone TEXT DEFAULT 'Europe/Istanbul',

    -- İstatistikler
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,

    -- Durum
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ
);

-- İndeksler
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_premium ON public.profiles(is_premium);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Yeni kullanıcı kayıt olduğunda otomatik profil oluştur
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
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### 3.2 theme_categories (Tema Kategorileri)

```sql
-- =============================================
-- TEMA KATEGORİLERİ
-- =============================================
CREATE TABLE public.theme_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Temel
    name TEXT NOT NULL,
    name_tr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Görsel
    icon TEXT,
    color TEXT,
    cover_image_url TEXT,

    -- Sıralama
    sort_order INTEGER DEFAULT 0,

    -- Durum
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan kategoriler
INSERT INTO public.theme_categories (name, name_tr, name_en, slug, sort_order) VALUES
    ('Minimalist', 'Minimalist', 'Minimalist', 'minimalist', 1),
    ('Dark', 'Karanlık', 'Dark', 'dark', 2),
    ('Colorful', 'Renkli', 'Colorful', 'colorful', 3),
    ('Nature', 'Doğa', 'Nature', 'nature', 4),
    ('Neon', 'Neon', 'Neon', 'neon', 5),
    ('Retro', 'Retro', 'Retro', 'retro', 6),
    ('Professional', 'Profesyonel', 'Professional', 'professional', 7),
    ('Cute', 'Sevimli', 'Cute', 'cute', 8);
```

### 3.3 store_themes (Tema Mağazası)

```sql
-- =============================================
-- TEMA MAĞAZASI
-- =============================================
CREATE TABLE public.store_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Yazar
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT,

    -- Temel Bilgiler
    name TEXT NOT NULL,
    name_tr TEXT,
    name_en TEXT,
    description TEXT,
    description_tr TEXT,
    description_en TEXT,

    -- Tema Türü
    theme_type TEXT NOT NULL CHECK (theme_type IN (
        'app',              -- Uygulama genel teması
        'incoming_voice',   -- Gelen sesli arama
        'incoming_video',   -- Gelen görüntülü arama
        'outgoing_voice',   -- Giden sesli arama
        'outgoing_video',   -- Giden görüntülü arama
        'in_call',          -- Arama sırasında
        'in_video_call',    -- Görüntülü arama sırasında
        'floating_call',    -- Floating widget
        'dialer'            -- Tuş takımı
    )),

    -- Kategori
    category_id UUID REFERENCES public.theme_categories(id),

    -- Fiyatlandırma
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    discount_percent INTEGER DEFAULT 0,
    discount_expires_at TIMESTAMPTZ,

    -- Tema İçeriği
    config JSONB NOT NULL,              -- Tema konfigürasyonu

    -- Görseller
    preview_images TEXT[],              -- Önizleme resimleri
    thumbnail_url TEXT,                 -- Küçük resim
    preview_video_url TEXT,             -- Önizleme videosu

    -- Etiketler ve Arama
    tags TEXT[],
    search_keywords TEXT[],

    -- Uyumluluk
    min_app_version TEXT,
    supported_platforms TEXT[] DEFAULT ARRAY['android', 'ios'],

    -- İstatistikler
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) GENERATED ALWAYS AS (
        CASE WHEN rating_count > 0
        THEN rating_sum::DECIMAL / rating_count
        ELSE 0 END
    ) STORED,

    -- Öne Çıkanlar
    is_featured BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ,
    featured_until TIMESTAMPTZ,

    -- Editör Seçimi
    is_editor_choice BOOLEAN DEFAULT false,
    editor_choice_at TIMESTAMPTZ,

    -- Durum
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- İndeksler
CREATE INDEX idx_store_themes_author ON public.store_themes(author_id);
CREATE INDEX idx_store_themes_type ON public.store_themes(theme_type);
CREATE INDEX idx_store_themes_category ON public.store_themes(category_id);
CREATE INDEX idx_store_themes_free ON public.store_themes(is_free);
CREATE INDEX idx_store_themes_featured ON public.store_themes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_store_themes_approved ON public.store_themes(is_approved, is_active);
CREATE INDEX idx_store_themes_rating ON public.store_themes(rating_avg DESC);
CREATE INDEX idx_store_themes_downloads ON public.store_themes(download_count DESC);
CREATE INDEX idx_store_themes_tags ON public.store_themes USING GIN(tags);

-- Full-text search
CREATE INDEX idx_store_themes_search ON public.store_themes
    USING GIN(to_tsvector('turkish', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Updated_at trigger
CREATE TRIGGER update_store_themes_updated_at
    BEFORE UPDATE ON public.store_themes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.4 ringtone_categories (Zil Sesi Kategorileri)

```sql
-- =============================================
-- ZİL SESİ KATEGORİLERİ
-- =============================================
CREATE TABLE public.ringtone_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Temel
    name TEXT NOT NULL,
    name_tr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Görsel
    icon TEXT,
    color TEXT,

    -- Sıralama
    sort_order INTEGER DEFAULT 0,

    -- Durum
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan kategoriler
INSERT INTO public.ringtone_categories (name, name_tr, name_en, slug, sort_order) VALUES
    ('Classic', 'Klasik', 'Classic', 'classic', 1),
    ('Modern', 'Modern', 'Modern', 'modern', 2),
    ('Nature', 'Doğa', 'Nature', 'nature', 3),
    ('Music', 'Müzik', 'Music', 'music', 4),
    ('Funny', 'Komik', 'Funny', 'funny', 5),
    ('Minimal', 'Minimal', 'Minimal', 'minimal', 6),
    ('Retro', 'Retro', 'Retro', 'retro', 7),
    ('Electronic', 'Elektronik', 'Electronic', 'electronic', 8);
```

### 3.5 store_ringtones (Zil Sesi Mağazası)

```sql
-- =============================================
-- ZİL SESİ MAĞAZASI
-- =============================================
CREATE TABLE public.store_ringtones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Yazar
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT,
    artist_name TEXT,

    -- Temel Bilgiler
    name TEXT NOT NULL,
    name_tr TEXT,
    name_en TEXT,
    description TEXT,

    -- Kategori
    category_id UUID REFERENCES public.ringtone_categories(id),

    -- Dosya Bilgileri
    file_url TEXT NOT NULL,             -- İndirme URL'i
    preview_url TEXT NOT NULL,          -- Önizleme URL'i (kısa versiyon)
    duration INTEGER NOT NULL,          -- Saniye
    file_size INTEGER NOT NULL,         -- Byte
    format TEXT NOT NULL CHECK (format IN ('mp3', 'ogg', 'm4a', 'aac')),
    sample_rate INTEGER,                -- Hz
    bitrate INTEGER,                    -- kbps

    -- Dalga Formu
    waveform_data JSONB,                -- Görselleştirme için

    -- Fiyatlandırma
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',

    -- Etiketler
    tags TEXT[],
    mood TEXT[],                        -- Ruh hali: calm, energetic, etc.

    -- İstatistikler
    download_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) GENERATED ALWAYS AS (
        CASE WHEN rating_count > 0
        THEN rating_sum::DECIMAL / rating_count
        ELSE 0 END
    ) STORED,

    -- Öne Çıkanlar
    is_featured BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ,

    -- Durum
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_store_ringtones_category ON public.store_ringtones(category_id);
CREATE INDEX idx_store_ringtones_free ON public.store_ringtones(is_free);
CREATE INDEX idx_store_ringtones_featured ON public.store_ringtones(is_featured) WHERE is_featured = true;
CREATE INDEX idx_store_ringtones_approved ON public.store_ringtones(is_approved, is_active);
CREATE INDEX idx_store_ringtones_rating ON public.store_ringtones(rating_avg DESC);
CREATE INDEX idx_store_ringtones_downloads ON public.store_ringtones(download_count DESC);
CREATE INDEX idx_store_ringtones_tags ON public.store_ringtones USING GIN(tags);

-- Updated_at trigger
CREATE TRIGGER update_store_ringtones_updated_at
    BEFORE UPDATE ON public.store_ringtones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.6 purchases (Satın Almalar)

```sql
-- =============================================
-- SATIN ALMALAR
-- =============================================
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Kullanıcı
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Ürün
    item_type TEXT NOT NULL CHECK (item_type IN ('theme', 'ringtone', 'premium')),
    item_id UUID,                       -- theme veya ringtone ID
    item_name TEXT,                     -- Ürün adı (referans için)

    -- Fiyat
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',

    -- Ödeme
    payment_method TEXT,                -- google_play, app_store, stripe
    payment_provider TEXT,
    transaction_id TEXT,
    receipt_data TEXT,                  -- Doğrulama için

    -- Premium için
    premium_plan TEXT,
    premium_duration_days INTEGER,

    -- Durum
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'completed', 'failed', 'refunded', 'cancelled'
    )),
    failure_reason TEXT,

    -- Meta
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    refunded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,             -- Premium için

    -- Unique constraint
    CONSTRAINT unique_user_item UNIQUE (user_id, item_type, item_id)
);

-- İndeksler
CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_item ON public.purchases(item_type, item_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_date ON public.purchases(purchased_at DESC);
```

### 3.7 reviews (Değerlendirmeler)

```sql
-- =============================================
-- DEĞERLENDİRMELER
-- =============================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Kullanıcı
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Ürün
    item_type TEXT NOT NULL CHECK (item_type IN ('theme', 'ringtone')),
    item_id UUID NOT NULL,

    -- Değerlendirme
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,

    -- Yararlılık
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,

    -- Yazar Yanıtı
    author_reply TEXT,
    author_replied_at TIMESTAMPTZ,

    -- Moderasyon
    is_approved BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,
    reported_count INTEGER DEFAULT 0,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint (her kullanıcı bir ürüne bir kez değerlendirme yapabilir)
    CONSTRAINT unique_user_review UNIQUE (user_id, item_type, item_id)
);

-- İndeksler
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_item ON public.reviews(item_type, item_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_date ON public.reviews(created_at DESC);

-- Değerlendirme eklendiğinde tema/zil sesi istatistiklerini güncelle
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_type = 'theme' THEN
        UPDATE public.store_themes
        SET
            rating_sum = rating_sum + NEW.rating,
            rating_count = rating_count + 1
        WHERE id = NEW.item_id;
    ELSIF NEW.item_type = 'ringtone' THEN
        UPDATE public.store_ringtones
        SET
            rating_sum = rating_sum + NEW.rating,
            rating_count = rating_count + 1
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_item_rating();
```

### 3.8 user_sync_data (Kullanıcı Senkronizasyon Verileri)

```sql
-- =============================================
-- KULLANICI SENKRONİZASYON VERİLERİ
-- =============================================
CREATE TABLE public.user_sync_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Kullanıcı
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Veri Türü
    data_type TEXT NOT NULL CHECK (data_type IN (
        'favorites',        -- Favori kişiler
        'blocked',          -- Engelli numaralar
        'speed_dial',       -- Hızlı arama
        'settings',         -- Uygulama ayarları
        'theme_prefs',      -- Tema tercihleri
        'call_note_prefs',  -- Arama notu tercihleri
        'groups'            -- Kişi grupları
    )),

    -- Veri
    data JSONB NOT NULL,

    -- Sürüm (çakışma çözümü için)
    version INTEGER DEFAULT 1,

    -- Meta
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    device_name TEXT,

    -- Unique constraint
    CONSTRAINT unique_user_data_type UNIQUE (user_id, data_type)
);

-- İndeksler
CREATE INDEX idx_user_sync_data_user ON public.user_sync_data(user_id);
CREATE INDEX idx_user_sync_data_type ON public.user_sync_data(data_type);
```

---

## 4. Row Level Security (RLS) Politikaları

```sql
-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- RLS'i etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_ringtones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sync_data ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ═══════════════════════════════════
-- STORE_THEMES
-- ═══════════════════════════════════

-- Herkes onaylanmış ve aktif temaları görebilir
CREATE POLICY "Anyone can view approved themes"
    ON public.store_themes FOR SELECT
    USING (is_approved = true AND is_active = true);

-- Yazarlar kendi temalarını görebilir (onaysız dahil)
CREATE POLICY "Authors can view own themes"
    ON public.store_themes FOR SELECT
    USING (author_id = auth.uid());

-- Yazarlar tema ekleyebilir
CREATE POLICY "Authors can insert themes"
    ON public.store_themes FOR INSERT
    WITH CHECK (author_id = auth.uid());

-- Yazarlar kendi temalarını güncelleyebilir
CREATE POLICY "Authors can update own themes"
    ON public.store_themes FOR UPDATE
    USING (author_id = auth.uid());

-- ═══════════════════════════════════
-- STORE_RINGTONES
-- ═══════════════════════════════════

-- Herkes onaylanmış zil seslerini görebilir
CREATE POLICY "Anyone can view approved ringtones"
    ON public.store_ringtones FOR SELECT
    USING (is_approved = true AND is_active = true);

-- ═══════════════════════════════════
-- PURCHASES
-- ═══════════════════════════════════

-- Kullanıcılar kendi satın almalarını görebilir
CREATE POLICY "Users can view own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar satın alma yapabilir
CREATE POLICY "Users can insert purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════

-- Herkes onaylı değerlendirmeleri görebilir
CREATE POLICY "Anyone can view approved reviews"
    ON public.reviews FOR SELECT
    USING (is_approved = true AND is_hidden = false);

-- Kullanıcılar kendi değerlendirmelerini görebilir
CREATE POLICY "Users can view own reviews"
    ON public.reviews FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcılar değerlendirme ekleyebilir
CREATE POLICY "Users can insert reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi değerlendirmelerini güncelleyebilir
CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi değerlendirmelerini silebilir
CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════
-- USER_SYNC_DATA
-- ═══════════════════════════════════

-- Kullanıcılar kendi sync verilerini yönetebilir
CREATE POLICY "Users can manage own sync data"
    ON public.user_sync_data FOR ALL
    USING (auth.uid() = user_id);
```

---

## 5. Storage Bucket'ları

```sql
-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Tema görselleri
INSERT INTO storage.buckets (id, name, public)
VALUES ('theme-assets', 'theme-assets', true);

-- Zil sesi dosyaları
INSERT INTO storage.buckets (id, name, public)
VALUES ('ringtones', 'ringtones', true);

-- Kullanıcı avatarları
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage politikaları
CREATE POLICY "Anyone can view theme assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'theme-assets');

CREATE POLICY "Anyone can view ringtones"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ringtones');

CREATE POLICY "Users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );
```

---

## 6. Edge Functions

### 6.1 verify-purchase

```typescript
// supabase/functions/verify-purchase/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { receipt, platform, item_type, item_id } = await req.json()

  // Platform'a göre doğrulama
  let isValid = false
  if (platform === 'android') {
    isValid = await verifyGooglePlayReceipt(receipt)
  } else if (platform === 'ios') {
    isValid = await verifyAppStoreReceipt(receipt)
  }

  if (isValid) {
    // Satın almayı kaydet
    // ...
  }

  return new Response(JSON.stringify({ success: isValid }))
})
```

### 6.2 sync-data

```typescript
// supabase/functions/sync-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { user_id, data_type, data, version } = await req.json()

  // Çakışma kontrolü ve çözümü
  // ...

  return new Response(JSON.stringify({ success: true }))
})
```

---

## 7. Örnek Sorgular

### Popüler Temaları Getir
```sql
SELECT
    id, name, thumbnail_url, price, is_free,
    rating_avg, download_count
FROM store_themes
WHERE is_approved = true AND is_active = true
ORDER BY download_count DESC
LIMIT 20;
```

### Kullanıcının Satın Aldıklarını Kontrol Et
```sql
SELECT EXISTS (
    SELECT 1 FROM purchases
    WHERE user_id = $1
    AND item_type = $2
    AND item_id = $3
    AND status = 'completed'
) AS has_purchased;
```

### Kategori ile Temaları Getir
```sql
SELECT t.*, c.name as category_name
FROM store_themes t
LEFT JOIN theme_categories c ON t.category_id = c.id
WHERE t.is_approved = true
AND t.is_active = true
AND c.slug = $1
ORDER BY t.rating_avg DESC;
```

---

## 8. Migrasyon Notları

### İlk Kurulum
1. Supabase projesini oluştur
2. SQL Editor'da şemaları çalıştır
3. Storage bucket'larını oluştur
4. RLS politikalarını etkinleştir
5. Edge functions'ları deploy et

### Versiyon Güncellemeleri
- Her şema değişikliği için migration dosyası oluştur
- `supabase/migrations/` klasöründe sakla
- `supabase db push` ile deploy et

---

*Son Güncelleme: Ocak 2026*
*Versiyon: 1.0*
