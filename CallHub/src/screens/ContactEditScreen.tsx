/**
 * LifeCall - Kişi Düzenleme/Ekleme Ekranı
 * Placeholder - Tam implementasyon daha sonra
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'ContactEdit'>;

const ContactEditScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const contactId = route.params?.contactId;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
        {contactId ? t('contacts.editContact') : t('contacts.newContact')}
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

export default ContactEditScreen;
