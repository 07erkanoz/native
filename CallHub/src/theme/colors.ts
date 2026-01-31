/**
 * LifeCall - Renk Paleti
 *
 * Tüm uygulama renkleri burada tanımlanır
 * Material Design 3 prensiplerine uygun
 */

// Ana renkler
export const PRIMARY = {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3', // Ana renk
  600: '#1E88E5',
  700: '#1976D2',
  800: '#1565C0',
  900: '#0D47A1',
};

export const SECONDARY = {
  50: '#E8F5E9',
  100: '#C8E6C9',
  200: '#A5D6A7',
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50', // Ana yeşil
  600: '#43A047',
  700: '#388E3C',
  800: '#2E7D32',
  900: '#1B5E20',
};

export const ACCENT = {
  50: '#FFF3E0',
  100: '#FFE0B2',
  200: '#FFCC80',
  300: '#FFB74D',
  400: '#FFA726',
  500: '#FF9800', // Turuncu
  600: '#FB8C00',
  700: '#F57C00',
  800: '#EF6C00',
  900: '#E65100',
};

// Semantik renkler
export const SEMANTIC = {
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',

  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',

  error: '#F44336',
  errorLight: '#E57373',
  errorDark: '#D32F2F',

  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
};

// Arama türü renkleri
export const CALL_COLORS = {
  incoming: '#4CAF50',   // Yeşil - gelen
  outgoing: '#2196F3',   // Mavi - giden
  missed: '#F44336',     // Kırmızı - cevapsız
  rejected: '#FF9800',   // Turuncu - reddedilen
  blocked: '#9E9E9E',    // Gri - engelli
};

// Hesap türü renkleri
export const ACCOUNT_COLORS = {
  google: '#4285F4',
  samsung: '#1428A0',
  phone: '#4CAF50',
  whatsapp: '#25D366',
  telegram: '#0088CC',
  microsoft: '#00A4EF',
  other: '#9E9E9E',
};

// Avatar arka plan renkleri (isim harflerine göre)
export const AVATAR_COLORS = [
  '#F44336', // Kırmızı
  '#E91E63', // Pembe
  '#9C27B0', // Mor
  '#673AB7', // Koyu Mor
  '#3F51B5', // İndigo
  '#2196F3', // Mavi
  '#03A9F4', // Açık Mavi
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Yeşil
  '#8BC34A', // Açık Yeşil
  '#CDDC39', // Lime
  '#FFC107', // Amber
  '#FF9800', // Turuncu
  '#FF5722', // Derin Turuncu
  '#795548', // Kahverengi
];

/**
 * İsimden avatar rengi hesapla
 * @param name İsim
 * @returns Renk kodu
 */
export const getAvatarColor = (name: string): string => {
  if (!name || name.length === 0) {
    return AVATAR_COLORS[0];
  }

  // İlk karakterin ASCII değerine göre renk seç
  const charCode = name.charCodeAt(0);
  const index = charCode % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * İsimden baş harfleri al
 * @param name İsim
 * @returns Baş harfler (en fazla 2)
 */
export const getInitials = (name: string): string => {
  if (!name || name.length === 0) {
    return '?';
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    // Tek kelime: ilk 2 karakter
    return words[0].substring(0, 2).toUpperCase();
  }

  // Birden fazla kelime: ilk iki kelimenin baş harfleri
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Nötr renkler
export const NEUTRAL = {
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
};

// Özel renkler
export const SPECIAL = {
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  ripple: 'rgba(0, 0, 0, 0.1)',
  rippleLight: 'rgba(255, 255, 255, 0.1)',

  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',

  divider: 'rgba(0, 0, 0, 0.12)',
  dividerDark: 'rgba(255, 255, 255, 0.12)',
};
