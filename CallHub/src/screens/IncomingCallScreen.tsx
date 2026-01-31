/**
 * LifeCall - Gelen Arama Ekranı (Temalı)
 *
 * Gelen aramalar için tam ekran UI
 * - Özelleştirilebilir temalar (16 hazır tema + özel temalar)
 * - Farklı cevaplama stilleri (iOS, Android, Floating, Minimal)
 * - 15 farklı buton animasyonu
 * - Video ve gradient arka plan desteği
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Vibration,
  StatusBar,
  Linking,
} from 'react-native';
import {
  Text,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme, useCallTheme, AVATAR_SIZES } from '../theme';
import { Avatar, CallBackground, AnswerButtons } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { Contact } from '../types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';
import VoLTEModule from '../native/VoLTEModule';
import { getCountryFromPhoneNumber } from '../data/countryCodes';

// Hızlı SMS yanıtları
const QUICK_REPLIES = [
  { id: '1', key: 'cantTalk', defaultText: 'Şu an konuşamıyorum. Seni arayacağım.' },
  { id: '2', key: 'inMeeting', defaultText: 'Toplantıdayım. Daha sonra arayabilir misin?' },
  { id: '3', key: 'callLater', defaultText: '10 dakika içinde seni arayacağım.' },
  { id: '4', key: 'whatsUp', defaultText: 'Ne için arıyorsun?' },
];

type Props = RootStackScreenProps<'IncomingCall'>;

const IncomingCallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { activeTheme } = useCallTheme();
  const { callId } = route.params;

  // State
  const [callerInfo, setCallerInfo] = useState<{
    name: string;
    number: string;
    photoUri?: string;
    contact?: Contact;
  }>({
    name: t('common.unknown'),
    number: '',
  });
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isVolteCall, setIsVolteCall] = useState(false);

  // Ülke bilgisi
  const countryInfo = useMemo(() => {
    if (callerInfo.number) {
      return getCountryFromPhoneNumber(callerInfo.number);
    }
    return null;
  }, [callerInfo.number]);

  // Avatar animasyonu
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Avatar animasyonları
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    switch (activeTheme.avatar.ringStyle) {
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
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
        break;
      case 'glow':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: false,
            }),
          ])
        );
        break;
    }

    // Float animasyonu
    if (activeTheme.animations?.avatarAnimation === 'float') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [activeTheme, pulseAnim, glowAnim, floatAnim]);

  // Titreşim
  useEffect(() => {
    const interval = setInterval(() => {
      Vibration.vibrate([0, 500, 200, 500]);
    }, 2000);

    return () => {
      clearInterval(interval);
      Vibration.cancel();
    };
  }, []);

  // VoLTE durumunu kontrol et
  useEffect(() => {
    const checkVoLTE = async () => {
      try {
        const status = await VoLTEModule.getVoLTEStatus();
        setIsVolteCall(status.isHdCall);
      } catch (error) {
        console.log('VoLTE kontrolü başarısız:', error);
      }
    };
    checkVoLTE();
  }, []);

  // Arayan bilgisini al
  useEffect(() => {
    const fetchCallerInfo = async () => {
      try {
        const phoneNumber = callId;
        const contacts = await ContactRepository.searchContacts(phoneNumber);

        if (contacts.length > 0) {
          const contact = contacts[0];
          setCallerInfo({
            name: contact.displayName,
            number: phoneNumber,
            photoUri: contact.photoUri,
            contact,
          });
        } else {
          setCallerInfo({
            name: t('common.unknown'),
            number: phoneNumber,
          });
        }
      } catch (error) {
        console.error('Arayan bilgisi alınamadı:', error);
      }
    };

    fetchCallerInfo();
  }, [callId, t]);

  // Cevapla
  const handleAnswer = useCallback(async () => {
    setIsAnswering(true);
    Vibration.cancel();

    try {
      await defaultAppService.answerCall(callId);
      navigation.replace('OngoingCall', { callId });
    } catch (error) {
      console.error('Arama cevaplanamadı:', error);
      setIsAnswering(false);
    }
  }, [callId, navigation]);

  // Reddet
  const handleDecline = useCallback(async () => {
    setIsDeclining(true);
    Vibration.cancel();

    try {
      await defaultAppService.rejectCall(callId);
      navigation.goBack();
    } catch (error) {
      console.error('Arama reddedilemedi:', error);
      setIsDeclining(false);
    }
  }, [callId, navigation]);

  // SMS ile yanıtla
  const handleQuickReply = useCallback(
    (message: string) => {
      setShowQuickReplies(false);
      handleDecline();

      const cleanNumber = callerInfo.number.replace(/[^0-9+]/g, '');
      Linking.openURL(`sms:${cleanNumber}?body=${encodeURIComponent(message)}`);
    },
    [callerInfo.number, handleDecline]
  );

  // Avatar boyutu
  const avatarSize = AVATAR_SIZES[activeTheme.avatar.size];

  // Avatar border radius
  const getAvatarBorderRadius = () => {
    switch (activeTheme.avatar.shape) {
      case 'square': return avatarSize / 8;
      case 'rounded': return avatarSize / 4;
      default: return avatarSize / 2;
    }
  };

  // Glow shadow style
  const glowShadowStyle = useMemo(() => {
    if (activeTheme.avatar.ringStyle === 'glow') {
      return {
        shadowColor: activeTheme.avatar.ringColor || activeTheme.colors.primary,
        shadowOpacity: glowAnim,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 0 },
      };
    }
    return {};
  }, [activeTheme, glowAnim]);

  return (
    <CallBackground
      background={activeTheme.background}
      animation={activeTheme.animations?.backgroundAnimation}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Arayan Bilgisi Bölümü */}
      <View style={styles.callerSection}>
        {/* Gelen Arama Etiketi */}
        {activeTheme.showCallerInfo !== false && (
          <View style={styles.callLabelRow}>
            <Text style={[styles.callLabel, { color: activeTheme.colors.textMuted }]}>
              {t('calls.incoming') || 'Gelen Arama'}
            </Text>
            {activeTheme.showHdBadge !== false && isVolteCall && (
              <Text style={[styles.hdBadge, { color: activeTheme.colors.primary }]}>HD</Text>
            )}
          </View>
        )}

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [
                { scale: activeTheme.avatar.ringStyle === 'pulse' ? pulseAnim : 1 },
                { translateY: activeTheme.animations?.avatarAnimation === 'float' ? floatAnim : 0 },
              ],
            },
            glowShadowStyle,
          ]}
        >
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: activeTheme.avatar.ringStyle !== 'none'
                  ? (activeTheme.avatar.ringColor || activeTheme.colors.primary)
                  : 'transparent',
                borderWidth: activeTheme.avatar.ringWidth || 3,
                borderRadius: getAvatarBorderRadius() + 10,
                padding: activeTheme.avatar.ringStyle !== 'none' ? 6 : 0,
              },
              activeTheme.avatar.ringStyle === 'rainbow' && styles.rainbowRing,
            ]}
          >
            <Avatar
              name={callerInfo.name}
              photoUri={callerInfo.photoUri}
              size={avatarSize}
              style={{
                borderRadius: getAvatarBorderRadius(),
              }}
            />
          </View>
        </Animated.View>

        {/* İsim */}
        <Text style={[styles.callerName, { color: activeTheme.colors.text }]}>
          {callerInfo.name}
        </Text>

        {/* Numara ve Ülke Bayrağı */}
        {callerInfo.name !== callerInfo.number && callerInfo.number && (
          <View style={styles.numberRow}>
            {activeTheme.showCountryFlag !== false && countryInfo && (
              <Text style={styles.countryFlag}>{countryInfo.flag}</Text>
            )}
            <Text style={[styles.callerNumber, { color: activeTheme.colors.textMuted }]}>
              {callerInfo.number}
            </Text>
          </View>
        )}

        {/* Ülke Adı */}
        {activeTheme.showCountryFlag !== false && countryInfo && (
          <Text style={[styles.countryName, { color: activeTheme.colors.textMuted }]}>
            {countryInfo.nameTr}
          </Text>
        )}

        {/* Şirket */}
        {activeTheme.showCompany !== false && callerInfo.contact?.company && (
          <Text style={[styles.callerCompany, { color: activeTheme.colors.textMuted }]}>
            {callerInfo.contact.company}
          </Text>
        )}
      </View>

      {/* Cevaplama Butonları */}
      <View style={styles.actionsSection}>
        <AnswerButtons
          answerStyle={activeTheme.answerStyle}
          colors={activeTheme.colors}
          onAnswer={handleAnswer}
          onDecline={handleDecline}
          onMessage={() => setShowQuickReplies(true)}
          disabled={isAnswering || isDeclining}
          labels={{
            answer: t('calls.actions.answer') || 'Answer',
            decline: t('calls.actions.decline') || 'Decline',
            message: t('calls.quickReply') || 'Message',
            reminder: t('calls.reminder') || 'Remind',
            swipeToAnswer: t('calls.swipeToAnswer') || 'slide to answer',
          }}
        />
      </View>

      {/* Hızlı SMS Yanıtları Modal */}
      <Portal>
        <Modal
          visible={showQuickReplies}
          onDismiss={() => setShowQuickReplies(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.modalTitle, { color: theme.colors.onSurface }]}
          >
            {t('calls.quickReplyTitle') || 'Hızlı Yanıt Gönder'}
          </Text>

          {QUICK_REPLIES.map((reply) => (
            <Button
              key={reply.id}
              mode="outlined"
              style={styles.replyButton}
              contentStyle={styles.replyButtonContent}
              onPress={() => handleQuickReply(t(`calls.quickReplies.${reply.key}`) || reply.defaultText)}
            >
              {t(`calls.quickReplies.${reply.key}`) || reply.defaultText}
            </Button>
          ))}

          <Button
            mode="text"
            onPress={() => setShowQuickReplies(false)}
            style={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
        </Modal>
      </Portal>
    </CallBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  callLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  callLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  hdBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarContainer: {
    marginBottom: 28,
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rainbowRing: {
    borderWidth: 4,
    // Rainbow border olacak - gradient border RN'de zor, solid kullanıyoruz
  },
  callerName: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  countryFlag: {
    fontSize: 22,
  },
  callerNumber: {
    fontSize: 18,
    fontWeight: '500',
  },
  countryName: {
    fontSize: 14,
    marginBottom: 4,
  },
  callerCompany: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 20,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  replyButton: {
    marginBottom: 8,
  },
  replyButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default IncomingCallScreen;
