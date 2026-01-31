/**
 * LifeCall - Gelen Arama Ekranı
 *
 * Gelen aramalar için tam ekran UI
 * - Arayan bilgisi (isim, fotoğraf, numara)
 * - Cevapla / Reddet butonları
 * - Kaydırarak cevaplama/reddetme
 * - SMS ile hızlı yanıt
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Vibration,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import {
  Text,
  IconButton,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { Contact } from '../types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';
import VoLTEModule from '../native/VoLTEModule';
import { getCountryFromPhoneNumber } from '../data/countryCodes';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

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
  const { theme, isDarkMode } = useAppTheme();
  const { callId } = route.params;

  // Tema renkleri
  const callColors = useMemo(() => ({
    background: theme.colors.callBackground,
    primary: theme.colors.callPrimary,
    danger: theme.colors.callDanger,
    text: theme.colors.onSurface,
    textMuted: theme.colors.onSurfaceVariant,
    surface: theme.colors.surface,
    surfaceVariant: theme.colors.surfaceVariant,
  }), [theme]);

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

  // Animasyonlar
  const answerButtonScale = useRef(new Animated.Value(1)).current;
  const declineButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const swipeX = useRef(new Animated.Value(0)).current;

  // Çalma animasyonu
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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
  }, [pulseAnim]);

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
        // CallId'den telefon numarasını çıkar (gerçek uygulamada CallKeep'ten gelecek)
        const phoneNumber = callId; // Örnek: +905551234567

        // Kişi veritabanında ara
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
      // Aktif arama ekranına geç
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

      // SMS gönder
      const cleanNumber = callerInfo.number.replace(/[^0-9+]/g, '');
      Linking.openURL(`sms:${cleanNumber}?body=${encodeURIComponent(message)}`);
    },
    [callerInfo.number, handleDecline]
  );

  // Kaydırma gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Vibration.vibrate(10);
      },
      onPanResponderMove: (_, gestureState) => {
        swipeX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Sağa kaydır - Cevapla
          Animated.spring(swipeX, {
            toValue: width,
            useNativeDriver: true,
          }).start(handleAnswer);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Sola kaydır - Reddet
          Animated.spring(swipeX, {
            toValue: -width,
            useNativeDriver: true,
          }).start(handleDecline);
        } else {
          // Geri dön
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: callColors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Üst Kısım - Arayan Bilgisi */}
      <View style={styles.callerSection}>
        {/* VoLTE ve Gelen Arama Etiketi */}
        <View style={styles.callLabelRow}>
          {isVolteCall && (
            <View style={[styles.volteBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={[styles.volteText, { color: callColors.text }]}>VoLTE</Text>
            </View>
          )}
          <Text style={[styles.callLabel, { color: callColors.textMuted }]}>
            {t('calls.incoming') || 'Gelen Arama'}
          </Text>
        </View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={[styles.avatarRing, { borderColor: callColors.primary }]}>
            <Avatar
              name={callerInfo.name}
              photoUri={callerInfo.photoUri}
              size={120}
            />
          </View>
        </Animated.View>

        {/* İsim */}
        <Text style={[styles.callerName, { color: theme.colors.onSurface }]}>
          {callerInfo.name}
        </Text>

        {/* Numara ve Ülke Bayrağı */}
        {callerInfo.name !== callerInfo.number && callerInfo.number && (
          <View style={styles.numberRow}>
            {countryInfo && (
              <Text style={styles.countryFlag}>{countryInfo.flag}</Text>
            )}
            <Text style={[styles.callerNumber, { color: callColors.textMuted }]}>
              {callerInfo.number}
            </Text>
          </View>
        )}

        {/* Ülke Adı */}
        {countryInfo && (
          <Text style={[styles.countryName, { color: callColors.textMuted }]}>
            {countryInfo.nameTr}
          </Text>
        )}

        {/* Kişi etiketi */}
        {callerInfo.contact?.company && (
          <Text style={[styles.callerCompany, { color: callColors.textMuted }]}>
            {callerInfo.contact.company}
          </Text>
        )}
      </View>

      {/* Alt Kısım - Butonlar */}
      <View style={styles.actionsSection}>
        {/* Kaydırma İpucu */}
        <Animated.View
          style={[
            styles.swipeHint,
            {
              transform: [{ translateX: swipeX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.swipeTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.swipeIndicator, { backgroundColor: callColors.danger }]}>
              <MaterialCommunityIcons name="phone-hangup" size={24} color="white" />
            </View>
            <Text style={[styles.swipeText, { color: callColors.textMuted }]}>
              {t('calls.swipeToAnswer') || 'Kaydırarak cevapla'}
            </Text>
            <View style={[styles.swipeIndicator, { backgroundColor: callColors.primary }]}>
              <MaterialCommunityIcons name="phone" size={24} color="white" />
            </View>
          </View>
        </Animated.View>

        {/* Ana Butonlar */}
        <View style={styles.mainButtons}>
          {/* Reddet Butonu */}
          <View style={styles.buttonWrapper}>
            <Animated.View style={{ transform: [{ scale: declineButtonScale }] }}>
              <IconButton
                icon="phone-hangup"
                mode="contained"
                containerColor={callColors.danger}
                iconColor="white"
                size={32}
                onPress={handleDecline}
                onPressIn={() => {
                  Animated.spring(declineButtonScale, {
                    toValue: 0.9,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(declineButtonScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }}
                disabled={isDeclining || isAnswering}
                style={styles.actionButton}
              />
            </Animated.View>
            <Text style={[styles.buttonLabel, { color: callColors.textMuted }]}>
              {t('calls.actions.decline') || 'Reddet'}
            </Text>
          </View>

          {/* SMS ile Yanıtla */}
          <View style={styles.buttonWrapper}>
            <IconButton
              icon="message-text"
              mode="contained"
              containerColor={theme.colors.surfaceVariant}
              iconColor={callColors.text}
              size={28}
              onPress={() => setShowQuickReplies(true)}
              disabled={isDeclining || isAnswering}
              style={styles.secondaryButton}
            />
            <Text style={[styles.buttonLabel, { color: callColors.textMuted }]}>
              {t('calls.quickReply') || 'SMS'}
            </Text>
          </View>

          {/* Hatırlatıcı */}
          <View style={styles.buttonWrapper}>
            <IconButton
              icon="alarm"
              mode="contained"
              containerColor={theme.colors.surfaceVariant}
              iconColor={callColors.text}
              size={28}
              onPress={() => {
                // TODO: Hatırlatıcı ayarla
              }}
              disabled={isDeclining || isAnswering}
              style={styles.secondaryButton}
            />
            <Text style={[styles.buttonLabel, { color: callColors.textMuted }]}>
              {t('calls.reminder') || 'Hatırlat'}
            </Text>
          </View>

          {/* Cevapla Butonu */}
          <View style={styles.buttonWrapper}>
            <Animated.View style={{ transform: [{ scale: answerButtonScale }] }}>
              <IconButton
                icon="phone"
                mode="contained"
                containerColor={callColors.primary}
                iconColor="white"
                size={32}
                onPress={handleAnswer}
                onPressIn={() => {
                  Animated.spring(answerButtonScale, {
                    toValue: 0.9,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(answerButtonScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }}
                disabled={isDeclining || isAnswering}
                style={styles.actionButton}
              />
            </Animated.View>
            <Text style={[styles.buttonLabel, { color: callColors.textMuted }]}>
              {t('calls.actions.answer') || 'Cevapla'}
            </Text>
          </View>
        </View>
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
    </View>
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
    paddingTop: 60,
  },
  callLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  volteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  volteText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  callLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarRing: {
    padding: 8,
    borderRadius: 80,
    borderWidth: 3,
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  countryFlag: {
    fontSize: 20,
  },
  callerNumber: {
    fontSize: 18,
  },
  countryName: {
    fontSize: 14,
    marginBottom: 4,
  },
  callerCompany: {
    fontSize: 14,
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  swipeHint: {
    marginBottom: 40,
  },
  swipeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 40,
    padding: 8,
  },
  swipeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    fontSize: 14,
  },
  mainButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  buttonLabel: {
    fontSize: 12,
    marginTop: 8,
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
