/**
 * LifeCall - VoLTE/HD Voice Native Module
 *
 * Android'den VoLTE durumu ve HD ses bilgisi alır.
 * Aktif arama sırasında GERÇEK HD durumunu tespit eder.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { VoLTEModule: NativeVoLTE } = NativeModules;

// Event emitter
const voLTEEmitter = NativeVoLTE
  ? new NativeEventEmitter(NativeVoLTE)
  : null;

/**
 * VoLTE durum bilgisi
 */
export interface VoLTEStatus {
  /** Cihaz VoLTE destekliyor mu */
  isVolteSupported: boolean;
  /** VoLTE şu an etkin mi (IMS kayıtlı) */
  isVolteEnabled: boolean;
  /** HD Voice destekleniyor mu */
  isHdVoiceCapable: boolean;
  /** Mevcut ağ türü (LTE, 5G, 3G, vb.) */
  networkType: string;
  /** Tahmini HD arama durumu */
  isHdCall: boolean;
  /** Operatör adı */
  carrier: string;
  /** Roaming durumu */
  isRoaming: boolean;
}

/**
 * Aktif arama HD durumu
 */
export interface ActiveCallHdStatus {
  /** Aktif arama var mı */
  hasActiveCall: boolean;
  /** Arama HD kalitesinde mi (GERÇEK durum) */
  isHdAudio: boolean;
  /** Veri kaynağı: 'system' = gerçek, 'none' = arama yok */
  source: 'system' | 'none';
}

/**
 * Çağrı durumu değişiklik event'i
 */
export interface CallStateEvent {
  /** Çağrı durumu */
  state: 'new' | 'dialing' | 'ringing' | 'holding' | 'active' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
  /** HD ses aktif mi */
  isHdAudio: boolean;
  /** Telefon numarası */
  phoneNumber: string;
  /** VoLTE çağrısı mı */
  isVoLTE?: boolean;
  /** WiFi Calling mi */
  isWifiCall?: boolean;
  /** Video çağrısı mı */
  isVideoCall?: boolean;
  /** Konferans çağrısı mı */
  isConference?: boolean;
}

/**
 * HD ses değişiklik event'i
 */
export interface HdAudioEvent {
  /** HD ses aktif mi */
  isHdAudio: boolean;
  /** Telefon numarası */
  phoneNumber: string;
  /** Ses kalitesi: 'hd_wifi', 'hd', 'wifi', 'standard' */
  audioQuality: 'hd_wifi' | 'hd' | 'wifi' | 'standard' | 'unknown';
}

/**
 * VoLTE modülü mevcut mu kontrol et
 */
export const isAvailable = (): boolean => {
  return Platform.OS === 'android' && NativeVoLTE != null;
};

/**
 * VoLTE durumunu al
 *
 * Cihazın VoLTE desteği, ağ türü ve tahmini HD durumunu döndürür.
 */
export const getVoLTEStatus = async (): Promise<VoLTEStatus> => {
  if (!isAvailable()) {
    return {
      isVolteSupported: false,
      isVolteEnabled: false,
      isHdVoiceCapable: false,
      networkType: 'Unknown',
      isHdCall: false,
      carrier: 'Unknown',
      isRoaming: false,
    };
  }

  return NativeVoLTE.getVoLTEStatus();
};

/**
 * Mevcut aramanın HD durumunu kontrol et
 *
 * Aktif arama varsa GERÇEK HD durumunu döndürür.
 * Call.Details.PROPERTY_HIGH_DEF_AUDIO kullanır.
 */
export const isHdCall = async (): Promise<boolean> => {
  if (!isAvailable()) {
    return false;
  }

  return NativeVoLTE.isHdCall();
};

/**
 * Aktif aramanın detaylı HD durumunu al
 *
 * GERÇEK sistem verisini kullanır.
 */
export const getActiveCallHdStatus = async (): Promise<ActiveCallHdStatus> => {
  if (!isAvailable()) {
    return {
      hasActiveCall: false,
      isHdAudio: false,
      source: 'none',
    };
  }

  return NativeVoLTE.getActiveCallHdStatus();
};

/**
 * WiFi Calling aktif mi kontrol et
 */
export const isWifiCallingEnabled = async (): Promise<boolean> => {
  if (!isAvailable()) {
    return false;
  }

  return NativeVoLTE.isWifiCallingEnabled();
};

// ==========================================
// EVENT LISTENERS
// ==========================================

type CallStateCallback = (event: CallStateEvent) => void;
type HdAudioCallback = (event: HdAudioEvent) => void;

/**
 * Çağrı durumu değişikliklerini dinle
 */
export const addCallStateListener = (callback: CallStateCallback) => {
  if (!voLTEEmitter) return { remove: () => {} };
  return voLTEEmitter.addListener('onCallStateChanged', callback);
};

/**
 * HD ses durumu değişikliklerini dinle
 */
export const addHdAudioListener = (callback: HdAudioCallback) => {
  if (!voLTEEmitter) return { remove: () => {} };
  return voLTEEmitter.addListener('onHdAudioChanged', callback);
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * HD durumuna göre gösterilecek rozet metnini al
 */
export const getHdBadgeText = (status: ActiveCallHdStatus | HdAudioEvent): string | null => {
  if ('audioQuality' in status) {
    switch (status.audioQuality) {
      case 'hd_wifi':
        return 'HD WiFi';
      case 'hd':
        return 'HD';
      case 'wifi':
        return 'WiFi';
      default:
        return null;
    }
  }

  if (status.isHdAudio) {
    return 'HD';
  }

  return null;
};

/**
 * Ağ türüne göre ikon adını al
 */
export const getNetworkIcon = (networkType: string): string => {
  switch (networkType) {
    case '5G':
      return '5g';
    case 'LTE':
      return '4g';
    case '3G+':
    case '3G':
      return '3g';
    case '2G':
      return '2g';
    case 'WiFi':
      return 'wifi';
    default:
      return 'signal';
  }
};

// Default export
export default {
  isAvailable,
  getVoLTEStatus,
  isHdCall,
  getActiveCallHdStatus,
  isWifiCallingEnabled,
  addCallStateListener,
  addHdAudioListener,
  getHdBadgeText,
  getNetworkIcon,
};
