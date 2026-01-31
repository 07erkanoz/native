/**
 * LifeCall - Answer Buttons Component
 *
 * Farklı cevaplama stilleri destekler:
 * - iOS: Kaydırmalı slider
 * - Android: İki buton
 * - Classic: Dört buton (reddet, sms, hatırlat, cevapla)
 * - Floating: Yüzen butonlar
 * - Minimal: Sadece iki ikon
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Vibration,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  CallThemeAnswerStyle,
  CallThemeColors,
  AnswerStyleType,
  ButtonAnimation,
} from '../../theme/callThemes';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

interface AnswerButtonsProps {
  answerStyle: CallThemeAnswerStyle;
  colors: CallThemeColors;
  onAnswer: () => void;
  onDecline: () => void;
  onMessage?: () => void;
  onReminder?: () => void;
  disabled?: boolean;
  labels?: {
    answer?: string;
    decline?: string;
    message?: string;
    reminder?: string;
    swipeToAnswer?: string;
  };
}

/**
 * Buton animasyonu hook'u - 15 farklı animasyon destekler
 */
const useButtonAnimation = (type: ButtonAnimation) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scaleXAnim = useRef(new Animated.Value(1)).current;
  const scaleYAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    switch (type) {
      case 'pulse':
        // Nabız atışı - smooth büyüyüp küçülme
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'glow':
        // Parlama efekti
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'bounce':
        // Zıplama efekti
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -12,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 0,
              friction: 3,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.delay(500),
          ])
        );
        break;

      case 'shake':
        // Titreşim efekti
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            Animated.delay(1000),
          ])
        );
        break;

      case 'rotate':
        // 360 derece döndürme
        animation = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        );
        break;

      case 'swing':
        // Sallanma (sarkaç)
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 0.05, duration: 300, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.05, duration: 600, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0.03, duration: 400, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.03, duration: 400, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.delay(500),
          ])
        );
        break;

      case 'heartbeat':
        // Kalp atışı - iki kez hızlı büyüme
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.delay(800),
          ])
        );
        break;

      case 'jello':
        // Jöle efekti - esnek eğilme
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleXAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 0.75, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleXAnim, { toValue: 0.75, duration: 100, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleXAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
              Animated.timing(scaleYAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(scaleXAnim, { toValue: 1, useNativeDriver: true }),
              Animated.spring(scaleYAnim, { toValue: 1, useNativeDriver: true }),
            ]),
            Animated.delay(1000),
          ])
        );
        break;

      case 'rubberBand':
        // Lastik efekti - yatay esnetme
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleXAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
            Animated.timing(scaleXAnim, { toValue: 0.75, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleXAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleXAnim, { toValue: 1, useNativeDriver: true }),
            Animated.delay(1200),
          ])
        );
        break;

      case 'tada':
        // Tada! - sallanma + büyüme
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -0.05, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0.05, duration: 100, useNativeDriver: true }),
            ]),
            Animated.timing(rotateAnim, { toValue: -0.05, duration: 100, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0.05, duration: 100, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.03, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]),
            Animated.delay(1500),
          ])
        );
        break;

      case 'wobble':
        // Wobble - yatay kayma + dönme
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(shakeAnim, { toValue: -25, duration: 150, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -0.02, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(shakeAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0.02, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(shakeAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -0.01, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(shakeAnim, { toValue: 10, duration: 150, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0.01, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(shakeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]),
            Animated.delay(1500),
          ])
        );
        break;

      case 'flash':
        // Yanıp sönme
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(800),
          ])
        );
        break;

      case 'fadeInOut':
        // Belirip kaybolma
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        );
        break;

      case 'ripple':
        // Dalga efekti (scale + opacity kombinasyonu)
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
          ])
        );
        break;
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      // Reset values
      scaleAnim.setValue(1);
      scaleXAnim.setValue(1);
      scaleYAnim.setValue(1);
      glowAnim.setValue(0);
      bounceAnim.setValue(0);
      shakeAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(1);
    };
  }, [type, scaleAnim, scaleXAnim, scaleYAnim, glowAnim, bounceAnim, shakeAnim, rotateAnim, opacityAnim]);

  // Rotate interpolation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    scaleAnim,
    scaleXAnim,
    scaleYAnim,
    glowAnim,
    bounceAnim,
    shakeAnim,
    rotateAnim: rotateInterpolate,
    opacityAnim,
  };
};

/**
 * iOS Tarzı Slider
 */
const IOSSlider: React.FC<AnswerButtonsProps> = ({
  colors,
  onAnswer,
  onDecline,
  disabled,
  labels,
  answerStyle,
}) => {
  const slideX = useRef(new Animated.Value(0)).current;
  const { glowAnim } = useButtonAnimation(answerStyle.animation);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        if (answerStyle.hapticFeedback) {
          Vibration.vibrate(10);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = Math.max(0, Math.min(gestureState.dx, width - 140));
        slideX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(slideX, {
            toValue: width - 140,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (answerStyle.hapticFeedback) {
              Vibration.vibrate(50);
            }
            onAnswer();
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.iosContainer}>
      {/* Decline Button */}
      <TouchableOpacity
        style={[styles.iosDeclineButton, { backgroundColor: colors.danger }]}
        onPress={onDecline}
        disabled={disabled}
      >
        <MaterialCommunityIcons name="phone-hangup" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Slider Track */}
      <View style={[styles.iosSliderTrack, { backgroundColor: colors.surface }]}>
        <Text style={[styles.iosSliderText, { color: colors.textMuted }]}>
          {labels?.swipeToAnswer || 'slide to answer'}
        </Text>

        {/* Slider Thumb */}
        <Animated.View
          style={[
            styles.iosSliderThumb,
            { backgroundColor: colors.primary, transform: [{ translateX: slideX }] },
            answerStyle.animation === 'glow' && {
              shadowColor: colors.primary,
              shadowOpacity: glowAnim,
              shadowRadius: 20,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <MaterialCommunityIcons name="phone" size={28} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * Android Tarzı Butonlar
 */
const AndroidButtons: React.FC<AnswerButtonsProps> = ({
  colors,
  onAnswer,
  onDecline,
  onMessage,
  onReminder,
  disabled,
  labels,
  answerStyle,
}) => {
  const { scaleAnim, bounceAnim } = useButtonAnimation(answerStyle.animation);

  const buttonSize = answerStyle.buttonSize === 'small' ? 56 : answerStyle.buttonSize === 'large' ? 72 : 64;
  const iconSize = answerStyle.buttonSize === 'small' ? 24 : answerStyle.buttonSize === 'large' ? 32 : 28;

  const getButtonRadius = () => {
    switch (answerStyle.buttonShape) {
      case 'rounded': return buttonSize / 4;
      case 'pill': return buttonSize / 2;
      default: return buttonSize / 2;
    }
  };

  return (
    <View style={styles.androidContainer}>
      {/* Decline */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.danger,
              width: buttonSize,
              height: buttonSize,
              borderRadius: getButtonRadius(),
            },
          ]}
          onPress={() => {
            if (answerStyle.hapticFeedback) Vibration.vibrate(10);
            onDecline();
          }}
          disabled={disabled}
        >
          <MaterialCommunityIcons name="phone-hangup" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
        {answerStyle.showLabels && (
          <Text style={[styles.buttonLabel, { color: colors.textMuted }]}>
            {labels?.decline || 'Decline'}
          </Text>
        )}
      </View>

      {/* Message (optional) */}
      {onMessage && (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.surface,
                borderRadius: getButtonRadius(),
              },
            ]}
            onPress={onMessage}
            disabled={disabled}
          >
            <MaterialCommunityIcons name="message-text" size={24} color={colors.text} />
          </TouchableOpacity>
          {answerStyle.showLabels && (
            <Text style={[styles.buttonLabel, { color: colors.textMuted }]}>
              {labels?.message || 'Message'}
            </Text>
          )}
        </View>
      )}

      {/* Reminder (optional) */}
      {onReminder && (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.surface,
                borderRadius: getButtonRadius(),
              },
            ]}
            onPress={onReminder}
            disabled={disabled}
          >
            <MaterialCommunityIcons name="alarm" size={24} color={colors.text} />
          </TouchableOpacity>
          {answerStyle.showLabels && (
            <Text style={[styles.buttonLabel, { color: colors.textMuted }]}>
              {labels?.reminder || 'Remind'}
            </Text>
          )}
        </View>
      )}

      {/* Answer */}
      <View style={styles.buttonWrapper}>
        <Animated.View
          style={{
            transform: [
              { scale: answerStyle.animation === 'pulse' ? scaleAnim : 1 },
              { translateY: answerStyle.animation === 'bounce' ? bounceAnim : 0 },
            ],
          }}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                width: buttonSize,
                height: buttonSize,
                borderRadius: getButtonRadius(),
              },
            ]}
            onPress={() => {
              if (answerStyle.hapticFeedback) Vibration.vibrate(10);
              onAnswer();
            }}
            disabled={disabled}
          >
            <MaterialCommunityIcons name="phone" size={iconSize} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        {answerStyle.showLabels && (
          <Text style={[styles.buttonLabel, { color: colors.textMuted }]}>
            {labels?.answer || 'Answer'}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Floating Butonlar
 */
const FloatingButtons: React.FC<AnswerButtonsProps> = ({
  colors,
  onAnswer,
  onDecline,
  disabled,
  labels,
  answerStyle,
}) => {
  const { scaleAnim, glowAnim } = useButtonAnimation(answerStyle.animation);

  return (
    <View style={styles.floatingContainer}>
      <Animated.View
        style={[
          styles.floatingButton,
          { backgroundColor: colors.danger },
          answerStyle.animation === 'glow' && {
            shadowColor: colors.danger,
            shadowOpacity: glowAnim,
            shadowRadius: 25,
          },
        ]}
      >
        <TouchableOpacity onPress={onDecline} disabled={disabled} style={styles.floatingTouchable}>
          <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingButton,
          { backgroundColor: colors.primary },
          { transform: [{ scale: scaleAnim }] },
          answerStyle.animation === 'glow' && {
            shadowColor: colors.primary,
            shadowOpacity: glowAnim,
            shadowRadius: 25,
          },
        ]}
      >
        <TouchableOpacity onPress={onAnswer} disabled={disabled} style={styles.floatingTouchable}>
          <MaterialCommunityIcons name="phone" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/**
 * Minimal Butonlar
 */
const MinimalButtons: React.FC<AnswerButtonsProps> = ({
  colors,
  onAnswer,
  onDecline,
  disabled,
}) => {
  return (
    <View style={styles.minimalContainer}>
      <TouchableOpacity
        style={[styles.minimalButton, { borderColor: colors.danger }]}
        onPress={onDecline}
        disabled={disabled}
      >
        <MaterialCommunityIcons name="phone-hangup" size={36} color={colors.danger} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.minimalButton, { borderColor: colors.primary }]}
        onPress={onAnswer}
        disabled={disabled}
      >
        <MaterialCommunityIcons name="phone" size={36} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Classic Butonlar (Swipe + Buttons)
 */
const ClassicButtons: React.FC<AnswerButtonsProps> = (props) => {
  return <AndroidButtons {...props} />;
};

/**
 * Ana Answer Buttons Bileşeni
 */
const AnswerButtons: React.FC<AnswerButtonsProps> = (props) => {
  const { answerStyle } = props;

  switch (answerStyle.type) {
    case 'ios':
      return <IOSSlider {...props} />;
    case 'floating':
      return <FloatingButtons {...props} />;
    case 'minimal':
      return <MinimalButtons {...props} />;
    case 'classic':
      return <ClassicButtons {...props} />;
    case 'android':
    default:
      return <AndroidButtons {...props} />;
  }
};

const styles = StyleSheet.create({
  // iOS Slider
  iosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  iosDeclineButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosSliderTrack: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iosSliderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  iosSliderThumb: {
    position: 'absolute',
    left: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Android Buttons
  androidContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  // Floating Buttons
  floatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  floatingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Minimal Buttons
  minimalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  minimalButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default AnswerButtons;
