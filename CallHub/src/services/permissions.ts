/**
 * LifeCall - İzin Yönetim Servisi
 *
 * Android ve iOS izinlerini yönetir
 * - Kişiler (READ_CONTACTS, WRITE_CONTACTS)
 * - Telefon (READ_PHONE_STATE, CALL_PHONE, READ_CALL_LOG)
 * - Kamera
 * - Mikrofon
 * - Takvim
 * - Depolama
 * - Bildirimler
 */

import { Platform, Alert, Linking } from 'react-native';
import {
  check,
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
  openSettings,
} from 'react-native-permissions';

// İzin türleri
export type PermissionType =
  | 'contacts'
  | 'phone'
  | 'callLog'
  | 'camera'
  | 'microphone'
  | 'calendar'
  | 'storage'
  | 'notifications'
  | 'overlay'
  | 'fullScreenIntent';

// İzin durumu
export interface PermissionState {
  granted: boolean;
  canAsk: boolean;
  status: PermissionStatus;
}

// Platform'a göre izin mapping
const getPermission = (type: PermissionType): Permission | null => {
  if (Platform.OS === 'android') {
    switch (type) {
      case 'contacts':
        return PERMISSIONS.ANDROID.READ_CONTACTS;
      case 'phone':
        return PERMISSIONS.ANDROID.CALL_PHONE;
      case 'callLog':
        return PERMISSIONS.ANDROID.READ_CALL_LOG;
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA;
      case 'microphone':
        return PERMISSIONS.ANDROID.RECORD_AUDIO;
      case 'calendar':
        return PERMISSIONS.ANDROID.READ_CALENDAR;
      case 'storage':
        return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      case 'notifications':
        return PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
      default:
        return null;
    }
  } else {
    // iOS
    switch (type) {
      case 'contacts':
        return PERMISSIONS.IOS.CONTACTS;
      case 'camera':
        return PERMISSIONS.IOS.CAMERA;
      case 'microphone':
        return PERMISSIONS.IOS.MICROPHONE;
      case 'calendar':
        return PERMISSIONS.IOS.CALENDARS;
      case 'storage':
        return PERMISSIONS.IOS.PHOTO_LIBRARY;
      default:
        return null;
    }
  }
};

// Android için çoklu izinler
const getAndroidPermissions = (type: PermissionType): Permission[] => {
  switch (type) {
    case 'contacts':
      return [
        PERMISSIONS.ANDROID.READ_CONTACTS,
        PERMISSIONS.ANDROID.WRITE_CONTACTS,
      ];
    case 'phone':
      return [
        PERMISSIONS.ANDROID.CALL_PHONE,
        PERMISSIONS.ANDROID.READ_PHONE_STATE,
        PERMISSIONS.ANDROID.READ_PHONE_NUMBERS,
      ];
    case 'callLog':
      return [
        PERMISSIONS.ANDROID.READ_CALL_LOG,
        PERMISSIONS.ANDROID.WRITE_CALL_LOG,
      ];
    case 'calendar':
      return [
        PERMISSIONS.ANDROID.READ_CALENDAR,
        PERMISSIONS.ANDROID.WRITE_CALENDAR,
      ];
    case 'storage':
      return [
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ];
    default:
      const single = getPermission(type);
      return single ? [single] : [];
  }
};

/**
 * İzin durumunu kontrol et
 */
export const checkPermission = async (
  type: PermissionType
): Promise<PermissionState> => {
  const permission = getPermission(type);

  if (!permission) {
    // Platform bu izni desteklemiyor
    return { granted: true, canAsk: false, status: RESULTS.GRANTED };
  }

  try {
    const status = await check(permission);

    return {
      granted: status === RESULTS.GRANTED,
      canAsk: status !== RESULTS.BLOCKED,
      status,
    };
  } catch (error) {
    console.error('İzin kontrolü hatası:', error);
    return { granted: false, canAsk: true, status: RESULTS.DENIED };
  }
};

/**
 * İzin iste
 */
export const requestPermission = async (
  type: PermissionType
): Promise<PermissionState> => {
  if (Platform.OS === 'android') {
    // Android için çoklu izin iste
    const permissions = getAndroidPermissions(type);

    if (permissions.length === 0) {
      return { granted: true, canAsk: false, status: RESULTS.GRANTED };
    }

    try {
      const statuses = await requestMultiple(permissions);

      // Tüm izinler verilmiş mi kontrol et
      const allGranted = Object.values(statuses).every(
        (status) => status === RESULTS.GRANTED
      );

      const anyBlocked = Object.values(statuses).some(
        (status) => status === RESULTS.BLOCKED
      );

      return {
        granted: allGranted,
        canAsk: !anyBlocked,
        status: allGranted ? RESULTS.GRANTED : RESULTS.DENIED,
      };
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return { granted: false, canAsk: true, status: RESULTS.DENIED };
    }
  } else {
    // iOS
    const permission = getPermission(type);

    if (!permission) {
      return { granted: true, canAsk: false, status: RESULTS.GRANTED };
    }

    try {
      const status = await request(permission);

      return {
        granted: status === RESULTS.GRANTED,
        canAsk: status !== RESULTS.BLOCKED,
        status,
      };
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return { granted: false, canAsk: true, status: RESULTS.DENIED };
    }
  }
};

/**
 * Gerekli tüm izinleri kontrol et
 */
export const checkAllPermissions = async (): Promise<
  Record<PermissionType, PermissionState>
> => {
  const types: PermissionType[] = [
    'contacts',
    'phone',
    'callLog',
    'camera',
    'microphone',
    'calendar',
    'notifications',
  ];

  const results: Partial<Record<PermissionType, PermissionState>> = {};

  for (const type of types) {
    results[type] = await checkPermission(type);
  }

  return results as Record<PermissionType, PermissionState>;
};

/**
 * Ayarlara yönlendir
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    await openSettings();
  } catch (error) {
    console.error('Ayarlar açılamadı:', error);
    // Fallback
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  }
};

/**
 * İzin reddedildiğinde kullanıcıya bilgi ver
 */
export const showPermissionDeniedAlert = (
  type: PermissionType,
  t: (key: string) => string
): void => {
  const messages: Record<PermissionType, string> = {
    contacts: t('permissions.contacts'),
    phone: t('permissions.phone'),
    callLog: t('permissions.phone'),
    camera: t('permissions.camera'),
    microphone: t('permissions.microphone'),
    calendar: t('permissions.calendar'),
    storage: t('permissions.storage'),
    notifications: t('permissions.notifications'),
  };

  Alert.alert(
    t('common.error'),
    messages[type],
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('permissions.openSettings'),
        onPress: openAppSettings,
      },
    ],
    { cancelable: true }
  );
};

/**
 * İzin iste ve sonucu işle
 */
export const ensurePermission = async (
  type: PermissionType,
  t?: (key: string) => string
): Promise<boolean> => {
  // Önce mevcut durumu kontrol et
  let state = await checkPermission(type);

  if (state.granted) {
    return true;
  }

  // İzin istenemiyorsa (blocked)
  if (!state.canAsk) {
    if (t) {
      showPermissionDeniedAlert(type, t);
    }
    return false;
  }

  // İzin iste
  state = await requestPermission(type);

  if (!state.granted && t && !state.canAsk) {
    showPermissionDeniedAlert(type, t);
  }

  return state.granted;
};

/**
 * Overlay (SYSTEM_ALERT_WINDOW) izni kontrolü
 * Bu özel izin için Native Module kullanılır
 */
export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const { NativeModules } = require('react-native');
    const { PermissionsModule } = NativeModules;
    if (PermissionsModule?.canDrawOverlays) {
      return await PermissionsModule.canDrawOverlays();
    }
    return false;
  } catch (error) {
    console.error('Overlay izni kontrolü hatası:', error);
    return false;
  }
};

/**
 * Overlay izni iste (Ayarlara yönlendir)
 */
export const requestOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const { NativeModules } = require('react-native');
    const { PermissionsModule } = NativeModules;
    if (PermissionsModule?.requestOverlayPermission) {
      return await PermissionsModule.requestOverlayPermission();
    }
    // Fallback: Ayarlara yönlendir
    await Linking.openSettings();
    return false;
  } catch (error) {
    console.error('Overlay izni isteme hatası:', error);
    return false;
  }
};

/**
 * Full-screen intent izni kontrolü
 */
export const checkFullScreenIntentPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const { NativeModules } = require('react-native');
    const { PermissionsModule } = NativeModules;
    if (PermissionsModule?.canUseFullScreenIntent) {
      return await PermissionsModule.canUseFullScreenIntent();
    }
    // Android 11+ için gerekli, daha düşük sürümlerde otomatik verilir
    return true;
  } catch (error) {
    console.error('Full-screen intent izni kontrolü hatası:', error);
    return true;
  }
};

/**
 * Full-screen intent izni iste
 */
export const requestFullScreenIntentPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const { NativeModules } = require('react-native');
    const { PermissionsModule } = NativeModules;
    if (PermissionsModule?.requestFullScreenIntentPermission) {
      return await PermissionsModule.requestFullScreenIntentPermission();
    }
    return true;
  } catch (error) {
    console.error('Full-screen intent izni isteme hatası:', error);
    return true;
  }
};

/**
 * Tüm telefon uygulaması izinlerini kontrol et
 */
export const checkPhoneAppPermissions = async (): Promise<{
  phone: boolean;
  callLog: boolean;
  contacts: boolean;
  overlay: boolean;
  fullScreenIntent: boolean;
}> => {
  const [phone, callLog, contacts, overlay, fullScreenIntent] = await Promise.all([
    checkPermission('phone'),
    checkPermission('callLog'),
    checkPermission('contacts'),
    checkOverlayPermission(),
    checkFullScreenIntentPermission(),
  ]);

  return {
    phone: phone.granted,
    callLog: callLog.granted,
    contacts: contacts.granted,
    overlay,
    fullScreenIntent,
  };
};

export default {
  checkPermission,
  requestPermission,
  checkAllPermissions,
  openAppSettings,
  showPermissionDeniedAlert,
  ensurePermission,
  checkOverlayPermission,
  requestOverlayPermission,
  checkFullScreenIntentPermission,
  requestFullScreenIntentPermission,
  checkPhoneAppPermissions,
};
