/**
 * LifeCall - Settings Slice
 *
 * Uygulama ayarları state yönetimi
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode, LanguageCode } from '../../types';

// Cevaplama stili
type AnswerStyle = 'asus' | 'iphone' | 'google' | 'samsung' | 'lifecall';

// İsim formatı
type NameFormat = 'firstNameFirst' | 'lastNameFirst';

// Sıralama
type SortOrder = 'firstName' | 'lastName';

// State tipi
interface SettingsState {
  // Görünüm
  theme: ThemeMode;
  language: LanguageCode;
  fontSize: number;

  // Kişiler
  nameFormat: NameFormat;
  sortOrder: SortOrder;
  formatPhoneNumbers: boolean;
  showAlphabet: boolean;
  showSeparators: boolean;
  hideWithoutNumber: boolean;
  defaultAccountId: string | null;

  // Aramalar
  answerStyle: AnswerStyle;
  photoLayoutFullscreen: boolean;
  proximityEnabled: boolean;
  vibrationEnabled: boolean;
  flashOnCall: boolean;

  // Otomatik tekrar arama
  autoRedialEnabled: boolean;
  autoRedialOnBusy: boolean;
  autoRedialOnNoAnswer: boolean;
  autoRedialInterval: number; // saniye
  autoRedialMaxAttempts: number;

  // Bildirimler
  missedCallNotification: boolean;
  notificationSound: boolean;
  notificationVibrate: boolean;

  // Yedekleme
  autoBackupEnabled: boolean;
  lastBackupTime: string | null;

  // Satın alımlar
  purchasedThemeId: string | null;
  purchasedRingtones: string[];
}

// Başlangıç state
const initialState: SettingsState = {
  // Görünüm
  theme: 'system',
  language: 'tr',
  fontSize: 16,

  // Kişiler
  nameFormat: 'firstNameFirst',
  sortOrder: 'firstName',
  formatPhoneNumbers: true,
  showAlphabet: true,
  showSeparators: true,
  hideWithoutNumber: false,
  defaultAccountId: null,

  // Aramalar
  answerStyle: 'lifecall',
  photoLayoutFullscreen: true,
  proximityEnabled: true,
  vibrationEnabled: true,
  flashOnCall: false,

  // Otomatik tekrar arama
  autoRedialEnabled: false,
  autoRedialOnBusy: true,
  autoRedialOnNoAnswer: false,
  autoRedialInterval: 10,
  autoRedialMaxAttempts: 5,

  // Bildirimler
  missedCallNotification: true,
  notificationSound: true,
  notificationVibrate: true,

  // Yedekleme
  autoBackupEnabled: false,
  lastBackupTime: null,

  // Satın alımlar
  purchasedThemeId: null,
  purchasedRingtones: [],
};

// Slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Görünüm
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.language = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },

    // Kişiler
    setNameFormat: (state, action: PayloadAction<NameFormat>) => {
      state.nameFormat = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload;
    },
    toggleFormatPhoneNumbers: (state) => {
      state.formatPhoneNumbers = !state.formatPhoneNumbers;
    },
    toggleShowAlphabet: (state) => {
      state.showAlphabet = !state.showAlphabet;
    },
    toggleShowSeparators: (state) => {
      state.showSeparators = !state.showSeparators;
    },
    toggleHideWithoutNumber: (state) => {
      state.hideWithoutNumber = !state.hideWithoutNumber;
    },
    setDefaultAccountId: (state, action: PayloadAction<string | null>) => {
      state.defaultAccountId = action.payload;
    },

    // Aramalar
    setAnswerStyle: (state, action: PayloadAction<AnswerStyle>) => {
      state.answerStyle = action.payload;
    },
    togglePhotoLayoutFullscreen: (state) => {
      state.photoLayoutFullscreen = !state.photoLayoutFullscreen;
    },
    toggleProximityEnabled: (state) => {
      state.proximityEnabled = !state.proximityEnabled;
    },
    toggleVibrationEnabled: (state) => {
      state.vibrationEnabled = !state.vibrationEnabled;
    },
    toggleFlashOnCall: (state) => {
      state.flashOnCall = !state.flashOnCall;
    },

    // Otomatik tekrar arama
    toggleAutoRedialEnabled: (state) => {
      state.autoRedialEnabled = !state.autoRedialEnabled;
    },
    setAutoRedialSettings: (
      state,
      action: PayloadAction<{
        onBusy?: boolean;
        onNoAnswer?: boolean;
        interval?: number;
        maxAttempts?: number;
      }>
    ) => {
      const { onBusy, onNoAnswer, interval, maxAttempts } = action.payload;
      if (onBusy !== undefined) state.autoRedialOnBusy = onBusy;
      if (onNoAnswer !== undefined) state.autoRedialOnNoAnswer = onNoAnswer;
      if (interval !== undefined) state.autoRedialInterval = interval;
      if (maxAttempts !== undefined) state.autoRedialMaxAttempts = maxAttempts;
    },

    // Bildirimler
    toggleMissedCallNotification: (state) => {
      state.missedCallNotification = !state.missedCallNotification;
    },
    toggleNotificationSound: (state) => {
      state.notificationSound = !state.notificationSound;
    },
    toggleNotificationVibrate: (state) => {
      state.notificationVibrate = !state.notificationVibrate;
    },

    // Yedekleme
    toggleAutoBackupEnabled: (state) => {
      state.autoBackupEnabled = !state.autoBackupEnabled;
    },
    setLastBackupTime: (state, action: PayloadAction<string>) => {
      state.lastBackupTime = action.payload;
    },

    // Satın alımlar
    setPurchasedTheme: (state, action: PayloadAction<string | null>) => {
      state.purchasedThemeId = action.payload;
    },
    addPurchasedRingtone: (state, action: PayloadAction<string>) => {
      if (!state.purchasedRingtones.includes(action.payload)) {
        state.purchasedRingtones.push(action.payload);
      }
    },

    // Tüm ayarları sıfırla
    resetSettings: () => initialState,
  },
});

export const {
  setTheme,
  setLanguage,
  setFontSize,
  setNameFormat,
  setSortOrder,
  toggleFormatPhoneNumbers,
  toggleShowAlphabet,
  toggleShowSeparators,
  toggleHideWithoutNumber,
  setDefaultAccountId,
  setAnswerStyle,
  togglePhotoLayoutFullscreen,
  toggleProximityEnabled,
  toggleVibrationEnabled,
  toggleFlashOnCall,
  toggleAutoRedialEnabled,
  setAutoRedialSettings,
  toggleMissedCallNotification,
  toggleNotificationSound,
  toggleNotificationVibrate,
  toggleAutoBackupEnabled,
  setLastBackupTime,
  setPurchasedTheme,
  addPurchasedRingtone,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
