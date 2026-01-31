/**
 * LifeCall - Dil Ayarları Ekranı
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, RadioButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme';
import {
  getAllLanguages,
  getCurrentLanguage,
  changeLanguage,
  LanguageCode,
} from '../../i18n';

const SettingsLanguageScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const languages = getAllLanguages();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await changeLanguage(langCode);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        {t('settings.appearance.language')}
      </Text>

      <RadioButton.Group
        onValueChange={(value) => handleLanguageChange(value as LanguageCode)}
        value={currentLanguage}
      >
        {languages.map((lang) => (
          <List.Item
            key={lang.code}
            title={lang.nativeName}
            description={lang.name}
            right={() => (
              <RadioButton value={lang.code} color={theme.colors.primary} />
            )}
            onPress={() => handleLanguageChange(lang.code)}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        ))}
      </RadioButton.Group>

      {/* RTL uyarısı */}
      <Text variant="bodySmall" style={[styles.rtlNote, { color: theme.colors.onSurfaceVariant }]}>
        * العربية (Arabic) requires app restart for RTL layout
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    padding: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  rtlNote: {
    padding: 16,
    fontStyle: 'italic',
  },
});

export default SettingsLanguageScreen;
