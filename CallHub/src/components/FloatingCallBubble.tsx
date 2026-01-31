/**
 * LifeCall - Floating Çağrı Balonu
 *
 * Uygulama arka plandayken gösterilen yüzen çağrı balonu
 * - Arayan avatar/isim
 * - Çağrı süresi
 * - Dokunarak çağrı ekranına dönme
 * - Sürüklenebilir
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Text,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Avatar } from './Avatar';
import { useAppTheme } from '../theme';
import callStateManager, { ActiveCall } from '../services/CallStateManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 70;
const MARGIN = 10;

interface Props {
  call: ActiveCall;
  onPress: () => void;
  onEndCall: () => void;
}

export const FloatingCallBubble: React.FC<Props> = ({ call, onPress, onEndCall }) => {
  const { theme } = useAppTheme();
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);

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
  }), [theme]);

  // Pozisyon animasyonu
  const position = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - MARGIN, y: 100 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Süre takibi
  useEffect(() => {
    const handleDurationTick = (seconds: number) => {
      setDuration(seconds);
    };

    callStateManager.on('durationTick', handleDurationTick);

    return () => {
      callStateManager.off('durationTick', handleDurationTick);
    };
  }, []);

  // Sürükleme gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Hafif hareketlerde sürükleme başlatma
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        position.setOffset({
          x: (position.x as any)._value,
          y: (position.y as any)._value,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        position.flattenOffset();

        // Ekran kenarına yapış
        const currentX = gestureState.moveX;
        const targetX = currentX < SCREEN_WIDTH / 2 ? MARGIN : SCREEN_WIDTH - BUBBLE_SIZE - MARGIN;

        // Y pozisyonunu sınırla
        let targetY = (position.y as any)._value;
        if (targetY < MARGIN + 50) targetY = MARGIN + 50; // StatusBar altında
        if (targetY > SCREEN_HEIGHT - BUBBLE_SIZE - 100) targetY = SCREEN_HEIGHT - BUBBLE_SIZE - 100;

        Animated.spring(position, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // Süre formatla
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Genişlet/daralt
  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.spring(scale, {
      toValue: expanded ? 1 : 1.1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale: scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Ana Balon */}
      <TouchableOpacity
        style={[styles.bubble, { backgroundColor: callColors.background, borderColor: callColors.primary }]}
        onPress={onPress}
        onLongPress={toggleExpand}
        activeOpacity={0.9}
      >
        {/* Pulse Animasyonu */}
        <View style={[styles.pulseRing, { borderColor: callColors.primary }]} />

        {/* Avatar */}
        <Avatar
          name={call.displayName || call.phoneNumber}
          photoUri={call.photoUri}
          size={BUBBLE_SIZE - 10}
        />

        {/* Süre Badge */}
        {call.state === 'connected' && (
          <View style={[styles.durationBadge, { backgroundColor: callColors.primary }]}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        )}

        {/* Durum İndikatörü */}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: callColors.primary, borderColor: callColors.background },
            call.state === 'connected' && { backgroundColor: callColors.primary },
            call.state === 'on_hold' && { backgroundColor: callColors.warning },
            call.state === 'incoming' && { backgroundColor: theme.colors.info },
          ]}
        />
      </TouchableOpacity>

      {/* Genişletilmiş Kontroller */}
      {expanded && (
        <View style={[styles.expandedControls, { backgroundColor: callColors.background }]}>
          {/* Sessiz */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callColors.surfaceVariant },
              call.isMuted && { backgroundColor: callColors.primary }
            ]}
            onPress={() => callStateManager.toggleMute()}
          >
            <MaterialCommunityIcons
              name={call.isMuted ? 'microphone-off' : 'microphone'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          {/* Kapat */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: callColors.danger }]}
            onPress={onEndCall}
          >
            <MaterialCommunityIcons name="phone-hangup" size={20} color="white" />
          </TouchableOpacity>

          {/* Hoparlör */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callColors.surfaceVariant },
              call.isSpeakerOn && { backgroundColor: callColors.primary }
            ]}
            onPress={() => callStateManager.toggleSpeaker()}
          >
            <MaterialCommunityIcons
              name={call.isSpeakerOn ? 'volume-high' : 'volume-medium'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    opacity: 0.5,
  },
  durationBadge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  expandedControls: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 25,
    padding: 8,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingCallBubble;
