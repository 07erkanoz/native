/**
 * LifeCall - Call Overlay
 *
 * Uygulama seviyesinde çağrı UI yöneticisi
 * - Gelen aramalar için floating notification
 * - Devam eden aramalar için floating bubble
 * - Uygulama durumuna göre otomatik geçiş
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';

import { FloatingCallBubble } from './FloatingCallBubble';
import { FloatingCallNotification } from './FloatingCallNotification';
import callStateManager, { ActiveCall, AppStateInfo } from '../services/CallStateManager';
import { defaultAppService } from '../services';

export const CallOverlay: React.FC = () => {
  const navigation = useNavigation();
  const currentRouteName = useNavigationState((state) => {
    if (!state || !state.routes) return '';
    return state.routes[state.index]?.name || '';
  });

  // State
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [showFloatingNotification, setShowFloatingNotification] = useState(false);
  const [showFloatingBubble, setShowFloatingBubble] = useState(false);
  const [appState, setAppState] = useState<AppStateInfo>(callStateManager.getAppState());

  // Event dinleyicileri
  useEffect(() => {
    // Gelen çağrı
    const handleIncomingCall = (call: ActiveCall) => {
      setActiveCall(call);

      // Zaten çağrı ekranındaysa veya uygulama ön plandaysa tam ekran
      if (currentRouteName === 'IncomingCall' || currentRouteName === 'OngoingCall') {
        return;
      }

      // Uygulama arka plandaysa mini popup
      if (!appState.isInForeground) {
        setShowFloatingNotification(true);
      } else {
        // Ön plandaysa tam ekran aç
        navigation.navigate('IncomingCall' as never, { callId: call.id } as never);
      }
    };

    // Çağrı durumu değişti
    const handleCallStateChanged = (call: ActiveCall | null) => {
      setActiveCall(call);

      if (!call) {
        setShowFloatingBubble(false);
        setShowFloatingNotification(false);
      }
    };

    // Çağrı bağlandı
    const handleCallConnected = (call: ActiveCall) => {
      setShowFloatingNotification(false);

      // Çağrı ekranında değilsek floating bubble göster
      if (currentRouteName !== 'OngoingCall') {
        setShowFloatingBubble(true);
      }
    };

    // Çağrı bitti
    const handleCallEnded = () => {
      setActiveCall(null);
      setShowFloatingBubble(false);
      setShowFloatingNotification(false);
    };

    // Uygulama durumu değişti
    const handleAppStateChanged = (state: AppStateInfo) => {
      setAppState(state);

      // Aktif çağrı varken arka plana geçildi
      if (activeCall && !state.isInForeground) {
        if (activeCall.state === 'incoming') {
          setShowFloatingNotification(true);
        } else if (activeCall.state === 'connected') {
          setShowFloatingBubble(true);
        }
      }

      // Ön plana geri dönüldü
      if (state.isInForeground) {
        // Floating'i kaldır, kullanıcı zaten ekranda
        if (currentRouteName === 'IncomingCall' || currentRouteName === 'OngoingCall') {
          setShowFloatingBubble(false);
          setShowFloatingNotification(false);
        }
      }
    };

    // Floating göster
    const handleShowFloating = (call: ActiveCall) => {
      if (call.state === 'incoming') {
        setShowFloatingNotification(true);
      } else {
        setShowFloatingBubble(true);
      }
    };

    // Floating gizle
    const handleHideFloating = () => {
      setShowFloatingBubble(false);
      setShowFloatingNotification(false);
    };

    // Event listener'ları kaydet
    callStateManager.on('incomingCall', handleIncomingCall);
    callStateManager.on('callStateChanged', handleCallStateChanged);
    callStateManager.on('callConnected', handleCallConnected);
    callStateManager.on('callEnded', handleCallEnded);
    callStateManager.on('appStateChanged', handleAppStateChanged);
    callStateManager.on('showFloatingUI', handleShowFloating);
    callStateManager.on('hideFloatingUI', handleHideFloating);

    // Mevcut durumu kontrol et
    const currentCall = callStateManager.getActiveCall();
    if (currentCall) {
      setActiveCall(currentCall);
    }

    return () => {
      callStateManager.off('incomingCall', handleIncomingCall);
      callStateManager.off('callStateChanged', handleCallStateChanged);
      callStateManager.off('callConnected', handleCallConnected);
      callStateManager.off('callEnded', handleCallEnded);
      callStateManager.off('appStateChanged', handleAppStateChanged);
      callStateManager.off('showFloatingUI', handleShowFloating);
      callStateManager.off('hideFloatingUI', handleHideFloating);
    };
  }, [navigation, currentRouteName, appState, activeCall]);

  // Navigation değiştiğinde floating durumunu güncelle
  useEffect(() => {
    if (currentRouteName === 'IncomingCall' || currentRouteName === 'OngoingCall') {
      setShowFloatingBubble(false);
      setShowFloatingNotification(false);
    } else if (activeCall) {
      // Çağrı ekranından çıkıldı, floating göster
      if (activeCall.state === 'connected' || activeCall.state === 'on_hold') {
        setShowFloatingBubble(true);
      }
    }
  }, [currentRouteName, activeCall]);

  // Floating notification: Cevapla
  const handleNotificationAnswer = useCallback(async () => {
    if (!activeCall) return;

    setShowFloatingNotification(false);

    try {
      await defaultAppService.answerCall(activeCall.id);
      callStateManager.onCallAnswered();

      // Çağrı ekranına git
      navigation.navigate('OngoingCall' as never, { callId: activeCall.id } as never);

      // Simüle bağlantı
      setTimeout(() => {
        callStateManager.onCallConnected();
      }, 1000);
    } catch (error) {
      console.error('Çağrı cevaplanamadı:', error);
    }
  }, [activeCall, navigation]);

  // Floating notification: Reddet
  const handleNotificationDecline = useCallback(async () => {
    if (!activeCall) return;

    setShowFloatingNotification(false);

    try {
      await defaultAppService.rejectCall(activeCall.id);
      callStateManager.onCallEnded('declined');
    } catch (error) {
      console.error('Çağrı reddedilemedi:', error);
    }
  }, [activeCall]);

  // Floating notification: Sessiz
  const handleNotificationSilence = useCallback(() => {
    // Zil sesini kapat (native modül ile)
    console.log('Zil sesi kapatıldı');
  }, []);

  // Floating notification: Genişlet
  const handleNotificationExpand = useCallback(() => {
    if (!activeCall) return;

    setShowFloatingNotification(false);
    navigation.navigate('IncomingCall' as never, { callId: activeCall.id } as never);
  }, [activeCall, navigation]);

  // Floating bubble: Basınca
  const handleBubblePress = useCallback(() => {
    if (!activeCall) return;

    setShowFloatingBubble(false);
    navigation.navigate('OngoingCall' as never, { callId: activeCall.id } as never);
  }, [activeCall, navigation]);

  // Floating bubble: Çağrıyı bitir
  const handleBubbleEndCall = useCallback(async () => {
    if (!activeCall) return;

    try {
      await defaultAppService.endCall(activeCall.id);
      callStateManager.onCallEnded();
    } catch (error) {
      console.error('Çağrı bitirilemedi:', error);
      callStateManager.onCallEnded();
    }
  }, [activeCall]);

  return (
    <>
      {/* Gelen Arama Floating Notification */}
      {showFloatingNotification && activeCall && activeCall.state === 'incoming' && (
        <FloatingCallNotification
          call={activeCall}
          onAnswer={handleNotificationAnswer}
          onDecline={handleNotificationDecline}
          onSilence={handleNotificationSilence}
          onExpand={handleNotificationExpand}
        />
      )}

      {/* Devam Eden Arama Floating Bubble */}
      {showFloatingBubble && activeCall && (activeCall.state === 'connected' || activeCall.state === 'on_hold') && (
        <FloatingCallBubble
          call={activeCall}
          onPress={handleBubblePress}
          onEndCall={handleBubbleEndCall}
        />
      )}
    </>
  );
};

export default CallOverlay;
