/**
 * LifeCall - Call Background Component
 *
 * Arama ekranı arka planı - Renk, gradient, resim veya video destekler
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { CallThemeBackground, getGradientAngles } from '../../theme/callThemes';

const { width, height } = Dimensions.get('window');

interface CallBackgroundProps {
  background: CallThemeBackground;
  animation?: 'none' | 'slow-zoom' | 'pan' | 'pulse';
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Arama ekranı arka plan bileşeni
 */
const CallBackground: React.FC<CallBackgroundProps> = ({
  background,
  animation = 'none',
  children,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const panAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [videoError, setVideoError] = useState(false);

  // Animasyonları başlat
  useEffect(() => {
    if (animation === 'slow-zoom') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'pan') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(panAnim, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(panAnim, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      scaleAnim.stopAnimation();
      panAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [animation, scaleAnim, panAnim, pulseAnim]);

  // Animasyon transformları
  const animatedTransform = useMemo(() => {
    if (animation === 'slow-zoom') {
      return { transform: [{ scale: scaleAnim }] };
    } else if (animation === 'pan') {
      return {
        transform: [
          {
            translateX: panAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -50],
            }),
          },
        ],
      };
    } else if (animation === 'pulse') {
      return { transform: [{ scale: pulseAnim }] };
    }
    return {};
  }, [animation, scaleAnim, panAnim, pulseAnim]);

  // Gradient açıları
  const gradientAngles = useMemo(() => {
    if (background.type === 'gradient' && background.gradientDirection) {
      return getGradientAngles(background.gradientDirection);
    }
    return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
  }, [background]);

  // Overlay bileşeni
  const renderOverlay = () => {
    if (background.overlay && background.overlayOpacity) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: background.overlay,
              opacity: background.overlayOpacity,
            },
          ]}
        />
      );
    }
    return null;
  };

  // Solid arka plan
  if (background.type === 'solid') {
    return (
      <View style={[styles.container, { backgroundColor: background.color || '#000000' }, style]}>
        {renderOverlay()}
        {children}
      </View>
    );
  }

  // Gradient arka plan
  if (background.type === 'gradient' && background.gradientColors) {
    return (
      <Animated.View style={[styles.container, animatedTransform, style]}>
        <LinearGradient
          colors={background.gradientColors}
          start={gradientAngles.start}
          end={gradientAngles.end}
          style={StyleSheet.absoluteFill}
        />
        {renderOverlay()}
        {children}
      </Animated.View>
    );
  }

  // Resim arka plan
  if (background.type === 'image' && (background.uri || background.localAsset)) {
    const imageSource = background.localAsset
      ? { uri: background.localAsset }
      : { uri: background.uri };

    return (
      <ImageBackground
        source={imageSource}
        style={[styles.container, style]}
        imageStyle={[
          styles.backgroundImage,
          animation !== 'none' && styles.backgroundImageAnimated,
        ]}
        blurRadius={background.blur || 0}
        resizeMode="cover"
      >
        {renderOverlay()}
        {children}
      </ImageBackground>
    );
  }

  // Video arka plan
  if (background.type === 'video' && (background.uri || background.localAsset) && !videoError) {
    const videoSource = background.localAsset
      ? { uri: background.localAsset }
      : { uri: background.uri };

    return (
      <View style={[styles.container, style]}>
        <Video
          source={videoSource}
          style={styles.video}
          resizeMode="cover"
          repeat
          muted
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onError={(error) => {
            console.warn('Video yüklenemedi:', error);
            setVideoError(true);
          }}
        />
        {renderOverlay()}
        {background.blur && background.blur > 0 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.3)' },
            ]}
          />
        )}
        {children}
      </View>
    );
  }

  // Fallback - siyah arka plan
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }, style]}>
      {renderOverlay()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  backgroundImageAnimated: {
    width: width * 1.2,
    height: height * 1.2,
    marginLeft: -width * 0.1,
    marginTop: -height * 0.1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CallBackground;
