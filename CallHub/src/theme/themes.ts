/**
 * LifeCall - Tema Tanımları
 *
 * Light ve Dark tema tanımları
 * React Native Paper ile uyumlu
 */

import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { PRIMARY, SECONDARY, SEMANTIC, NEUTRAL, SPECIAL, ACCENT } from './colors';

// Font yapılandırması
const fontConfig = {
  fontFamily: 'System',
};

// Light tema
export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),

  colors: {
    ...MD3LightTheme.colors,

    // Ana renkler
    primary: PRIMARY[500],
    primaryContainer: PRIMARY[100],
    onPrimary: NEUTRAL.white,
    onPrimaryContainer: PRIMARY[900],

    // İkincil renkler
    secondary: SECONDARY[500],
    secondaryContainer: SECONDARY[100],
    onSecondary: NEUTRAL.white,
    onSecondaryContainer: SECONDARY[900],

    // Accent
    tertiary: ACCENT[500],
    tertiaryContainer: ACCENT[100],
    onTertiary: NEUTRAL.white,
    onTertiaryContainer: ACCENT[900],

    // Arka planlar
    background: NEUTRAL.gray50,
    surface: NEUTRAL.white,
    surfaceVariant: NEUTRAL.gray100,
    onBackground: NEUTRAL.gray900,
    onSurface: NEUTRAL.gray900,
    onSurfaceVariant: NEUTRAL.gray700,

    // Hata
    error: SEMANTIC.error,
    errorContainer: '#FFCDD2',
    onError: NEUTRAL.white,
    onErrorContainer: SEMANTIC.errorDark,

    // Outline ve divider
    outline: NEUTRAL.gray400,
    outlineVariant: NEUTRAL.gray300,

    // Özel renkler
    shadow: SPECIAL.shadow,
    inverseSurface: NEUTRAL.gray800,
    inverseOnSurface: NEUTRAL.gray100,
    inversePrimary: PRIMARY[200],

    // Özel LifeCall renkleri
    success: SEMANTIC.success,
    warning: SEMANTIC.warning,
    info: SEMANTIC.info,

    // Kart ve liste
    card: NEUTRAL.white,
    cardBorder: NEUTRAL.gray200,

    // Tab bar
    tabBar: NEUTRAL.white,
    tabBarActive: PRIMARY[500],
    tabBarInactive: NEUTRAL.gray500,

    // Header
    header: PRIMARY[500],
    headerText: NEUTRAL.white,

    // Input
    inputBackground: NEUTRAL.gray100,
    inputBorder: NEUTRAL.gray300,
    inputText: NEUTRAL.gray900,
    inputPlaceholder: NEUTRAL.gray500,

    // Arama ekranı
    callBackground: NEUTRAL.gray900,
    callPrimary: SEMANTIC.success,
    callDanger: SEMANTIC.error,

    // Avatar
    avatarText: NEUTRAL.white,

    // Divider
    divider: SPECIAL.divider,

    // Overlay
    overlay: SPECIAL.overlay,

    // Ripple efekti
    ripple: SPECIAL.ripple,
  },

  // Gölge stilleri
  shadows: {
    small: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    large: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  // Border radius değerleri
  roundness: 12,

  // Spacing değerleri
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Animasyon süreleri
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Dark tema
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),

  colors: {
    ...MD3DarkTheme.colors,

    // Ana renkler
    primary: PRIMARY[300],
    primaryContainer: PRIMARY[800],
    onPrimary: PRIMARY[900],
    onPrimaryContainer: PRIMARY[100],

    // İkincil renkler
    secondary: SECONDARY[300],
    secondaryContainer: SECONDARY[800],
    onSecondary: SECONDARY[900],
    onSecondaryContainer: SECONDARY[100],

    // Accent
    tertiary: ACCENT[300],
    tertiaryContainer: ACCENT[800],
    onTertiary: ACCENT[900],
    onTertiaryContainer: ACCENT[100],

    // Arka planlar
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onBackground: NEUTRAL.gray100,
    onSurface: NEUTRAL.gray100,
    onSurfaceVariant: NEUTRAL.gray400,

    // Hata
    error: SEMANTIC.errorLight,
    errorContainer: '#5C1A1A',
    onError: SEMANTIC.errorDark,
    onErrorContainer: SEMANTIC.errorLight,

    // Outline ve divider
    outline: NEUTRAL.gray600,
    outlineVariant: NEUTRAL.gray700,

    // Özel renkler
    shadow: SPECIAL.shadow,
    inverseSurface: NEUTRAL.gray200,
    inverseOnSurface: NEUTRAL.gray800,
    inversePrimary: PRIMARY[700],

    // Özel LifeCall renkleri
    success: SEMANTIC.successLight,
    warning: SEMANTIC.warningLight,
    info: SEMANTIC.infoLight,

    // Kart ve liste
    card: '#1E1E1E',
    cardBorder: NEUTRAL.gray800,

    // Tab bar
    tabBar: '#1E1E1E',
    tabBarActive: PRIMARY[300],
    tabBarInactive: NEUTRAL.gray500,

    // Header
    header: '#1E1E1E',
    headerText: NEUTRAL.gray100,

    // Input
    inputBackground: '#2C2C2C',
    inputBorder: NEUTRAL.gray700,
    inputText: NEUTRAL.gray100,
    inputPlaceholder: NEUTRAL.gray500,

    // Arama ekranı
    callBackground: NEUTRAL.black,
    callPrimary: SEMANTIC.successLight,
    callDanger: SEMANTIC.errorLight,

    // Avatar
    avatarText: NEUTRAL.white,

    // Divider
    divider: SPECIAL.dividerDark,

    // Overlay
    overlay: SPECIAL.overlayDark,

    // Ripple efekti
    ripple: SPECIAL.rippleLight,
  },

  // Gölge stilleri (dark için daha az belirgin)
  shadows: {
    small: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 2.62,
      elevation: 4,
    },
    large: {
      shadowColor: NEUTRAL.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  roundness: 12,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Tema tipi
export type AppTheme = typeof lightTheme;

// Tema modu
export type ThemeMode = 'light' | 'dark' | 'system';
