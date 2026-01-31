# CallHub - Supabase Kurulum Rehberi

Bu doküman Supabase projesi kurulumu ve yapılandırması için hızlı referans rehberidir.

> **Detaylı şema için:** [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) dosyasına bakın.

---

## 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni proje oluşturun
3. Proje URL ve anon key'i kaydedin

```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJxxxx...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 2. Tablo Özeti

### Anlık Sync Tabloları
| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri, premium durumu |
| `purchases` | Tema/zil sesi/premium satın almaları |
| `user_settings` | Kullanıcı ayarları (opsiyonel) |

### Günlük Yedekleme Tabloları
| Tablo | Açıklama |
|-------|----------|
| `user_backups_notes` | Not yedekleri |
| `user_backups_call_logs` | Arama geçmişi yedekleri |
| `user_backups_call_notes` | Arama notu yedekleri |
| `user_backups_events` | Takvim etkinlik yedekleri |
| `user_backups_reminders` | Hatırlatıcı yedekleri |

### Mağaza Tabloları
| Tablo | Açıklama |
|-------|----------|
| `theme_categories` | Tema kategorileri |
| `store_themes` | Tema mağazası |
| `ringtone_categories` | Zil sesi kategorileri |
| `store_ringtones` | Zil sesi mağazası |
| `reviews` | Kullanıcı değerlendirmeleri |

---

## 3. Authentication Ayarları

### Providers
- **Email/Password**: Varsayılan
- **Google OAuth**: Google ile giriş

### Supabase Dashboard'da:
1. Authentication > Providers
2. Email: Enabled
3. Google: Client ID ve Secret ekle

---

## 4. Storage Buckets

```sql
-- SQL Editor'da çalıştırın
INSERT INTO storage.buckets (id, name, public) VALUES
  ('theme-assets', 'theme-assets', true),
  ('ringtones', 'ringtones', true),
  ('user-backups', 'user-backups', false);
```

### Bucket Politikaları
```sql
-- Tema ve zil sesleri herkese açık (okuma)
CREATE POLICY "Public read theme assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-assets');

CREATE POLICY "Public read ringtones"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ringtones');

-- Yedeklemeler sadece kullanıcıya özel
CREATE POLICY "Users own their backups"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'user-backups'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
```

---

## 5. Row Level Security (RLS)

Tüm kullanıcı tablolarında RLS etkindir:

```sql
-- Örnek: profiles tablosu
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## 6. Kurulum Sırası

1. **Temel tablolar** (profiles, categories)
2. **Mağaza tabloları** (store_themes, store_ringtones)
3. **İşlem tabloları** (purchases, reviews)
4. **Yedekleme tabloları** (user_backups_*)
5. **Storage buckets**
6. **RLS politikaları**
7. **Triggers** (otomatik profil oluşturma)

---

## 7. Migrasyon Dosyaları

```
supabase/
├── migrations/
│   ├── 20260131_001_create_profiles.sql
│   ├── 20260131_002_create_categories.sql
│   ├── 20260131_003_create_store_tables.sql
│   ├── 20260131_004_create_purchases.sql
│   ├── 20260131_005_create_backup_tables.sql
│   └── 20260131_006_create_rls_policies.sql
├── functions/
│   ├── verify-purchase/index.ts
│   └── process-backup/index.ts
└── config.toml
```

---

## 8. Environment Variables

```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...  # Sadece backend
```

---

## 9. React Native Entegrasyonu

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

```typescript
// src/services/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

*Son Güncelleme: Ocak 2026*
*Versiyon: 2.0*
