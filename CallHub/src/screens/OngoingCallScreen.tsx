/**
 * LifeCall - Devam Eden Arama Ekranı
 *
 * Aktif çağrı kontrolü ve bilgileri
 * - Çağrı süresi
 * - Sessiz, hoparlör, beklet kontrolleri
 * - Tuş takımı (DTMF)
 * - Çağrı sonlandırma
 * - Geri tuşuyla floating UI'a geçiş
 * - Tema mağazası desteği
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  BackHandler,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  IconButton,
  Portal,
  Modal,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import callStateManager, { ActiveCall } from '../services/CallStateManager';
import { defaultAppService } from '../services';

const { width, height } = Dimensions.get('window');

// DTMF Tuş Takımı
const DTMF_PAD = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

type Props = RootStackScreenProps<'OngoingCall'>;

const OngoingCallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useAppTheme();
  const { callId } = route.params;

  // Tema renkleri - mağazadan gelen tema ile uyumlu
  const callColors = useMemo(() => ({
    background: theme.colors.callBackground,
    primary: theme.colors.callPrimary,
    danger: theme.colors.callDanger,
    text: theme.colors.onSurface,
    textMuted: theme.colors.onSurfaceVariant,
    surface: theme.colors.surface,
    surfaceVariant: theme.colors.surfaceVariant,
    warning: theme.colors.warning,
    info: theme.colors.info,
  }), [theme]);

  // State
  const [callInfo, setCallInfo] = useState<ActiveCall | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [callStatus, setCallStatus] = useState<string>(t('calls.status.connecting') || 'Bağlanıyor...');

  // Animasyonlar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusOpacity = useRef(new Animated.Value(1)).current;

  // Çağrı bilgisini al
  useEffect(() => {
    const activeCall = callStateManager.getActiveCall();
    if (activeCall) {
      setCallInfo(activeCall);
      setIsMuted(activeCall.isMuted);
      setIsSpeakerOn(activeCall.isSpeakerOn);
      setIsOnHold(activeCall.isOnHold);

      // Durum kontrolü
      if (activeCall.state === 'connected') {
        setCallStatus(t('calls.status.connected') || 'Bağlandı');
      } else if (activeCall.state === 'on_hold') {
        setCallStatus(t('calls.actions.hold') || 'Beklemede');
      } else if (activeCall.state === 'dialing') {
        setCallStatus(t('calls.status.dialing') || 'Aranıyor...');
      }
    }
  }, [callId, t]);

  // Süre sayacı
  useEffect(() => {
    const handleDurationTick = (seconds: number) => {
      setDuration(seconds);
    };

    const handleCallStateChanged = (call: ActiveCall | null) => {
      if (call) {
        setCallInfo(call);
        setIsMuted(call.isMuted);
        setIsSpeakerOn(call.isSpeakerOn);
        setIsOnHold(call.isOnHold);

        // Durum kontrolü
        if (call.state === 'connected') {
          setCallStatus(t('calls.status.connected') || 'Bağlandı');
        } else if (call.state === 'on_hold') {
          setCallStatus(t('calls.actions.hold') || 'Beklemede');
        }
      }
    };

    const handleCallEnded = () => {
      navigation.goBack();
    };

    callStateManager.on('durationTick', handleDurationTick);
    callStateManager.on('callStateChanged', handleCallStateChanged);
    callStateManager.on('callEnded', handleCallEnded);

    // Simüle bağlantı (gerçek uygulamada CallKeep'ten gelecek)
    setTimeout(() => {
      callStateManager.onCallConnected();
    }, 2000);

    return () => {
      callStateManager.off('durationTick', handleDurationTick);
      callStateManager.off('callStateChanged', handleCallStateChanged);
      callStateManager.off('callEnded', handleCallEnded);
    };
  }, [navigation, t]);

  // Geri tuşu - Floating UI'a geç
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      callStateManager.showFloating();
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Pulse animasyonu (bağlanırken)
  useEffect(() => {
    if (callInfo?.state !== 'connected') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [callInfo?.state, pulseAnim]);

  // Süre formatla
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sessiz
  const handleToggleMute = useCallback(async () => {
    const newState = callStateManager.toggleMute();
    setIsMuted(newState);
    try {
      // Native modüle de bildir
      // await defaultAppService.setMuted(newState);
    } catch (error) {
      console.error('Sessiz değiştirilemedi:', error);
    }
  }, []);

  // Hoparlör
  const handleToggleSpeaker = useCallback(async () => {
    const newState = callStateManager.toggleSpeaker();
    setIsSpeakerOn(newState);
    try {
      // Native modüle de bildir
      // await defaultAppService.setSpeaker(newState);
    } catch (error) {
      console.error('Hoparlör değiştirilemedi:', error);
    }
  }, []);

  // Beklet
  const handleToggleHold = useCallback(async () => {
    const newState = callStateManager.toggleHold();
    setIsOnHold(newState);
    setCallStatus(newState ? (t('calls.actions.hold') || 'Beklemede') : (t('calls.status.connected') || 'Bağlandı'));
    try {
      // Native modüle de bildir
      // await defaultAppService.setHold(newState);
    } catch (error) {
      console.error('Bekletme değiştirilemedi:', error);
    }
  }, [t]);

  // Çağrıyı bitir
  const handleEndCall = useCallback(async () => {
    try {
      await defaultAppService.endCall(callId);
      callStateManager.onCallEnded();
    } catch (error) {
      console.error('Çağrı bitirilemedi:', error);
      callStateManager.onCallEnded();
    }
  }, [callId]);

  // DTMF tuşu gönder
  const handleDTMF = useCallback((digit: string) => {
    try {
      // Native modüle DTMF gönder
      // await defaultAppService.sendDTMF(digit);
      console.log('DTMF:', digit);
    } catch (error) {
      console.error('DTMF gönderilemedi:', error);
    }
  }, []);

  // DTMF tuş render
  const renderDTMFKey = ({ digit, letters }: { digit: string; letters: string }) => (
    <TouchableOpacity
      key={digit}
      style={[styles.dtmfKey, { backgroundColor: callColors.surfaceVariant }]}
      onPress={() => handleDTMF(digit)}
      activeOpacity={0.7}
    >
      <Text style={[styles.dtmfDigit, { color: callColors.text }]}>{digit}</Text>
      {letters && <Text style={[styles.dtmfLetters, { color: callColors.textMuted }]}>{letters}</Text>}
    </TouchableOpacity>
  );

  if (!callInfo) {
    return (
      <View style={[styles.container, { backgroundColor: callColors.background }]}>
        <Text style={[styles.statusText, { color: callColors.textMuted }]}>
          {t('calls.status.connecting') || 'Bağlanıyor...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: callColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Üst Kısım - Kapat Butonu */}
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-down"
          iconColor={callColors.text}
          size={24}
          onPress={() => {
            callStateManager.showFloating();
            navigation.goBack();
          }}
        />
        <Text style={[styles.minimizeHint, { color: callColors.textMuted }]}>
          {t('calls.minimizeHint') || 'Küçültmek için aşağı kaydır'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Orta Kısım - Arayan Bilgisi */}
      <View style={styles.callerSection}>
        <Animated.View
          style={[
            styles.avatarContainer,
            { transform: [{ scale: callInfo.state !== 'connected' ? pulseAnim : 1 }] },
          ]}
        >
          <Avatar
            name={callInfo.displayName || callInfo.phoneNumber}
            photoUri={callInfo.photoUri}
            size={100}
          />

          {/* Durum İndikatörü */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: callColors.info,
                borderColor: callColors.background,
              },
              callInfo.state === 'connected' && { backgroundColor: callColors.primary },
              callInfo.state === 'on_hold' && { backgroundColor: callColors.warning },
            ]}
          >
            <MaterialCommunityIcons
              name={
                callInfo.state === 'on_hold'
                  ? 'pause'
                  : callInfo.state === 'connected'
                  ? 'phone-in-talk'
                  : 'phone-outgoing'
              }
              size={14}
              color="white"
            />
          </View>
        </Animated.View>

        {/* İsim ve Numara */}
        <Text style={[styles.callerName, { color: callColors.text }]}>
          {callInfo.displayName || t('common.unknown')}
        </Text>
        <Text style={[styles.callerNumber, { color: callColors.textMuted }]}>
          {callInfo.phoneNumber}
        </Text>

        {/* Durum / Süre */}
        <View style={styles.statusContainer}>
          {callInfo.state === 'connected' ? (
            <Text style={[styles.durationText, { color: callColors.primary }]}>
              {formatDuration(duration)}
            </Text>
          ) : (
            <Text style={[styles.statusText, { color: callColors.textMuted }]}>
              {callStatus}
            </Text>
          )}
        </View>

        {/* Kalite İndikatörü */}
        <View style={[styles.qualityIndicator, { backgroundColor: callColors.surfaceVariant }]}>
          <MaterialCommunityIcons name="signal-cellular-3" size={16} color={callColors.primary} />
          <Text style={[styles.qualityText, { color: callColors.primary }]}>HD</Text>
        </View>
      </View>

      {/* Kontrol Butonları */}
      {!showKeypad ? (
        <View style={styles.controlsSection}>
          {/* Üst Satır */}
          <View style={styles.controlRow}>
            {/* Sessiz */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: callColors.surfaceVariant },
                isMuted && { backgroundColor: callColors.primary }
              ]}
              onPress={handleToggleMute}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={28}
                color={callColors.text}
              />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>
                {isMuted ? (t('calls.actions.unmute') || 'Sesi Aç') : (t('calls.actions.mute') || 'Sessiz')}
              </Text>
            </TouchableOpacity>

            {/* Tuş Takımı */}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: callColors.surfaceVariant }]}
              onPress={() => setShowKeypad(true)}
            >
              <MaterialCommunityIcons name="dialpad" size={28} color={callColors.text} />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>
                {t('calls.actions.keypad') || 'Tuşlar'}
              </Text>
            </TouchableOpacity>

            {/* Hoparlör */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: callColors.surfaceVariant },
                isSpeakerOn && { backgroundColor: callColors.primary }
              ]}
              onPress={handleToggleSpeaker}
            >
              <MaterialCommunityIcons
                name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                size={28}
                color={callColors.text}
              />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>
                {t('calls.actions.speaker') || 'Hoparlör'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alt Satır */}
          <View style={styles.controlRow}>
            {/* Çağrı Ekle */}
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: callColors.surfaceVariant }]}>
              <MaterialCommunityIcons name="phone-plus" size={28} color={callColors.text} />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>
                {t('calls.actions.addCall') || 'Ekle'}
              </Text>
            </TouchableOpacity>

            {/* Beklet */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: callColors.surfaceVariant },
                isOnHold && { backgroundColor: callColors.primary }
              ]}
              onPress={handleToggleHold}
            >
              <MaterialCommunityIcons
                name={isOnHold ? 'play' : 'pause'}
                size={28}
                color={callColors.text}
              />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>
                {isOnHold ? (t('calls.actions.resume') || 'Devam') : (t('calls.actions.hold') || 'Beklet')}
              </Text>
            </TouchableOpacity>

            {/* Bluetooth */}
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: callColors.surfaceVariant }]}>
              <MaterialCommunityIcons name="bluetooth-audio" size={28} color={callColors.text} />
              <Text style={[styles.controlLabel, { color: callColors.text }]}>Bluetooth</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* DTMF Tuş Takımı */
        <View style={styles.keypadSection}>
          <View style={styles.keypadHeader}>
            <TouchableOpacity onPress={() => setShowKeypad(false)}>
              <MaterialCommunityIcons name="chevron-down" size={28} color={callColors.text} />
            </TouchableOpacity>
            <Text style={[styles.keypadTitle, { color: callColors.text }]}>
              {t('calls.actions.keypad') || 'Tuş Takımı'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.dtmfPad}>
            {[0, 3, 6, 9].map((startIndex) => (
              <View key={startIndex} style={styles.dtmfRow}>
                {DTMF_PAD.slice(startIndex, startIndex + 3).map(renderDTMFKey)}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Kapat Butonu */}
      <View style={styles.endCallSection}>
        <TouchableOpacity
          style={[styles.endCallButton, { backgroundColor: callColors.danger }]}
          onPress={handleEndCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={32} color="white" />
        </TouchableOpacity>
        <Text style={[styles.endCallLabel, { color: callColors.textMuted }]}>
          {t('calls.actions.endCall') || 'Aramayı Bitir'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 8,
  },
  minimizeHint: {
    fontSize: 12,
  },
  callerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  callerNumber: {
    fontSize: 16,
  },
  statusContainer: {
    marginTop: 12,
  },
  durationText: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 16,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsSection: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  controlButton: {
    alignItems: 'center',
    width: 80,
    padding: 12,
    borderRadius: 16,
  },
  controlLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  keypadSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  keypadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  keypadTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dtmfPad: {
    flex: 1,
    justifyContent: 'center',
  },
  dtmfRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dtmfKey: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtmfDigit: {
    fontSize: 28,
    fontWeight: '400',
  },
  dtmfLetters: {
    fontSize: 10,
    marginTop: -2,
    letterSpacing: 1,
  },
  endCallSection: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  endCallLabel: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default OngoingCallScreen;
