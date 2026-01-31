/**
 * LifeCall - Floating Gelen Arama Bildirimi
 *
 * Uygulama arka plandayken gelen aramalar için mini popup
 * - Arayan bilgisi (isim, numara, avatar)
 * - Cevapla / Reddet / Sessiz butonları
 * - Yukarıdan aşağı animasyonlu görünüm
 * - Tema mağazası desteği
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Text,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Avatar } from './Avatar';
import { useAppTheme } from '../theme';
import { ActiveCall } from '../services/CallStateManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NOTIFICATION_WIDTH = SCREEN_WIDTH - 32;
const NOTIFICATION_HEIGHT = 100;

interface Props {
  call: ActiveCall;
  onAnswer: () => void;
  onDecline: () => void;
  onSilence: () => void;
  onExpand: () => void;
}

export const FloatingCallNotification: React.FC<Props> = ({
  call,
  onAnswer,
  onDecline,
  onSilence,
  onExpand,
}) => {
  const { theme } = useAppTheme();
  const [isSilenced, setIsSilenced] = useState(false);

  // Tema renkleri - mağazadan gelen tema ile uyumlu
  const callColors = useMemo(() => ({
    background: theme.colors.callBackground,
    primary: theme.colors.callPrimary,
    danger: theme.colors.callDanger,
    text: theme.colors.onSurface,
    textMuted: theme.colors.onSurfaceVariant,
    surface: theme.colors.surface,
    surfaceVariant: theme.colors.surfaceVariant,
    border: theme.colors.outlineVariant,
  }), [theme]);

  // Animasyonlar
  const translateY = useRef(new Animated.Value(-NOTIFICATION_HEIGHT - 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Giriş animasyonu
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animasyonu
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  // Çıkış animasyonu
  const animateOut = (callback: () => void) => {
    Vibration.cancel();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -NOTIFICATION_HEIGHT - 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  // Sessiz
  const handleSilence = () => {
    setIsSilenced(true);
    Vibration.cancel();
    onSilence();
  };

  // Cevapla
  const handleAnswer = () => {
    animateOut(onAnswer);
  };

  // Reddet
  const handleDecline = () => {
    animateOut(onDecline);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale: pulseAnim }],
          opacity,
        },
      ]}
    >
      {/* Ana Bildirim Kartı */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: callColors.background,
            borderColor: callColors.border,
          },
        ]}
        activeOpacity={0.95}
        onPress={onExpand}
      >
        {/* Sol Taraf - Avatar ve Bilgi */}
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={call.displayName || call.phoneNumber}
              photoUri={call.photoUri}
              size={50}
            />
            {/* Çalma indikatörü */}
            <View
              style={[
                styles.ringingIndicator,
                {
                  backgroundColor: callColors.primary,
                  borderColor: callColors.background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isSilenced ? 'bell-off' : 'phone-ring'}
                size={12}
                color="white"
              />
            </View>
          </View>

          <View style={styles.callerInfo}>
            <Text style={[styles.callerName, { color: callColors.text }]} numberOfLines={1}>
              {call.displayName || 'Bilinmeyen'}
            </Text>
            <Text style={[styles.callerNumber, { color: callColors.textMuted }]} numberOfLines={1}>
              {call.phoneNumber}
            </Text>
            <Text style={[styles.callLabel, { color: callColors.primary }]}>Gelen Arama</Text>
          </View>
        </View>

        {/* Sağ Taraf - Butonlar */}
        <View style={styles.rightSection}>
          {/* Sessiz */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: callColors.surfaceVariant },
              isSilenced && styles.silencedButton,
            ]}
            onPress={handleSilence}
            disabled={isSilenced}
          >
            <MaterialCommunityIcons
              name={isSilenced ? 'bell-off' : 'bell-cancel'}
              size={20}
              color={callColors.text}
            />
          </TouchableOpacity>

          {/* Reddet */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: callColors.danger }]}
            onPress={handleDecline}
          >
            <MaterialCommunityIcons name="phone-hangup" size={22} color="white" />
          </TouchableOpacity>

          {/* Cevapla */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: callColors.primary }]}
            onPress={handleAnswer}
          >
            <MaterialCommunityIcons name="phone" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Genişlet ipucu */}
      <View style={styles.expandHint}>
        <View style={[styles.expandLine, { backgroundColor: callColors.textMuted }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // StatusBar altında
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    width: NOTIFICATION_WIDTH,
    height: NOTIFICATION_HEIGHT,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  ringingIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  callerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  callerNumber: {
    fontSize: 13,
    marginTop: 2,
  },
  callLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silencedButton: {
    opacity: 0.5,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
});

export default FloatingCallNotification;
