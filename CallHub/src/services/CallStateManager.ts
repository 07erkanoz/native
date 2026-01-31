/**
 * LifeCall - Çağrı Durum Yöneticisi
 *
 * Aktif çağrıları ve uygulama durumunu yönetir
 * - Gelen/giden çağrı takibi
 * - Uygulama ön plan/arka plan durumu
 * - Floating UI kontrolü
 */

import { NativeEventEmitter, NativeModules, AppState, AppStateStatus, Platform, EmitterSubscription } from 'react-native';
import { EventEmitter } from 'events';
import { nativeCallModule, IncomingCallEvent, CallAnsweredEvent, CallEndedEvent } from '../native/CallModule';

// Çağrı durumları
export type CallState =
  | 'idle'
  | 'incoming'
  | 'dialing'
  | 'connecting'
  | 'connected'
  | 'on_hold'
  | 'ended';

// Çağrı bilgisi
export interface ActiveCall {
  id: string;
  phoneNumber: string;
  displayName?: string;
  photoUri?: string;
  state: CallState;
  direction: 'incoming' | 'outgoing';
  startTime?: number;
  connectTime?: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isOnHold: boolean;
}

// Uygulama durumu
export interface AppStateInfo {
  isActive: boolean;
  isInForeground: boolean;
  shouldShowFloating: boolean;
}

// Event tipleri
export type CallStateEventType =
  | 'callStateChanged'
  | 'incomingCall'
  | 'callEnded'
  | 'callConnected'
  | 'appStateChanged'
  | 'showFloatingUI'
  | 'hideFloatingUI';

class CallStateManager extends EventEmitter {
  private static instance: CallStateManager;

  // Mevcut durum
  private activeCall: ActiveCall | null = null;
  private appState: AppStateInfo = {
    isActive: true,
    isInForeground: true,
    shouldShowFloating: false,
  };
  private callDurationInterval: ReturnType<typeof setInterval> | null = null;

  // Native event subscriptions
  private nativeSubscriptions: EmitterSubscription[] = [];

  private constructor() {
    super();
    this.initAppStateListener();
    this.initNativeCallListeners();
  }

  // Native çağrı event dinleyicileri
  private initNativeCallListeners() {
    if (Platform.OS !== 'android') return;

    // Gelen arama
    const incomingSub = nativeCallModule.onIncomingCall(this.handleNativeIncomingCall);
    if (incomingSub) this.nativeSubscriptions.push(incomingSub);

    // Arama cevaplandı
    const answeredSub = nativeCallModule.onCallAnswered(this.handleNativeCallAnswered);
    if (answeredSub) this.nativeSubscriptions.push(answeredSub);

    // Arama bitti
    const endedSub = nativeCallModule.onCallEnded(this.handleNativeCallEnded);
    if (endedSub) this.nativeSubscriptions.push(endedSub);
  }

  // Native gelen arama event'i
  private handleNativeIncomingCall = (event: IncomingCallEvent) => {
    console.log('[CallStateManager] Native gelen arama:', event);

    this.onIncomingCall({
      id: `call_${event.timestamp}`,
      phoneNumber: event.phoneNumber,
      displayName: event.callerName || undefined,
      photoUri: event.photoUri || undefined,
    });
  };

  // Native arama cevaplandı event'i
  private handleNativeCallAnswered = (event: CallAnsweredEvent) => {
    console.log('[CallStateManager] Native arama cevaplandı:', event);
    this.onCallAnswered();

    // Kısa bir gecikmeyle bağlandı olarak işaretle
    setTimeout(() => {
      this.onCallConnected();
    }, 500);
  };

  // Native arama bitti event'i
  private handleNativeCallEnded = (event: CallEndedEvent) => {
    console.log('[CallStateManager] Native arama bitti:', event);
    this.onCallEnded(event.reason);
  };

  // Singleton instance
  public static getInstance(): CallStateManager {
    if (!CallStateManager.instance) {
      CallStateManager.instance = new CallStateManager();
    }
    return CallStateManager.instance;
  }

  // Uygulama durum dinleyicisi
  private initAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Uygulama durumu değişikliği
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const wasInForeground = this.appState.isInForeground;
    const isInForeground = nextAppState === 'active';
    const isActive = nextAppState !== 'inactive';

    this.appState = {
      isActive,
      isInForeground,
      shouldShowFloating: this.activeCall !== null && !isInForeground,
    };

    this.emit('appStateChanged', this.appState);

    // Aktif çağrı varken arka plana geçildi
    if (this.activeCall && wasInForeground && !isInForeground) {
      this.emit('showFloatingUI', this.activeCall);
    }

    // Ön plana geri dönüldü
    if (this.activeCall && !wasInForeground && isInForeground) {
      this.emit('hideFloatingUI');
    }
  };

  // Gelen çağrı
  public onIncomingCall(callInfo: {
    id: string;
    phoneNumber: string;
    displayName?: string;
    photoUri?: string;
  }) {
    this.activeCall = {
      ...callInfo,
      state: 'incoming',
      direction: 'incoming',
      startTime: Date.now(),
      isMuted: false,
      isSpeakerOn: false,
      isOnHold: false,
    };

    this.emit('incomingCall', this.activeCall);
    this.emit('callStateChanged', this.activeCall);

    // Uygulama arka plandaysa floating göster
    if (!this.appState.isInForeground) {
      this.appState.shouldShowFloating = true;
      this.emit('showFloatingUI', this.activeCall);
    }
  }

  // Giden çağrı başlat
  public startOutgoingCall(callInfo: {
    id: string;
    phoneNumber: string;
    displayName?: string;
    photoUri?: string;
  }) {
    this.activeCall = {
      ...callInfo,
      state: 'dialing',
      direction: 'outgoing',
      startTime: Date.now(),
      isMuted: false,
      isSpeakerOn: false,
      isOnHold: false,
    };

    this.emit('callStateChanged', this.activeCall);
  }

  // Çağrı cevaplandı
  public onCallAnswered() {
    if (this.activeCall) {
      this.activeCall.state = 'connecting';
      this.emit('callStateChanged', this.activeCall);
    }
  }

  // Çağrı bağlandı
  public onCallConnected() {
    if (this.activeCall) {
      this.activeCall.state = 'connected';
      this.activeCall.connectTime = Date.now();
      this.emit('callConnected', this.activeCall);
      this.emit('callStateChanged', this.activeCall);

      // Süre sayacını başlat
      this.startDurationTimer();
    }
  }

  // Çağrı sonlandı
  public onCallEnded(reason?: string) {
    if (this.activeCall) {
      const endedCall = { ...this.activeCall, state: 'ended' as CallState };
      this.activeCall = null;

      this.emit('callEnded', endedCall, reason);
      this.emit('callStateChanged', null);
      this.emit('hideFloatingUI');

      this.stopDurationTimer();
      this.appState.shouldShowFloating = false;
    }
  }

  // Sessiz al/aç
  public toggleMute() {
    if (this.activeCall) {
      this.activeCall.isMuted = !this.activeCall.isMuted;
      this.emit('callStateChanged', this.activeCall);
      return this.activeCall.isMuted;
    }
    return false;
  }

  // Hoparlör aç/kapat
  public toggleSpeaker() {
    if (this.activeCall) {
      this.activeCall.isSpeakerOn = !this.activeCall.isSpeakerOn;
      this.emit('callStateChanged', this.activeCall);
      return this.activeCall.isSpeakerOn;
    }
    return false;
  }

  // Beklet/Devam
  public toggleHold() {
    if (this.activeCall) {
      this.activeCall.isOnHold = !this.activeCall.isOnHold;
      this.activeCall.state = this.activeCall.isOnHold ? 'on_hold' : 'connected';
      this.emit('callStateChanged', this.activeCall);
      return this.activeCall.isOnHold;
    }
    return false;
  }

  // Aktif çağrı bilgisi
  public getActiveCall(): ActiveCall | null {
    return this.activeCall;
  }

  // Uygulama durumu
  public getAppState(): AppStateInfo {
    return this.appState;
  }

  // Çağrı süresi hesapla
  public getCallDuration(): number {
    if (this.activeCall?.connectTime) {
      return Math.floor((Date.now() - this.activeCall.connectTime) / 1000);
    }
    return 0;
  }

  // Çağrı süresi formatla
  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Floating UI gösterilmeli mi?
  public shouldShowFloatingUI(): boolean {
    return this.appState.shouldShowFloating && this.activeCall !== null;
  }

  // Floating UI'ı manuel göster
  public showFloating() {
    if (this.activeCall) {
      this.appState.shouldShowFloating = true;
      this.emit('showFloatingUI', this.activeCall);
    }
  }

  // Floating UI'ı manuel gizle
  public hideFloating() {
    this.appState.shouldShowFloating = false;
    this.emit('hideFloatingUI');
  }

  // Süre sayacını başlat
  private startDurationTimer() {
    this.callDurationInterval = setInterval(() => {
      if (this.activeCall?.state === 'connected') {
        this.emit('durationTick', this.getCallDuration());
      }
    }, 1000);
  }

  // Süre sayacını durdur
  private stopDurationTimer() {
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }
  }

  // Temizle
  public cleanup() {
    this.stopDurationTimer();
    this.removeAllListeners();

    // Native subscription'ları temizle
    this.nativeSubscriptions.forEach((sub) => sub.remove());
    this.nativeSubscriptions = [];
    nativeCallModule.removeAllListeners();
  }
}

export const callStateManager = CallStateManager.getInstance();
export default callStateManager;
