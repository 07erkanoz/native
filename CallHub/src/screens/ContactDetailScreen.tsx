/**
 * LifeCall - Kişi Detay Ekranı
 * Placeholder - Tam implementasyon daha sonra
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'ContactDetail'>;

const ContactDetailScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useAppTheme();
  const { contactId } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
        Contact Detail
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        ID: {contactId}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default ContactDetailScreen;
