/**
 * LifeCall - Görünüm Ayarları Ekranı
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, RadioButton, Text, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, ThemeMode } from '../../theme';

const SettingsAppearanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, themeMode, setThemeMode } = useAppTheme();
  const navigation = useNavigation();

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: t('settings.appearance.themeLight'), icon: 'white-balance-sunny' },
    { value: 'dark', label: t('settings.appearance.themeDark'), icon: 'moon-waning-crescent' },
    { value: 'system', label: t('settings.appearance.themeSystem'), icon: 'cellphone' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {t('settings.appearance.theme')}
      </Text>

      <RadioButton.Group
        onValueChange={(value) => setThemeMode(value as ThemeMode)}
        value={themeMode}
      >
        {themeOptions.map((option) => (
          <List.Item
            key={option.value}
            title={option.label}
            left={() => (
              <MaterialCommunityIcons
                name={option.icon}
                size={24}
                color={theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
            )}
            right={() => (
              <RadioButton value={option.value} color={theme.colors.primary} />
            )}
            onPress={() => setThemeMode(option.value)}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            titleStyle={{ color: theme.colors.onSurface }}
          />
        ))}
      </RadioButton.Group>

      <Divider style={styles.divider} />

      <List.Item
        title={t('settings.appearance.language')}
        left={() => (
          <MaterialCommunityIcons
            name="translate"
            size={24}
            color={theme.colors.onSurfaceVariant}
            style={styles.icon}
          />
        )}
        right={() => (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        )}
        onPress={() => navigation.navigate('SettingsLanguage' as never)}
        style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
        titleStyle={{ color: theme.colors.onSurface }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 8,
  },
  icon: {
    marginLeft: 16,
    alignSelf: 'center',
  },
  divider: {
    marginVertical: 16,
  },
});

export default SettingsAppearanceScreen;
