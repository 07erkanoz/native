/**
 * LifeCall - Varsayılan Uygulama Servisi
 *
 * Android'de varsayılan telefon ve rehber uygulaması olarak kayıt
 * - Varsayılan arama uygulaması (Dialer)
 * - Varsayılan kişiler uygulaması
 * - Gelen arama intent'lerini yönetme
 *
 * Not: Bu servis native modül gerektirir (Android)
 */

import { Platform, NativeModules, NativeEventEmitter, Linking } from 'react-native';

// Native modül tipi
interface DefaultAppModule {
  // Varsayılan uygulama kontrolleri
  isDefaultDialer: () => Promise<boolean>;
  isDefaultContactsApp: () => Promise<boolean>;

  // Varsayılan uygulama istekleri
  requestDefaultDialer: () => Promise<boolean>;
  requestDefaultContactsApp: () => Promise<boolean>;

  // PhoneAccount kaydı (Telecom Manager)
  registerPhoneAccount: () => Promise<boolean>;
  unregisterPhoneAccount: () => Promise<void>;
  isPhoneAccountRegistered: () => Promise<boolean>;

  // Arama işlemleri
  makeCall: (phoneNumber: string) => Promise<void>;
  endCall: () => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
}

// Gelen arama event tipi
export interface IncomingCallEvent {
  phoneNumber: string;
  callerName?: string;
  contactId?: string;
  photoUri?: string;
  isBlocked?: boolean;
}

// Arama durumu event tipi
export interface CallStateEvent {
  state: 'ringing' | 'offhook' | 'idle' | 'connecting' | 'active' | 'disconnected';
  phoneNumber?: string;
  duration?: number;
}

// Native modül
const DefaultAppNativeModule: DefaultAppModule | null =
  Platform.OS === 'android' ? NativeModules.DefaultAppModule : null;

// Event emitter
let eventEmitter: NativeEventEmitter | null = null;

/**
 * Event emitter'ı başlat
 */
const getEventEmitter = (): NativeEventEmitter | null => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) return null;

  if (!eventEmitter) {
    eventEmitter = new NativeEventEmitter(NativeModules.DefaultAppModule);
  }

  return eventEmitter;
};

/**
 * Varsayılan arama uygulaması mı kontrol et
 */
export const isDefaultDialer = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.isDefaultDialer();
  } catch (error) {
    console.error('Varsayılan arama uygulaması kontrolü hatası:', error);
    return false;
  }
};

/**
 * Varsayılan kişiler uygulaması mı kontrol et
 */
export const isDefaultContactsApp = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.isDefaultContactsApp();
  } catch (error) {
    console.error('Varsayılan kişiler uygulaması kontrolü hatası:', error);
    return false;
  }
};

/**
 * Varsayılan arama uygulaması olarak kayıt iste
 */
export const requestDefaultDialer = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.requestDefaultDialer();
  } catch (error) {
    console.error('Varsayılan arama uygulaması isteği hatası:', error);
    return false;
  }
};

/**
 * Varsayılan kişiler uygulaması olarak kayıt iste
 */
export const requestDefaultContactsApp = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.requestDefaultContactsApp();
  } catch (error) {
    console.error('Varsayılan kişiler uygulaması isteği hatası:', error);
    return false;
  }
};

/**
 * PhoneAccount'u kaydet (Telecom Manager)
 */
export const registerPhoneAccount = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.registerPhoneAccount();
  } catch (error) {
    console.error('PhoneAccount kaydı hatası:', error);
    return false;
  }
};

/**
 * PhoneAccount'u kaldır
 */
export const unregisterPhoneAccount = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return;
  }

  try {
    await DefaultAppNativeModule.unregisterPhoneAccount();
  } catch (error) {
    console.error('PhoneAccount kaldırma hatası:', error);
  }
};

/**
 * PhoneAccount kayıtlı mı kontrol et
 */
export const isPhoneAccountRegistered = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return false;
  }

  try {
    return await DefaultAppNativeModule.isPhoneAccountRegistered();
  } catch (error) {
    console.error('PhoneAccount kontrol hatası:', error);
    return false;
  }
};

/**
 * Arama yap
 */
export const makeCall = async (phoneNumber: string): Promise<void> => {
  if (!phoneNumber) {
    throw new Error('Telefon numarası gerekli');
  }

  // Numarayı temizle
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');

  if (Platform.OS === 'android' && DefaultAppNativeModule) {
    try {
      await DefaultAppNativeModule.makeCall(cleanNumber);
    } catch (error) {
      console.error('Arama hatası:', error);
      // Fallback: tel: URL kullan
      await Linking.openURL(`tel:${cleanNumber}`);
    }
  } else {
    // iOS veya fallback
    await Linking.openURL(`tel:${cleanNumber}`);
  }
};

/**
 * Aramayı sonlandır
 */
export const endCall = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return;
  }

  try {
    await DefaultAppNativeModule.endCall();
  } catch (error) {
    console.error('Arama sonlandırma hatası:', error);
  }
};

/**
 * Aramayı yanıtla
 */
export const answerCall = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return;
  }

  try {
    await DefaultAppNativeModule.answerCall();
  } catch (error) {
    console.error('Arama yanıtlama hatası:', error);
  }
};

/**
 * Aramayı reddet
 */
export const rejectCall = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !DefaultAppNativeModule) {
    return;
  }

  try {
    await DefaultAppNativeModule.rejectCall();
  } catch (error) {
    console.error('Arama reddetme hatası:', error);
  }
};

/**
 * Gelen arama eventini dinle
 */
export const addIncomingCallListener = (
  callback: (event: IncomingCallEvent) => void
): (() => void) => {
  const emitter = getEventEmitter();
  if (!emitter) {
    return () => {};
  }

  const subscription = emitter.addListener('onIncomingCall', callback);
  return () => subscription.remove();
};

/**
 * Arama durumu değişikliğini dinle
 */
export const addCallStateListener = (
  callback: (event: CallStateEvent) => void
): (() => void) => {
  const emitter = getEventEmitter();
  if (!emitter) {
    return () => {};
  }

  const subscription = emitter.addListener('onCallStateChanged', callback);
  return () => subscription.remove();
};

/**
 * Dialed number eventini dinle (başka uygulamadan gelen numara)
 */
export const addDialedNumberListener = (
  callback: (phoneNumber: string) => void
): (() => void) => {
  const emitter = getEventEmitter();
  if (!emitter) {
    return () => {};
  }

  const subscription = emitter.addListener('onDialedNumber', (event) => {
    callback(event.phoneNumber);
  });
  return () => subscription.remove();
};

/**
 * Varsayılan uygulama durumunu kontrol et
 */
export const checkDefaultAppStatus = async (): Promise<{
  isDefaultDialer: boolean;
  isDefaultContacts: boolean;
  isPhoneAccountRegistered: boolean;
}> => {
  const [dialer, contacts, phoneAccount] = await Promise.all([
    isDefaultDialer(),
    isDefaultContactsApp(),
    isPhoneAccountRegistered(),
  ]);

  return {
    isDefaultDialer: dialer,
    isDefaultContacts: contacts,
    isPhoneAccountRegistered: phoneAccount,
  };
};

/**
 * Uygulamayı varsayılan olarak ayarla (tüm roller için)
 */
export const setupAsDefaultApp = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    // 1. PhoneAccount'u kaydet
    const phoneAccountRegistered = await registerPhoneAccount();
    if (!phoneAccountRegistered) {
      console.warn('PhoneAccount kaydedilemedi');
    }

    // 2. Varsayılan arama uygulaması olarak kayıt iste
    const dialerSet = await requestDefaultDialer();

    return dialerSet;
  } catch (error) {
    console.error('Varsayılan uygulama ayarlama hatası:', error);
    return false;
  }
};

export default {
  isDefaultDialer,
  isDefaultContactsApp,
  requestDefaultDialer,
  requestDefaultContactsApp,
  registerPhoneAccount,
  unregisterPhoneAccount,
  isPhoneAccountRegistered,
  makeCall,
  endCall,
  answerCall,
  rejectCall,
  addIncomingCallListener,
  addCallStateListener,
  addDialedNumberListener,
  checkDefaultAppStatus,
  setupAsDefaultApp,
};
