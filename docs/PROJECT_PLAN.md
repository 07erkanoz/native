# Telefon Rehberi ve Arama Uygulaması - Proje Planı

## Proje Özeti

React Native ile gelişmiş bir telefon rehberi ve arama yönetimi uygulaması. Tema mağazası, özelleştirilebilir UI, ve bulut senkronizasyonu özellikleri içerecek.

---

## 1. Temel Özellikler

### 1.1 Ana Ekranlar

| Ekran | Açıklama |
|-------|----------|
| **Favoriler** | Grid görünümde sık kullanılan kişiler |
| **Son Aramalar** | Çağrı geçmişi (gelen, giden, cevapsız) |
| **Rehber** | Alfabetik sıralı kişi listesi |
| **Tuş Takımı** | Numara çevirme ekranı |
| **Tema Mağazası** | Tema satın alma ve indirme |
| **Ayarlar** | Gelişmiş ayar yönetimi |

### 1.2 Çağrı Yönetimi

- Gelen arama ekranı (özelleştirilebilir UI)
- Cevaplama ekranı (özelleştirilebilir UI)
- Arama sırasında ekran (tuş takımı, bekletme, hoparlör vb.)
- Çoklu arama desteği
- Arama kaydı (opsiyonel)

### 1.3 Tema Sistemi

- Uygulama genel teması (koyu/açık mod + özel temalar)
- Gelen arama UI teması
- Cevaplama UI teması
- Arama sırasında UI teması
- Tema mağazası (ücretsiz + premium temalar)

---

## 2. Teknik Mimari

### 2.1 Teknoloji Yığını

```
Frontend:
├── React Native (0.73+)
├── TypeScript
├── React Navigation 6.x
├── Redux Toolkit + RTK Query
├── React Native Paper (UI Kit)
└── React Native Reanimated (Animasyonlar)

Backend/Database:
├── SQLite (Yerel veri)
├── Supabase (Bulut - kullanıcı yönetimi, tema mağazası)
└── AsyncStorage (Tercihler)

Native Modüller:
├── react-native-callkeep (Çağrı yönetimi)
├── react-native-contacts (Rehber erişimi)
├── react-native-call-log (Çağrı geçmişi)
├── react-native-incall-manager (Arama sırasında yönetim)
└── react-native-permissions (İzin yönetimi)
```

### 2.2 Proje Klasör Yapısı

```
src/
├── app/                          # Uygulama giriş noktası
│   ├── App.tsx
│   ├── store.ts                  # Redux store
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── TabNavigator.tsx
│       └── types.ts
│
├── features/                     # Özellik bazlı modüller
│   ├── auth/                     # Kimlik doğrulama
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── authSlice.ts
│   │
│   ├── contacts/                 # Rehber yönetimi
│   │   ├── screens/
│   │   │   ├── ContactListScreen.tsx
│   │   │   ├── ContactDetailScreen.tsx
│   │   │   ├── ContactEditScreen.tsx
│   │   │   └── FavoritesScreen.tsx
│   │   ├── components/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactAvatar.tsx
│   │   │   ├── AlphabetScroller.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── hooks/
│   │   │   ├── useContacts.ts
│   │   │   └── useFavorites.ts
│   │   ├── services/
│   │   │   └── contactsService.ts
│   │   └── contactsSlice.ts
│   │
│   ├── calls/                    # Çağrı yönetimi
│   │   ├── screens/
│   │   │   ├── CallHistoryScreen.tsx
│   │   │   ├── DialerScreen.tsx
│   │   │   ├── IncomingCallScreen.tsx
│   │   │   ├── OutgoingCallScreen.tsx
│   │   │   └── InCallScreen.tsx
│   │   ├── components/
│   │   │   ├── CallLogItem.tsx
│   │   │   ├── Dialpad.tsx
│   │   │   ├── CallActionButton.tsx
│   │   │   └── CallTimer.tsx
│   │   ├── hooks/
│   │   │   ├── useCallManager.ts
│   │   │   └── useCallHistory.ts
│   │   ├── services/
│   │   │   └── callService.ts
│   │   └── callsSlice.ts
│   │
│   ├── themes/                   # Tema yönetimi
│   │   ├── screens/
│   │   │   ├── ThemeStoreScreen.tsx
│   │   │   ├── ThemeDetailScreen.tsx
│   │   │   ├── ThemeCustomizeScreen.tsx
│   │   │   └── MyThemesScreen.tsx
│   │   ├── components/
│   │   │   ├── ThemeCard.tsx
│   │   │   ├── ThemePreview.tsx
│   │   │   └── ColorPicker.tsx
│   │   ├── hooks/
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   └── themeService.ts
│   │   ├── presets/              # Varsayılan temalar
│   │   │   ├── defaultLight.ts
│   │   │   ├── defaultDark.ts
│   │   │   ├── neonTheme.ts
│   │   │   └── retroTheme.ts
│   │   └── themesSlice.ts
│   │
│   └── settings/                 # Ayarlar
│       ├── screens/
│       │   ├── SettingsScreen.tsx
│       │   ├── AppearanceSettings.tsx
│       │   ├── CallSettings.tsx
│       │   ├── NotificationSettings.tsx
│       │   ├── PrivacySettings.tsx
│       │   ├── BlockedNumbersScreen.tsx
│       │   └── AboutScreen.tsx
│       ├── components/
│       │   ├── SettingItem.tsx
│       │   └── SettingSection.tsx
│       └── settingsSlice.ts
│
├── shared/                       # Paylaşılan bileşenler
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── usePermissions.ts
│   │   └── useDebounce.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── helpers.ts
│
├── database/                     # Veritabanı katmanı
│   ├── sqlite/
│   │   ├── database.ts           # SQLite bağlantısı
│   │   ├── migrations/           # Şema migrasyonları
│   │   ├── repositories/
│   │   │   ├── contactsRepository.ts
│   │   │   ├── callLogsRepository.ts
│   │   │   ├── themesRepository.ts
│   │   │   └── settingsRepository.ts
│   │   └── models/
│   │       ├── Contact.ts
│   │       ├── CallLog.ts
│   │       ├── Theme.ts
│   │       └── Settings.ts
│   └── supabase/
│       ├── client.ts             # Supabase client
│       ├── auth.ts               # Kimlik doğrulama
│       └── sync.ts               # Senkronizasyon
│
├── services/                     # Servis katmanı
│   ├── native/
│   │   ├── CallManager.ts        # Native çağrı yönetimi
│   │   ├── ContactsManager.ts    # Native rehber
│   │   └── PermissionsManager.ts
│   └── api/
│       └── themeStoreApi.ts
│
├── constants/                    # Sabitler
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── config.ts
│
└── types/                        # TypeScript tipleri
    ├── contact.ts
    ├── call.ts
    ├── theme.ts
    ├── settings.ts
    └── navigation.ts
```

---

## 3. Veritabanı Şeması

### 3.1 SQLite (Yerel Veritabanı)

```sql
-- =============================================
-- KİŞİLER TABLOSU
-- =============================================
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,                    -- UUID
    device_contact_id TEXT,                 -- Cihaz kişi ID'si
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    company TEXT,
    job_title TEXT,
    photo_uri TEXT,                         -- Yerel fotoğraf yolu
    photo_thumbnail TEXT,                   -- Küçük resim (base64)
    is_favorite INTEGER DEFAULT 0,
    favorite_order INTEGER,                 -- Favori sıralama
    is_blocked INTEGER DEFAULT 0,
    notes TEXT,
    birthday TEXT,                          -- ISO 8601 format
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced_at TEXT                          -- Son senkronizasyon
);

-- =============================================
-- TELEFON NUMARALARI TABLOSU
-- =============================================
CREATE TABLE phone_numbers (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    number TEXT NOT NULL,                   -- Normalize edilmiş numara
    formatted_number TEXT,                  -- Görüntüleme formatı
    label TEXT DEFAULT 'mobile',            -- mobile, home, work, other
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
    label TEXT DEFAULT 'personal',          -- personal, work, other
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
    label TEXT DEFAULT 'home',              -- home, work, other
    formatted_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- ÇAĞRI GEÇMİŞİ TABLOSU
-- =============================================
CREATE TABLE call_logs (
    id TEXT PRIMARY KEY,
    contact_id TEXT,                        -- NULL olabilir (bilinmeyen numara)
    phone_number TEXT NOT NULL,
    formatted_number TEXT,
    call_type TEXT NOT NULL,                -- incoming, outgoing, missed, rejected, blocked
    duration INTEGER DEFAULT 0,             -- Saniye cinsinden
    call_date TEXT NOT NULL,                -- ISO 8601 format
    is_read INTEGER DEFAULT 0,              -- Cevapsız arama okundu mu
    is_new INTEGER DEFAULT 1,
    geocoded_location TEXT,                 -- Konum bilgisi
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- ENGELLİ NUMARALAR TABLOSU
-- =============================================
CREATE TABLE blocked_numbers (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    contact_id TEXT,
    reason TEXT,                            -- spam, harassment, other
    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- =============================================
-- TEMALAR TABLOSU
-- =============================================
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,                     -- app, incoming_call, in_call, outgoing_call
    is_system INTEGER DEFAULT 0,            -- Sistem varsayılan tema mı
    is_premium INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    preview_image TEXT,
    config TEXT NOT NULL,                   -- JSON - tema konfigürasyonu
    is_active INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- KULLANICI TEMALARI (İndirilen/Satın Alınan)
-- =============================================
CREATE TABLE user_themes (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL,
    purchased_at TEXT,
    downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 0,
    custom_config TEXT,                     -- Özelleştirmeler (JSON)
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- =============================================
-- AYARLAR TABLOSU
-- =============================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT,                          -- general, appearance, calls, notifications, privacy
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HIZLI ARAMA (SPEED DIAL) TABLOSU
-- =============================================
CREATE TABLE speed_dial (
    position INTEGER PRIMARY KEY,           -- 1-9 tuşları
    contact_id TEXT,
    phone_number TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- =============================================
-- GRUPLAR TABLOSU
-- =============================================
CREATE TABLE contact_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,                             -- Hex renk kodu
    icon TEXT,
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
-- İNDEXLER
-- =============================================
CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_is_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_is_blocked ON contacts(is_blocked);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX idx_phone_numbers_contact ON phone_numbers(contact_id);
CREATE INDEX idx_call_logs_date ON call_logs(call_date DESC);
CREATE INDEX idx_call_logs_contact ON call_logs(contact_id);
CREATE INDEX idx_call_logs_number ON call_logs(phone_number);
CREATE INDEX idx_themes_type ON themes(type);
CREATE INDEX idx_themes_active ON themes(is_active);
```

### 3.2 Supabase (Bulut Veritabanı)

```sql
-- =============================================
-- KULLANICILAR (Supabase Auth ile entegre)
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    is_premium INTEGER DEFAULT 0,
    premium_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEMA MAĞAZASI
-- =============================================
CREATE TABLE store_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,                     -- app, incoming_call, in_call, outgoing_call
    category TEXT,                          -- minimalist, neon, retro, nature, etc.
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    preview_images TEXT[],                  -- Array of image URLs
    config JSONB NOT NULL,
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEMA SATIN ALMALARI
-- =============================================
CREATE TABLE theme_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    theme_id UUID NOT NULL REFERENCES store_themes(id),
    price_paid DECIMAL(10,2),
    transaction_id TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, theme_id)
);

-- =============================================
-- TEMA DEĞERLENDİRMELERİ
-- =============================================
CREATE TABLE theme_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    theme_id UUID NOT NULL REFERENCES store_themes(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, theme_id)
);

-- =============================================
-- KULLANICI TERCİHLERİ SENKRONİZASYONU
-- =============================================
CREATE TABLE user_sync_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    data_type TEXT NOT NULL,                -- favorites, blocked, settings, speed_dial
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data_type)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_data ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tema satın almaları
CREATE POLICY "Users can view own purchases" ON theme_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Senkronizasyon verileri
CREATE POLICY "Users can manage own sync data" ON user_sync_data
    FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Tema Sistemi Mimarisi

### 4.1 Tema Yapısı

```typescript
// types/theme.ts

interface AppTheme {
  id: string;
  name: string;
  type: 'app';
  colors: {
    // Ana renkler
    primary: string;
    secondary: string;
    accent: string;

    // Arka plan renkleri
    background: string;
    surface: string;
    card: string;

    // Metin renkleri
    text: string;
    textSecondary: string;
    textDisabled: string;

    // Durum renkleri
    success: string;
    warning: string;
    error: string;
    info: string;

    // Çağrı renkleri
    callIncoming: string;
    callOutgoing: string;
    callMissed: string;
    callRejected: string;

    // Navigasyon
    tabBar: string;
    tabBarActive: string;
    tabBarInactive: string;

    // Diğer
    border: string;
    divider: string;
    shadow: string;
    overlay: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyBold: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadows: {
    sm: ShadowConfig;
    md: ShadowConfig;
    lg: ShadowConfig;
  };
}

interface CallScreenTheme {
  id: string;
  name: string;
  type: 'incoming_call' | 'in_call' | 'outgoing_call';
  background: {
    type: 'solid' | 'gradient' | 'image' | 'blur' | 'animated';
    value: string | GradientConfig | AnimationConfig;
  };
  callerInfo: {
    nameColor: string;
    nameSize: number;
    numberColor: string;
    numberSize: number;
    avatarStyle: 'circle' | 'rounded' | 'square';
    avatarSize: number;
    avatarBorder: BorderConfig;
  };
  buttons: {
    answer: ButtonTheme;
    reject: ButtonTheme;
    mute: ButtonTheme;
    speaker: ButtonTheme;
    keypad: ButtonTheme;
    hold: ButtonTheme;
    endCall: ButtonTheme;
  };
  animation: {
    type: 'none' | 'pulse' | 'wave' | 'ripple' | 'glow';
    duration: number;
    color: string;
  };
  statusBar: {
    style: 'light' | 'dark';
    backgroundColor: string;
  };
}

interface ButtonTheme {
  backgroundColor: string;
  iconColor: string;
  iconSize: number;
  size: number;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
  shadow?: ShadowConfig;
  pressedOpacity?: number;
  activeBackgroundColor?: string;
  activeIconColor?: string;
}

interface GradientConfig {
  type: 'linear' | 'radial';
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

interface AnimationConfig {
  type: 'particles' | 'waves' | 'gradient_shift';
  config: Record<string, any>;
}
```

### 4.2 Varsayılan Temalar

```typescript
// themes/presets/defaultDark.ts

export const defaultDarkTheme: AppTheme = {
  id: 'default-dark',
  name: 'Karanlık',
  type: 'app',
  colors: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    background: '#121212',
    surface: '#1E1E1E',
    card: '#252525',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textDisabled: '#666666',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    callIncoming: '#4CAF50',
    callOutgoing: '#2196F3',
    callMissed: '#F44336',
    callRejected: '#FF9800',
    tabBar: '#1E1E1E',
    tabBarActive: '#4CAF50',
    tabBarInactive: '#808080',
    border: '#333333',
    divider: '#2A2A2A',
    shadow: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
  },
  typography: {
    fontFamily: 'System',
    fontFamilyBold: 'System',
    sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 16, full: 9999 },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  },
};
```

```typescript
// themes/presets/incomingCallNeon.ts

export const neonIncomingCallTheme: CallScreenTheme = {
  id: 'neon-incoming',
  name: 'Neon Gece',
  type: 'incoming_call',
  background: {
    type: 'gradient',
    value: {
      type: 'linear',
      colors: ['#0F0C29', '#302B63', '#24243E'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  callerInfo: {
    nameColor: '#FFFFFF',
    nameSize: 28,
    numberColor: '#B0B0B0',
    numberSize: 16,
    avatarStyle: 'circle',
    avatarSize: 120,
    avatarBorder: {
      width: 3,
      color: '#00F5FF',
      style: 'solid',
    },
  },
  buttons: {
    answer: {
      backgroundColor: '#00E676',
      iconColor: '#FFFFFF',
      iconSize: 32,
      size: 72,
      borderRadius: 36,
      shadow: { shadowColor: '#00E676', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15 },
    },
    reject: {
      backgroundColor: '#FF1744',
      iconColor: '#FFFFFF',
      iconSize: 32,
      size: 72,
      borderRadius: 36,
      shadow: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15 },
    },
    // ... diğer butonlar
  },
  animation: {
    type: 'pulse',
    duration: 1500,
    color: '#00F5FF',
  },
  statusBar: {
    style: 'light',
    backgroundColor: 'transparent',
  },
};
```

---

## 5. Ekran Tasarımları ve Bileşenler

### 5.1 Ana Ekranlar

#### Favoriler Ekranı
```
┌─────────────────────────────────────┐
│  ☰  Favoriler                    🔍 │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ 👤  │ │ 👤  │ │ 👤  │ │ 👤  │    │
│ │     │ │     │ │     │ │     │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│  AŞKIM   Ortak   Babam   Zafer     │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ 👤  │ │ 👤  │ │ 👤  │ │ 👤  │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│ Çağan Öz  Ahmet  Av.Umut  Barış    │
│                                     │
│ ─────────────────────────────────── │
│ Sık iletişim kurulanlar             │
│ ┌────────────────────────────────┐  │
│ │ 👤  Senem Daşkıran Yeni        │  │
│ ├────────────────────────────────┤  │
│ │ 👤  Ömür Günal                 │  │
│ ├────────────────────────────────┤  │
│ │ 👤  Barış Bot                  │  │
│ └────────────────────────────────┘  │
├─────────────────────────────────────┤
│ [⭐] [🕐] [👥] [⌨️] [⚙️]             │
│ Fav   Son  Kişi  Tuş   Ayar        │
└─────────────────────────────────────┘
```

#### Çağrı Geçmişi Ekranı
```
┌─────────────────────────────────────┐
│  ☰  Son Aramalar              Tümü │
├─────────────────────────────────────┤
│ ┌────────────────────────────────┐  │
│ │ 👤 Senem Daşkıran     01:24   │  │
│ │ ↗️ +90 546 543 46 31   az önce │  │
│ ├────────────────────────────────┤  │
│ │ 👤 AŞKIM [260]         00:31  │  │
│ │ ↗️ +90 532 397 94 00  53d önce│  │
│ ├────────────────────────────────┤  │
│ │ D  Deniz Kızım [3]     00:18  │  │
│ │ ↙️ +90 542 775 88 07   1s önce│  │
│ ├────────────────────────────────┤  │
│ │ 👤 Çağan Öz [166]      23:59  │  │
│ │ ↙️ 0536 562 21 76    1.5s önce│  │
│ └────────────────────────────────┘  │
│                                     │
│         ┌─────────────────┐         │
│         │   🔢 Tuş Takımı │         │
│         └─────────────────┘         │
├─────────────────────────────────────┤
│ [⭐] [🕐] [👥] [⌨️] [⚙️]             │
└─────────────────────────────────────┘
```

#### Rehber Ekranı
```
┌─────────────────────────────────────┐
│  🔍 1979 kişi içinde ara...        │
├─────────────────────────────────────┤
│ ┌────────────────────────────────┐ #│
│ │ 👤 💗Başak Tanem Bebişlik💗    │ 0│
│ ├────────────────────────────────┤ A│
│ │ 🔴 07 Yıkama Ali               │ B│
│ ├────────────────────────────────┤ C│
│ │ 👤 1 Ağır Ceza Mübaşir Erol    │ Ç│
│ ├────────────────────────────────┤ D│
│ │ 👤 1 Aile Mahkemesi Müdür...   │ E│
│ ├────────────────────────────────┤ F│
│ │ 👤 1 Asliye Ceza Mübaşir İb.   │ G│
│ ├────────────────────────────────┤ H│
│ │ 👤 1 Asliye Hukuk Kâtip Emine  │ I│
│ ├────────────────────────────────┤ K│
│ │ 👤 1 Asliye Kemal              │ L│
│ ├────────────────────────────────┤ M│
│ │ 👤 1 İcra Gökhan               │ N│
│ └────────────────────────────────┘ .│
├─────────────────────────────────────┤
│  [+]    KİŞİLERİ ARA           [⋮] │
└─────────────────────────────────────┘
```

### 5.2 Arama Ekranları

#### Gelen Arama Ekranı
```
┌─────────────────────────────────────┐
│                                     │
│           ┌─────────┐               │
│           │         │               │
│           │   👤    │    ← Avatar   │
│           │         │      (pulse   │
│           └─────────┘      animasyon)│
│                                     │
│         Senem Daşkıran              │
│       +90 546 543 46 31             │
│                                     │
│          Gelen Arama...             │
│                                     │
│                                     │
│                                     │
│                                     │
│    ┌─────────┐    ┌─────────┐      │
│    │  💬    │    │   🔔    │      │
│    │ Mesaj   │    │  Hatır. │      │
│    └─────────┘    └─────────┘      │
│                                     │
│    ┌─────────┐    ┌─────────┐      │
│    │   ❌    │    │   ✅    │      │
│    │ Reddet  │    │ Cevapla │      │
│    └─────────┘    └─────────┘      │
│                                     │
└─────────────────────────────────────┘
```

#### Arama Sırasında Ekran
```
┌─────────────────────────────────────┐
│           ┌─────────┐               │
│           │   👤    │               │
│           └─────────┘               │
│         Senem Daşkıran              │
│            02:45                    │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  🔇  │ │  ⌨️   │ │  🔊  │        │
│  │ Sesiz│ │ Tuşlar│ │Hopar.│        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  ⏸️  │ │  👥  │ │  ➕   │        │
│  │Beklet│ │Konfer.│ │ Ekle │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│         ┌───────────────┐           │
│         │      📞       │           │
│         │   Bitir       │           │
│         └───────────────┘           │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Ayarlar Yapısı

### 6.1 Ayar Kategorileri

```typescript
// types/settings.ts

interface AppSettings {
  // Genel Ayarlar
  general: {
    language: 'tr' | 'en' | 'de' | 'fr';
    defaultTab: 'favorites' | 'recent' | 'contacts' | 'dialpad';
    hapticFeedback: boolean;
    soundEffects: boolean;
  };

  // Görünüm Ayarları
  appearance: {
    appThemeId: string;
    incomingCallThemeId: string;
    outgoingCallThemeId: string;
    inCallThemeId: string;
    systemTheme: boolean;              // Sistem temasını takip et
    fontSize: 'small' | 'medium' | 'large';
    contactListStyle: 'compact' | 'comfortable' | 'large';
    showContactPhotos: boolean;
    animationsEnabled: boolean;
  };

  // Çağrı Ayarları
  calls: {
    answerAutomatically: boolean;
    answerDelay: number;               // Saniye
    vibrateOnRing: boolean;
    flashOnRing: boolean;
    ringtoneUri: string;
    proximityScreenOff: boolean;       // Yakınlık sensörü
    showCallerId: boolean;
    rejectWithSms: boolean;
    rejectSmsTemplate: string;
    callRecording: {
      enabled: boolean;
      autoRecord: boolean;
      recordIncoming: boolean;
      recordOutgoing: boolean;
      storageLocation: string;
    };
  };

  // Bildirim Ayarları
  notifications: {
    showMissedCallNotification: boolean;
    showCallerId: boolean;
    ledColor: string;
    notificationSound: string;
    doNotDisturbBypass: boolean;
  };

  // Gizlilik Ayarları
  privacy: {
    hideCallHistory: boolean;
    requireAuthForContacts: boolean;
    blockUnknownCallers: boolean;
    blockHiddenNumbers: boolean;
    blockSpamCallers: boolean;
    spamProtection: boolean;
  };

  // Senkronizasyon Ayarları
  sync: {
    autoSync: boolean;
    syncInterval: number;              // Dakika
    syncFavorites: boolean;
    syncBlocked: boolean;
    syncSettings: boolean;
    wifiOnly: boolean;
  };

  // Yedekleme Ayarları
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    includeCallHistory: boolean;
    includeSettings: boolean;
    includeThemes: boolean;
  };
}
```

### 6.2 Ayarlar Ekranı Yapısı

```
Ayarlar
├── Hesap
│   ├── Profil
│   ├── Giriş Yap / Kayıt Ol
│   └── Premium
│
├── Görünüm
│   ├── Uygulama Teması
│   ├── Gelen Arama Teması
│   ├── Arama Sırasında Teması
│   ├── Tema Mağazası
│   ├── Yazı Boyutu
│   ├── Kişi Listesi Görünümü
│   └── Animasyonlar
│
├── Aramalar
│   ├── Otomatik Cevaplama
│   ├── Titreşim
│   ├── Zil Sesi
│   ├── Mesajla Reddet
│   ├── Arama Kaydı
│   └── Hızlı Arama (Speed Dial)
│
├── Bildirimler
│   ├── Cevapsız Arama Bildirimi
│   ├── LED Rengi
│   └── Bildirim Sesi
│
├── Gizlilik ve Güvenlik
│   ├── Engelli Numaralar
│   ├── Spam Koruması
│   ├── Bilinmeyen Arayanları Engelle
│   └── Uygulama Kilidi
│
├── Senkronizasyon
│   ├── Hesap Senkronizasyonu
│   ├── Yalnızca Wi-Fi
│   └── Senkronizasyon Geçmişi
│
├── Yedekleme
│   ├── Yedeği Dışa Aktar
│   ├── Yedeği İçe Aktar
│   └── Otomatik Yedekleme
│
├── Gelişmiş
│   ├── Varsayılan Uygulama Ayarları
│   ├── Önbelleği Temizle
│   ├── Veritabanını Sıfırla
│   └── Geliştirici Seçenekleri
│
└── Hakkında
    ├── Sürüm
    ├── Gizlilik Politikası
    ├── Kullanım Şartları
    └── Lisanslar
```

---

## 7. Native Modül Entegrasyonları

### 7.1 Gerekli Kütüphaneler

```json
{
  "dependencies": {
    // Temel
    "react": "18.2.0",
    "react-native": "0.73.x",
    "typescript": "5.x",

    // Navigasyon
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",

    // State Yönetimi
    "@reduxjs/toolkit": "^2.x",
    "react-redux": "^9.x",

    // UI Kütüphaneleri
    "react-native-paper": "^5.x",
    "react-native-vector-icons": "^10.x",
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x",
    "@gorhom/bottom-sheet": "^4.x",
    "react-native-linear-gradient": "^2.x",

    // Native Modüller
    "react-native-contacts": "^7.x",
    "react-native-callkeep": "^4.x",
    "react-native-call-log": "^4.x",
    "react-native-incall-manager": "^4.x",
    "react-native-permissions": "^4.x",
    "react-native-fs": "^2.x",

    // Veritabanı
    "react-native-sqlite-storage": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "@react-native-async-storage/async-storage": "^1.x",

    // Diğer
    "react-native-uuid": "^2.x",
    "date-fns": "^3.x",
    "libphonenumber-js": "^1.x"
  }
}
```

### 7.2 Android Manifest İzinleri

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<manifest>
    <!-- Temel İzinler -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.WRITE_CALL_LOG" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.MANAGE_OWN_CALLS" />

    <!-- Bildirimler -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- Depolama (Arama kaydı için) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Ağ -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Foreground Service -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />

    <!-- Varsayılan Uygulama -->
    <uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />

    <application>
        <!-- Varsayılan Arama Uygulaması Olarak Kayıt -->
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.DIAL" />
                <data android:scheme="tel" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <data android:scheme="tel" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
            </intent-filter>
        </activity>

        <!-- Call Receiver -->
        <receiver android:name=".CallReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.PHONE_STATE" />
            </intent-filter>
        </receiver>

        <!-- Incall Service -->
        <service android:name=".InCallService"
            android:permission="android.permission.BIND_INCALL_SERVICE"
            android:exported="true">
            <meta-data
                android:name="android.telecom.IN_CALL_SERVICE_UI"
                android:value="true" />
            <intent-filter>
                <action android:name="android.telecom.InCallService" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

---

## 8. Geliştirme Aşamaları

### Faz 1: Temel Altyapı (2-3 hafta)

- [ ] Proje kurulumu (React Native + TypeScript)
- [ ] Klasör yapısı oluşturma
- [ ] Navigasyon sistemi
- [ ] Redux store kurulumu
- [ ] SQLite veritabanı kurulumu ve şema
- [ ] Supabase entegrasyonu
- [ ] Temel UI bileşenleri

### Faz 2: Rehber Modülü (2-3 hafta)

- [ ] Kişi listesi ekranı
- [ ] Kişi detay ekranı
- [ ] Kişi ekleme/düzenleme
- [ ] Favoriler ekranı
- [ ] Arama ve filtreleme
- [ ] Alfabetik kaydırma
- [ ] Native contacts entegrasyonu

### Faz 3: Çağrı Modülü (3-4 hafta)

- [ ] Çağrı geçmişi ekranı
- [ ] Tuş takımı ekranı
- [ ] Gelen arama ekranı
- [ ] Giden arama ekranı
- [ ] Arama sırasında ekran
- [ ] CallKeep entegrasyonu
- [ ] Varsayılan uygulama kaydı

### Faz 4: Tema Sistemi (2-3 hafta)

- [ ] Tema context ve provider
- [ ] Varsayılan temalar (açık/koyu)
- [ ] Arama ekranı temaları
- [ ] Tema önizleme
- [ ] Tema özelleştirme
- [ ] Tema kaydetme/yükleme

### Faz 5: Tema Mağazası (2-3 hafta)

- [ ] Mağaza ekranı
- [ ] Tema detay sayfası
- [ ] İndirme sistemi
- [ ] Satın alma entegrasyonu
- [ ] Değerlendirme sistemi
- [ ] Supabase tema API

### Faz 6: Ayarlar ve Özelleştirme (2 hafta)

- [ ] Ayarlar ekranları
- [ ] Tercih yönetimi
- [ ] Engelli numaralar
- [ ] Senkronizasyon
- [ ] Yedekleme/geri yükleme

### Faz 7: Kimlik Doğrulama (1-2 hafta)

- [ ] Giriş ekranı
- [ ] Kayıt ekranı
- [ ] Profil yönetimi
- [ ] Supabase Auth entegrasyonu

### Faz 8: Test ve İyileştirme (2 hafta)

- [ ] Unit testler
- [ ] Integration testler
- [ ] Performans optimizasyonu
- [ ] Bug düzeltmeleri
- [ ] UI/UX iyileştirmeleri

---

## 9. Notlar ve Dikkat Edilecekler

### Android Özel Durumlar

1. **Android 10+**: Arka planda çağrı işlemleri için özel izinler gerekiyor
2. **Android 14+**: Tam ekran bildirimler için ek izin gerekiyor
3. **MIUI/OneUI**: Bazı üretici ROM'larında ek ayarlar gerekebilir

### Performans

1. Büyük rehberler (1000+ kişi) için sayfalama kullan
2. Kişi fotoğrafları için lazy loading uygula
3. Çağrı geçmişi için infinite scroll kullan
4. SQLite sorgularında index kullan

### Güvenlik

1. Hassas verileri şifrele
2. Supabase RLS (Row Level Security) kullan
3. API anahtarlarını güvenli sakla
4. Kullanıcı verilerini minimum düzeyde topla

---

*Bu doküman, proje geliştirme sürecinde güncellenecektir.*
