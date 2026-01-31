/**
 * LifeCall - Favori Kartı Bileşeni
 *
 * Grid görünümünde favori kişi kartı
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useAppTheme } from '../theme';
import Avatar from './Avatar';
import { FavoriteContact } from '../types';

// Kart boyutları
export type CardSize = 'small' | 'medium' | 'large';

const CARD_SIZES: Record<CardSize, { width: number; avatarSize: 'medium' | 'large' | 'xlarge' }> = {
  small: { width: 80, avatarSize: 'medium' },
  medium: { width: 100, avatarSize: 'large' },
  large: { width: 120, avatarSize: 'xlarge' },
};

interface FavoriteCardProps {
  favorite: FavoriteContact;
  size?: CardSize;
  isEditMode?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({
  favorite,
  size = 'medium',
  isEditMode = false,
  onPress,
  onRemove,
}) => {
  const { theme } = useAppTheme();
  const cardConfig = CARD_SIZES[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardConfig.width },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isEditMode}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          name={favorite.displayName}
          photoUri={favorite.photoUri}
          size={cardConfig.avatarSize}
        />

        {/* Edit mode X butonu */}
        {isEditMode && (
          <IconButton
            icon="close-circle"
            size={24}
            iconColor={theme.colors.error}
            style={styles.removeButton}
            onPress={onRemove}
          />
        )}
      </View>

      <Text
        variant="bodySmall"
        style={[styles.name, { color: theme.colors.onSurface }]}
        numberOfLines={2}
      >
        {favorite.displayName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
  },
  name: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default FavoriteCard;
