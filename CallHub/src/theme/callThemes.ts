/**
 * LifeCall - Arama Ekranı Tema Sistemi
 *
 * Kullanıcıların gelen arama ekranını özelleştirmesine olanak tanır:
 * - Arka plan: Renk, gradient, resim veya video
 * - Avatar stili: Yuvarlak, köşeli, boyut
 * - Cevaplama stili: iOS, Android, klasik
 * - Animasyonlar: Pulse, glow, bounce
 */

// ============================================================================
// TİP TANIMLARI
// ============================================================================

// Arka plan türleri
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video';

// Gradient yönleri
export type GradientDirection =
  | 'top-bottom'
  | 'bottom-top'
  | 'left-right'
  | 'right-left'
  | 'diagonal-tl'
  | 'diagonal-tr'
  | 'diagonal-bl'
  | 'diagonal-br'
  | 'radial';

// Arka plan yapılandırması
export interface CallThemeBackground {
  type: BackgroundType;
  // Solid renk
  color?: string;
  // Gradient
  gradientColors?: string[];
  gradientDirection?: GradientDirection;
  // Resim/Video
  uri?: string;
  localAsset?: string; // Yerel asset dosyası
  blur?: number; // 0-25
  overlay?: string; // Overlay rengi
  overlayOpacity?: number; // 0-1
}

// Avatar şekilleri
export type AvatarShape = 'circle' | 'rounded' | 'square';

// Avatar boyutları
export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

// Avatar halka stili
export type AvatarRingStyle = 'none' | 'solid' | 'pulse' | 'glow' | 'rainbow';

// Avatar yapılandırması
export interface CallThemeAvatar {
  shape: AvatarShape;
  size: AvatarSize;
  ringStyle: AvatarRingStyle;
  ringColor?: string; // null ise tema primary rengi
  ringWidth?: number; // 2-8
  showShadow?: boolean;
}

// Cevaplama stili türleri
export type AnswerStyleType = 'ios' | 'android' | 'classic' | 'floating' | 'minimal';

// Buton animasyonu türleri - 15 farklı animasyon
export type ButtonAnimation =
  | 'none'           // Animasyon yok
  | 'pulse'          // Nabız atışı - büyüyüp küçülme
  | 'glow'           // Parlama efekti - shadow animasyonu
  | 'bounce'         // Zıplama - yukarı aşağı hareket
  | 'shake'          // Titreşim - sağa sola hızlı hareket
  | 'ripple'         // Dalga efekti - merkeze dalga yayılması
  | 'rotate'         // 360 derece döndürme
  | 'swing'          // Saat sarkacı gibi sallanma
  | 'heartbeat'      // Kalp atışı - iki kez büyüyüp küçülme
  | 'jello'          // Jöle efekti - eğilip bükülen
  | 'rubberBand'     // Lastik efekti - esneyen
  | 'tada'           // Tada! - sallanma + büyüme
  | 'wobble'         // Wobble - yatay kayma + dönme
  | 'flash'          // Yanıp sönme
  | 'fadeInOut';     // Belirip kaybolma

// Cevaplama yapılandırması
export interface CallThemeAnswerStyle {
  type: AnswerStyleType;
  animation: ButtonAnimation;
  buttonShape?: 'circle' | 'rounded' | 'pill'; // iOS slider için geçerli değil
  buttonSize?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  hapticFeedback?: boolean;
}

// Renk şeması
export interface CallThemeColors {
  primary: string;      // Cevapla butonu
  danger: string;       // Reddet butonu
  text: string;         // Ana metin
  textMuted: string;    // İkincil metin
  surface: string;      // Kart/yüzey arka planı
  accent?: string;      // Vurgu rengi
}

// Animasyon ayarları
export interface CallThemeAnimations {
  backgroundAnimation?: 'none' | 'slow-zoom' | 'pan' | 'pulse';
  avatarAnimation?: 'none' | 'pulse' | 'glow' | 'float';
  incomingAnimation?: 'fade' | 'slide-up' | 'scale' | 'bounce';
}

// Tam CallTheme yapısı
export interface CallTheme {
  id: string;
  name: string;
  nameKey?: string; // i18n key
  description?: string;
  descriptionKey?: string;
  version: string;
  author?: string;

  // Görsel ayarlar
  background: CallThemeBackground;
  avatar: CallThemeAvatar;
  answerStyle: CallThemeAnswerStyle;
  colors: CallThemeColors;
  animations?: CallThemeAnimations;

  // Ek ayarlar
  showCallerInfo?: boolean;
  showCountryFlag?: boolean;
  showCompany?: boolean;
  showHdBadge?: boolean;

  // Meta
  isPremium?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  previewImage?: string;
}

// ============================================================================
// AVATAR BOYUT HARİTASI
// ============================================================================

export const AVATAR_SIZES: Record<AvatarSize, number> = {
  small: 80,
  medium: 100,
  large: 120,
  xlarge: 150,
};

export const AVATAR_RING_WIDTHS: Record<AvatarRingStyle, number> = {
  none: 0,
  solid: 3,
  pulse: 4,
  glow: 5,
  rainbow: 4,
};

// ============================================================================
// VARSAYILAN TEMALAR
// ============================================================================

// Varsayılan tema (Klasik)
export const DEFAULT_CALL_THEME: CallTheme = {
  id: 'default',
  name: 'Klasik',
  nameKey: 'callThemes.default',
  description: 'LifeCall varsayılan tema',
  descriptionKey: 'callThemes.defaultDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'solid',
    color: '#1A1A2E',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'pulse',
    ringWidth: 3,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'pulse',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#4CAF50',
    danger: '#F44336',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.7)',
    surface: 'rgba(255,255,255,0.1)',
  },
  animations: {
    avatarAnimation: 'pulse',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// iOS Tarzı Tema
export const IOS_STYLE_THEME: CallTheme = {
  id: 'ios-style',
  name: 'iOS Style',
  nameKey: 'callThemes.iosStyle',
  description: 'Apple iOS benzeri arama ekranı',
  descriptionKey: 'callThemes.iosStyleDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#1C1C1E', '#2C2C2E', '#3A3A3C'],
    gradientDirection: 'top-bottom',
  },
  avatar: {
    shape: 'circle',
    size: 'xlarge',
    ringStyle: 'none',
    showShadow: false,
  },
  answerStyle: {
    type: 'ios',
    animation: 'glow',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#30D158',
    danger: '#FF453A',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.6)',
    surface: 'rgba(255,255,255,0.08)',
  },
  animations: {
    avatarAnimation: 'none',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: false,
  showCompany: true,
  showHdBadge: false,
  isPremium: false,
  isCustom: false,
};

// Minimal Tema
export const MINIMAL_THEME: CallTheme = {
  id: 'minimal',
  name: 'Minimal',
  nameKey: 'callThemes.minimal',
  description: 'Sade ve temiz tasarım',
  descriptionKey: 'callThemes.minimalDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'solid',
    color: '#000000',
  },
  avatar: {
    shape: 'circle',
    size: 'medium',
    ringStyle: 'solid',
    ringColor: '#FFFFFF',
    ringWidth: 2,
    showShadow: false,
  },
  answerStyle: {
    type: 'minimal',
    animation: 'none',
    buttonShape: 'circle',
    buttonSize: 'medium',
    showLabels: false,
    hapticFeedback: true,
  },
  colors: {
    primary: '#FFFFFF',
    danger: '#FFFFFF',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.5)',
    surface: 'transparent',
  },
  animations: {
    avatarAnimation: 'none',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: false,
  showCompany: false,
  showHdBadge: false,
  isPremium: false,
  isCustom: false,
};

// Neon Tema
export const NEON_THEME: CallTheme = {
  id: 'neon',
  name: 'Neon Glow',
  nameKey: 'callThemes.neon',
  description: 'Parlayan neon efektleri',
  descriptionKey: 'callThemes.neonDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#0F0F23', '#1A1A3E', '#0F0F23'],
    gradientDirection: 'radial',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'glow',
    ringColor: '#00FFFF',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'floating',
    animation: 'glow',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#00FF88',
    danger: '#FF0066',
    text: '#FFFFFF',
    textMuted: '#00FFFF',
    surface: 'rgba(0,255,255,0.1)',
    accent: '#FF00FF',
  },
  animations: {
    backgroundAnimation: 'pulse',
    avatarAnimation: 'glow',
    incomingAnimation: 'scale',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Gradient Sunset Tema
export const SUNSET_THEME: CallTheme = {
  id: 'sunset',
  name: 'Sunset',
  nameKey: 'callThemes.sunset',
  description: 'Gün batımı renkleri',
  descriptionKey: 'callThemes.sunsetDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#FF6B6B', '#FEC89A', '#FFD93D', '#6BCB77'],
    gradientDirection: 'diagonal-tl',
    overlay: '#000000',
    overlayOpacity: 0.3,
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#FFFFFF',
    ringWidth: 3,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'bounce',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#6BCB77',
    danger: '#FF6B6B',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.8)',
    surface: 'rgba(255,255,255,0.15)',
  },
  animations: {
    backgroundAnimation: 'slow-zoom',
    avatarAnimation: 'float',
    incomingAnimation: 'slide-up',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Ocean Tema
export const OCEAN_THEME: CallTheme = {
  id: 'ocean',
  name: 'Ocean',
  nameKey: 'callThemes.ocean',
  description: 'Okyanus mavisi tonları',
  descriptionKey: 'callThemes.oceanDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'],
    gradientDirection: 'top-bottom',
    overlay: '#000000',
    overlayOpacity: 0.2,
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'pulse',
    ringColor: '#CAF0F8',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'classic',
    animation: 'ripple',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#00B4D8',
    danger: '#FF6B6B',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.8)',
    surface: 'rgba(255,255,255,0.15)',
  },
  animations: {
    backgroundAnimation: 'slow-zoom',
    avatarAnimation: 'pulse',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Dark Purple Tema
export const DARK_PURPLE_THEME: CallTheme = {
  id: 'dark-purple',
  name: 'Dark Purple',
  nameKey: 'callThemes.darkPurple',
  description: 'Karanlık mor tonları',
  descriptionKey: 'callThemes.darkPurpleDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#1A0033', '#2D0A4E', '#4A1A6B', '#2D0A4E', '#1A0033'],
    gradientDirection: 'radial',
  },
  avatar: {
    shape: 'rounded',
    size: 'large',
    ringStyle: 'rainbow',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'floating',
    animation: 'pulse',
    buttonShape: 'rounded',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#9B59B6',
    danger: '#E74C3C',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.7)',
    surface: 'rgba(155,89,182,0.2)',
    accent: '#E056FD',
  },
  animations: {
    avatarAnimation: 'glow',
    incomingAnimation: 'scale',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Nature Green Tema
export const NATURE_THEME: CallTheme = {
  id: 'nature',
  name: 'Nature',
  nameKey: 'callThemes.nature',
  description: 'Doğal yeşil tonları',
  descriptionKey: 'callThemes.natureDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#134E4A', '#1E7A6E', '#2A9D8F', '#40C9A2'],
    gradientDirection: 'diagonal-bl',
    overlay: '#000000',
    overlayOpacity: 0.15,
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#40C9A2',
    ringWidth: 3,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'bounce',
    buttonShape: 'pill',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#40C9A2',
    danger: '#E76F51',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.8)',
    surface: 'rgba(64,201,162,0.15)',
  },
  animations: {
    backgroundAnimation: 'pan',
    avatarAnimation: 'float',
    incomingAnimation: 'slide-up',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Galaxy Tema - Galaksi/Uzay teması
export const GALAXY_THEME: CallTheme = {
  id: 'galaxy',
  name: 'Galaxy',
  nameKey: 'callThemes.galaxy',
  description: 'Uzay ve galaksi teması',
  descriptionKey: 'callThemes.galaxyDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#0D0221', '#190A33', '#240B44', '#350055', '#0D0221'],
    gradientDirection: 'radial',
  },
  avatar: {
    shape: 'circle',
    size: 'xlarge',
    ringStyle: 'rainbow',
    ringWidth: 5,
    showShadow: true,
  },
  answerStyle: {
    type: 'floating',
    animation: 'heartbeat',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#A855F7',
    danger: '#EF4444',
    text: '#FFFFFF',
    textMuted: 'rgba(168,85,247,0.8)',
    surface: 'rgba(168,85,247,0.15)',
    accent: '#EC4899',
  },
  animations: {
    backgroundAnimation: 'slow-zoom',
    avatarAnimation: 'glow',
    incomingAnimation: 'scale',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Rose Gold Tema
export const ROSE_GOLD_THEME: CallTheme = {
  id: 'rose-gold',
  name: 'Rose Gold',
  nameKey: 'callThemes.roseGold',
  description: 'Zarif rose gold tonları',
  descriptionKey: 'callThemes.roseGoldDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#2D1F2F', '#4A3040', '#6B4054', '#8B5A68'],
    gradientDirection: 'diagonal-tr',
    overlay: '#000000',
    overlayOpacity: 0.2,
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#E8B4B8',
    ringWidth: 3,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'pulse',
    buttonShape: 'pill',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#E8B4B8',
    danger: '#D4726A',
    text: '#FFFFFF',
    textMuted: 'rgba(232,180,184,0.8)',
    surface: 'rgba(232,180,184,0.1)',
    accent: '#B76E79',
  },
  animations: {
    avatarAnimation: 'pulse',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Cyberpunk Tema
export const CYBERPUNK_THEME: CallTheme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  nameKey: 'callThemes.cyberpunk',
  description: 'Fütüristik cyberpunk stili',
  descriptionKey: 'callThemes.cyberpunkDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#0A0A0A', '#1A0A2E', '#16213E', '#0F3460'],
    gradientDirection: 'bottom-top',
  },
  avatar: {
    shape: 'square',
    size: 'large',
    ringStyle: 'glow',
    ringColor: '#F72585',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'floating',
    animation: 'jello',
    buttonShape: 'rounded',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#4CC9F0',
    danger: '#F72585',
    text: '#FFFFFF',
    textMuted: '#4CC9F0',
    surface: 'rgba(76,201,240,0.1)',
    accent: '#7209B7',
  },
  animations: {
    backgroundAnimation: 'pulse',
    avatarAnimation: 'glow',
    incomingAnimation: 'scale',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Aurora Tema - Kuzey Işıkları
export const AURORA_THEME: CallTheme = {
  id: 'aurora',
  name: 'Aurora',
  nameKey: 'callThemes.aurora',
  description: 'Kuzey ışıkları efekti',
  descriptionKey: 'callThemes.auroraDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#0F172A', '#164E63', '#0D9488', '#34D399', '#164E63', '#0F172A'],
    gradientDirection: 'top-bottom',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'pulse',
    ringColor: '#34D399',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'ios',
    animation: 'glow',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#34D399',
    danger: '#F87171',
    text: '#FFFFFF',
    textMuted: 'rgba(52,211,153,0.8)',
    surface: 'rgba(52,211,153,0.1)',
    accent: '#0D9488',
  },
  animations: {
    backgroundAnimation: 'slow-zoom',
    avatarAnimation: 'float',
    incomingAnimation: 'slide-up',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Midnight Blue Tema
export const MIDNIGHT_THEME: CallTheme = {
  id: 'midnight',
  name: 'Midnight',
  nameKey: 'callThemes.midnight',
  description: 'Gece mavisi tonları',
  descriptionKey: 'callThemes.midnightDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#020617', '#0F172A', '#1E293B', '#334155'],
    gradientDirection: 'top-bottom',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#60A5FA',
    ringWidth: 3,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'bounce',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#60A5FA',
    danger: '#F87171',
    text: '#FFFFFF',
    textMuted: 'rgba(148,163,184,0.9)',
    surface: 'rgba(96,165,250,0.1)',
    accent: '#3B82F6',
  },
  animations: {
    avatarAnimation: 'pulse',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Fire Tema - Ateş/Alev
export const FIRE_THEME: CallTheme = {
  id: 'fire',
  name: 'Fire',
  nameKey: 'callThemes.fire',
  description: 'Ateş ve alev efekti',
  descriptionKey: 'callThemes.fireDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#1A0000', '#3D0000', '#7B0000', '#B91C1C', '#DC2626'],
    gradientDirection: 'bottom-top',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'glow',
    ringColor: '#F97316',
    ringWidth: 5,
    showShadow: true,
  },
  answerStyle: {
    type: 'floating',
    animation: 'shake',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#22C55E',
    danger: '#EF4444',
    text: '#FFFFFF',
    textMuted: 'rgba(251,146,60,0.9)',
    surface: 'rgba(249,115,22,0.15)',
    accent: '#F97316',
  },
  animations: {
    backgroundAnimation: 'pulse',
    avatarAnimation: 'glow',
    incomingAnimation: 'scale',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Luxury Gold Tema
export const LUXURY_GOLD_THEME: CallTheme = {
  id: 'luxury-gold',
  name: 'Luxury Gold',
  nameKey: 'callThemes.luxuryGold',
  description: 'Lüks altın teması',
  descriptionKey: 'callThemes.luxuryGoldDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'gradient',
    gradientColors: ['#1C1C1C', '#2C2416', '#3D321E', '#4A3F28'],
    gradientDirection: 'radial',
    overlay: '#000000',
    overlayOpacity: 0.3,
  },
  avatar: {
    shape: 'rounded',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#D4AF37',
    ringWidth: 4,
    showShadow: true,
  },
  answerStyle: {
    type: 'android',
    animation: 'tada',
    buttonShape: 'rounded',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#D4AF37',
    danger: '#8B0000',
    text: '#FFFFFF',
    textMuted: 'rgba(212,175,55,0.8)',
    surface: 'rgba(212,175,55,0.1)',
    accent: '#FFD700',
  },
  animations: {
    avatarAnimation: 'glow',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// Pure White Tema - Minimalist beyaz
export const PURE_WHITE_THEME: CallTheme = {
  id: 'pure-white',
  name: 'Pure White',
  nameKey: 'callThemes.pureWhite',
  description: 'Minimalist beyaz tema',
  descriptionKey: 'callThemes.pureWhiteDesc',
  version: '1.0.0',
  author: 'Lifeos',

  background: {
    type: 'solid',
    color: '#FFFFFF',
  },
  avatar: {
    shape: 'circle',
    size: 'large',
    ringStyle: 'solid',
    ringColor: '#E5E7EB',
    ringWidth: 2,
    showShadow: true,
  },
  answerStyle: {
    type: 'minimal',
    animation: 'pulse',
    buttonShape: 'circle',
    buttonSize: 'large',
    showLabels: true,
    hapticFeedback: true,
  },
  colors: {
    primary: '#10B981',
    danger: '#EF4444',
    text: '#1F2937',
    textMuted: '#6B7280',
    surface: '#F3F4F6',
    accent: '#3B82F6',
  },
  animations: {
    avatarAnimation: 'none',
    incomingAnimation: 'fade',
  },
  showCallerInfo: true,
  showCountryFlag: true,
  showCompany: true,
  showHdBadge: true,
  isPremium: false,
  isCustom: false,
};

// ============================================================================
// TEMA LİSTESİ
// ============================================================================

export const DEFAULT_CALL_THEMES: CallTheme[] = [
  DEFAULT_CALL_THEME,
  IOS_STYLE_THEME,
  MINIMAL_THEME,
  NEON_THEME,
  SUNSET_THEME,
  OCEAN_THEME,
  DARK_PURPLE_THEME,
  NATURE_THEME,
  GALAXY_THEME,
  ROSE_GOLD_THEME,
  CYBERPUNK_THEME,
  AURORA_THEME,
  MIDNIGHT_THEME,
  FIRE_THEME,
  LUXURY_GOLD_THEME,
  PURE_WHITE_THEME,
];

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

/**
 * Tema ID'sine göre tema bul
 */
export const getCallThemeById = (id: string): CallTheme | undefined => {
  return DEFAULT_CALL_THEMES.find(theme => theme.id === id);
};

/**
 * Boş özel tema oluştur
 */
export const createCustomCallTheme = (baseTheme?: CallTheme): CallTheme => {
  const base = baseTheme || DEFAULT_CALL_THEME;
  return {
    ...base,
    id: `custom-${Date.now()}`,
    name: 'My Theme',
    nameKey: undefined,
    description: 'Custom theme',
    descriptionKey: undefined,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Gradient CSS string oluştur (React Native için değil, önizleme için)
 */
export const getGradientAngles = (direction: GradientDirection): { start: { x: number; y: number }; end: { x: number; y: number } } => {
  const angles: Record<GradientDirection, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
    'top-bottom': { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
    'bottom-top': { start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },
    'left-right': { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    'right-left': { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
    'diagonal-tl': { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
    'diagonal-tr': { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    'diagonal-bl': { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
    'diagonal-br': { start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },
    'radial': { start: { x: 0.5, y: 0.5 }, end: { x: 1, y: 1 } },
  };
  return angles[direction] || angles['top-bottom'];
};
