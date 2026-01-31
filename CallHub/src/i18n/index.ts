/**
 * LifeCall - i18n Çoklu Dil Sistemi
 *
 * Özellikler:
 * - Uygulama ilk açılışta cihaz dilini otomatik tespit eder
 * - Kullanıcı ayarlardan dili değiştirebilir
 * - Seçilen dil AsyncStorage'da saklanır
 * - 7 dil desteği: TR, EN, DE, FR, ES, AR, RU
 * - RTL (Arapça) desteği
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Dil dosyaları
import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = {
  tr: { name: 'Türkçe', nativeName: 'Türkçe', rtl: false },
  en: { name: 'English', nativeName: 'English', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Kaynak dosyaları
const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  ar: { translation: ar },
  ru: { translation: ru },
};

// AsyncStorage key
const LANGUAGE_STORAGE_KEY = '@lifecall_language';

// Varsayılan dil (dil tespit edilemezse)
const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * Cihaz dilini tespit et
 * @returns Desteklenen bir dil kodu veya varsayılan dil
 */
export const getDeviceLanguage = (): LanguageCode => {
  try {
    const locales = getLocales();

    if (locales && locales.length > 0) {
      // Önce tam eşleşme ara (tr, en, de, etc.)
      for (const locale of locales) {
        const langCode = locale.languageCode.toLowerCase() as LanguageCode;
        if (SUPPORTED_LANGUAGES[langCode]) {
          return langCode;
        }
      }
    }
  } catch (error) {
    console.warn('Cihaz dili tespit edilemedi:', error);
  }

  return DEFAULT_LANGUAGE;
};

/**
 * Kaydedilmiş dili al
 * @returns Kaydedilmiş dil kodu veya null
 */
export const getSavedLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang && SUPPORTED_LANGUAGES[savedLang as LanguageCode]) {
      return savedLang as LanguageCode;
    }
  } catch (error) {
    console.warn('Kaydedilmiş dil alınamadı:', error);
  }
  return null;
};

/**
 * Dili kaydet
 * @param languageCode Dil kodu
 */
export const saveLanguage = async (languageCode: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Dil kaydedilemedi:', error);
  }
};

/**
 * Dili değiştir
 * @param languageCode Yeni dil kodu
 */
export const changeLanguage = async (languageCode: LanguageCode): Promise<void> => {
  // Dili değiştir
  await i18n.changeLanguage(languageCode);

  // Dili kaydet
  await saveLanguage(languageCode);

  // RTL ayarını güncelle
  const isRTL = SUPPORTED_LANGUAGES[languageCode].rtl;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Not: RTL değişikliği için uygulama yeniden başlatılmalı
    // Bu, kullanıcıya bildirilmeli
  }
};

/**
 * Mevcut dili al
 * @returns Mevcut dil kodu
 */
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

/**
 * Dilin RTL olup olmadığını kontrol et
 * @param languageCode Dil kodu
 * @returns RTL ise true
 */
export const isRTL = (languageCode?: LanguageCode): boolean => {
  const code = languageCode || getCurrentLanguage();
  return SUPPORTED_LANGUAGES[code]?.rtl || false;
};

/**
 * Tüm desteklenen dilleri al
 * @returns Dil listesi
 */
export const getAllLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code: code as LanguageCode,
    ...info,
  }));
};

/**
 * i18n'i başlat
 * İlk açılışta: Cihaz dilini kullan
 * Sonraki açılışlarda: Kaydedilmiş dili kullan
 */
export const initI18n = async (): Promise<void> => {
  // Önce kaydedilmiş dili kontrol et
  let initialLanguage = await getSavedLanguage();

  // Kaydedilmiş dil yoksa cihaz dilini kullan (ilk açılış)
  if (!initialLanguage) {
    initialLanguage = getDeviceLanguage();
    // İlk tespit edilen dili kaydet
    await saveLanguage(initialLanguage);
  }

  // RTL ayarını uygula
  const languageInfo = SUPPORTED_LANGUAGES[initialLanguage];
  if (languageInfo.rtl !== I18nManager.isRTL) {
    I18nManager.allowRTL(languageInfo.rtl);
    I18nManager.forceRTL(languageInfo.rtl);
  }

  // i18n'i yapılandır
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,

      interpolation: {
        escapeValue: false, // React zaten XSS koruması sağlıyor
      },

      react: {
        useSuspense: false, // AsyncStorage ile uyumluluk için
      },

      // Çevirisi bulunamayan anahtarlar için
      returnEmptyString: false,
      returnNull: false,

      // Debug modu (geliştirme için)
      debug: __DEV__,
    });
};

// i18n instance'ını export et
export default i18n;
