/**
 * LifeCall - Native Call Module
 *
 * Android native çağrı modülü ile iletişim sağlar.
 * - Gelen/giden arama yönetimi
 * - Event dinleme
 * - Arama cevaplama/reddetme
 */

import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';

const { CallModule } = NativeModules;

// Event emitter
const callEventEmitter = CallModule ? new NativeEventEmitter(CallModule) : null;

// Event tipleri
export interface IncomingCallEvent {
  phoneNumber: string;
  callerName: string;
  photoUri: string;
  timestamp: number;
}

export interface CallAnsweredEvent {
  phoneNumber: string;
  timestamp: number;
}

export interface CallEndedEvent {
  phoneNumber: string;
  reason: 'ended' | 'declined' | 'missed' | 'failed';
  timestamp: number;
}

export interface CallState {
  state: 'idle' | 'ringing' | 'active';
}

// Event listener tipleri
type IncomingCallListener = (event: IncomingCallEvent) => void;
type CallAnsweredListener = (event: CallAnsweredEvent) => void;
type CallEndedListener = (event: CallEndedEvent) => void;

/**
 * Native CallModule API
 */
class NativeCallModule {
  private isAndroid = Platform.OS === 'android';

  /**
   * Aramayı cevapla
   */
  async answerCall(callId: string): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      console.warn('CallModule sadece Android için kullanılabilir');
      return false;
    }

    try {
      return await CallModule.answerCall(callId);
    } catch (error) {
      console.error('Arama cevaplanamadı:', error);
      throw error;
    }
  }

  /**
   * Aramayı reddet
   */
  async declineCall(callId: string): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      console.warn('CallModule sadece Android için kullanılabilir');
      return false;
    }

    try {
      return await CallModule.declineCall(callId);
    } catch (error) {
      console.error('Arama reddedilemedi:', error);
      throw error;
    }
  }

  /**
   * Aktif aramayı sonlandır
   */
  async endCall(callId: string): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      console.warn('CallModule sadece Android için kullanılabilir');
      return false;
    }

    try {
      return await CallModule.endCall(callId);
    } catch (error) {
      console.error('Arama sonlandırılamadı:', error);
      throw error;
    }
  }

  /**
   * Telefon araması yap
   */
  async makeCall(phoneNumber: string): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      console.warn('CallModule sadece Android için kullanılabilir');
      return false;
    }

    try {
      return await CallModule.makeCall(phoneNumber);
    } catch (error) {
      console.error('Arama yapılamadı:', error);
      throw error;
    }
  }

  /**
   * Aramayı beklet
   */
  async holdCall(callId: string, hold: boolean): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      return false;
    }

    try {
      return await CallModule.holdCall(callId, hold);
    } catch (error) {
      console.error('Hold işlemi başarısız:', error);
      throw error;
    }
  }

  /**
   * Mikrofonu sessize al
   */
  async setMuted(muted: boolean): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      return false;
    }

    try {
      return await CallModule.setMuted(muted);
    } catch (error) {
      console.error('Mikrofon ayarlanamadı:', error);
      throw error;
    }
  }

  /**
   * Hoparlörü aç/kapa
   */
  async setSpeakerphone(enabled: boolean): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      return false;
    }

    try {
      return await CallModule.setSpeakerphone(enabled);
    } catch (error) {
      console.error('Hoparlör ayarlanamadı:', error);
      throw error;
    }
  }

  /**
   * DTMF tonu gönder
   */
  async sendDTMF(callId: string, digit: string): Promise<boolean> {
    if (!this.isAndroid || !CallModule) {
      return false;
    }

    try {
      return await CallModule.sendDTMF(callId, digit);
    } catch (error) {
      console.error('DTMF gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Mevcut arama durumunu al
   */
  async getCallState(): Promise<CallState | null> {
    if (!this.isAndroid || !CallModule) {
      return null;
    }

    try {
      return await CallModule.getCallState();
    } catch (error) {
      console.error('Arama durumu alınamadı:', error);
      return null;
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Gelen arama event'i dinle
   */
  onIncomingCall(listener: IncomingCallListener): EmitterSubscription | null {
    if (!callEventEmitter) return null;
    return callEventEmitter.addListener('onIncomingCall', listener);
  }

  /**
   * Arama cevaplandı event'i dinle
   */
  onCallAnswered(listener: CallAnsweredListener): EmitterSubscription | null {
    if (!callEventEmitter) return null;
    return callEventEmitter.addListener('onCallAnswered', listener);
  }

  /**
   * Arama bitti event'i dinle
   */
  onCallEnded(listener: CallEndedListener): EmitterSubscription | null {
    if (!callEventEmitter) return null;
    return callEventEmitter.addListener('onCallEnded', listener);
  }

  /**
   * Tüm event listener'ları kaldır
   */
  removeAllListeners(): void {
    if (callEventEmitter) {
      callEventEmitter.removeAllListeners('onIncomingCall');
      callEventEmitter.removeAllListeners('onCallAnswered');
      callEventEmitter.removeAllListeners('onCallEnded');
    }
  }
}

// Singleton instance
export const nativeCallModule = new NativeCallModule();

export default nativeCallModule;
