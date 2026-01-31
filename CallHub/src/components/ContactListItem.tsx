/**
 * LifeCall - Kişi Liste Öğesi Bileşeni
 *
 * Kişi listesinde gösterilen tek bir kişi
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme';
import Avatar from './Avatar';
import { Contact } from '../types';

interface ContactListItemProps {
  contact: Contact;
  onPress?: () => void;
  onLongPress?: () => void;
  showAccountBadge?: boolean;
  showPhoneNumber?: boolean;
  rightAction?: React.ReactNode;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  onPress,
  onLongPress,
  showAccountBadge = false,
  showPhoneNumber = true,
  rightAction,
}) => {
  const { theme } = useAppTheme();

  // Ana telefon numarası
  const primaryPhone = contact.phoneNumbers.find((p) => p.isPrimary) ||
    contact.phoneNumbers[0];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Avatar
        name={contact.displayName}
        photoUri={contact.photoUri}
        size="medium"
        accountType={contact.accountType}
        showAccountBadge={showAccountBadge}
      />

      <View style={styles.content}>
        <Text
          variant="bodyLarge"
          style={[styles.name, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {contact.displayName}
        </Text>

        {showPhoneNumber && primaryPhone && (
          <Text
            variant="bodyMedium"
            style={[styles.phone, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {primaryPhone.formattedNumber || primaryPhone.number}
          </Text>
        )}
      </View>

      {contact.isFavorite && (
        <MaterialCommunityIcons
          name="star"
          size={20}
          color={theme.colors.tertiary}
          style={styles.favoriteIcon}
        />
      )}

      {rightAction}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: '500',
  },
  phone: {
    marginTop: 2,
  },
  favoriteIcon: {
    marginLeft: 8,
  },
});

export default ContactListItem;
