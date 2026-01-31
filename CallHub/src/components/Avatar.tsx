/**
 * LifeCall - Avatar Bileşeni
 *
 * Kişi avatarı gösterimi
 * - Fotoğraf varsa fotoğrafı gösterir
 * - Yoksa isim baş harfleri ile otomatik avatar oluşturur
 * - Hesap ikonu gösterilebilir
 */

import React, { useMemo } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme';
import { getAvatarColor, getInitials, ACCOUNT_COLORS } from '../theme/colors';
import { AccountType } from '../types';

// Avatar boyutları
export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

// Boyut değerleri
const SIZES: Record<AvatarSize, number> = {
  small: 36,
  medium: 48,
  large: 64,
  xlarge: 120,
};

// Font boyutları
const FONT_SIZES: Record<AvatarSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
  xlarge: 44,
};

// Props
interface AvatarProps {
  name: string;
  photoUri?: string | null;
  size?: AvatarSize;
  accountType?: AccountType;
  showAccountBadge?: boolean;
  style?: object;
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUri,
  size = 'medium',
  accountType,
  showAccountBadge = false,
  style,
}) => {
  const { theme } = useAppTheme();
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  // İsimden renk ve baş harfleri hesapla
  const backgroundColor = useMemo(() => getAvatarColor(name), [name]);
  const initials = useMemo(() => getInitials(name), [name]);

  // Hesap ikonu
  const accountIcon = useMemo(() => {
    const icons: Record<AccountType, string> = {
      google: 'google',
      samsung: 'samsung',
      phone: 'cellphone',
      whatsapp: 'whatsapp',
      telegram: 'telegram',
      microsoft: 'microsoft',
      other: 'account',
    };
    return accountType ? icons[accountType] : null;
  }, [accountType]);

  const accountColor = accountType ? ACCOUNT_COLORS[accountType] : undefined;

  // Badge boyutu
  const badgeSize = size === 'xlarge' ? 32 : size === 'large' ? 24 : 18;

  return (
    <View style={[styles.container, { width: dimension, height: dimension }, style]}>
      {photoUri ? (
        // Fotoğraf var
        <Image
          source={{ uri: photoUri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        // Fotoğraf yok - baş harfler
        <View
          style={[
            styles.initialsContainer,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              {
                fontSize,
                color: theme.colors.avatarText,
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Hesap badge'i */}
      {showAccountBadge && accountIcon && accountColor && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: accountColor,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={accountIcon}
            size={badgeSize * 0.6}
            color="#FFFFFF"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#E0E0E0',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default Avatar;
