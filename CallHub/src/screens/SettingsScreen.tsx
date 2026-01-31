/**
 * LifeCall - Ayarlar Ekranı
 * Placeholder - Tam implementasyon daha sonra
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme';
import { RootStackScreenProps } from '../navigation/types';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<RootStackScreenProps<'Main'>['navigation']>();

  const renderIcon = (name: string, color?: string) => (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={color || theme.colors.primary}
    />
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        {t('settings.title')}
      </Text>

      {/* Görünüm */}
      <List.Section>
        <List.Item
          title={t('settings.appearance.title')}
          description={t('settings.appearance.theme')}
          left={() => renderIcon('palette')}
          onPress={() => navigation.navigate('SettingsAppearance')}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
        <Divider />
        <List.Item
          title={t('settings.appearance.language')}
          left={() => renderIcon('translate')}
          onPress={() => navigation.navigate('SettingsLanguage')}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </List.Section>

      {/* Kişiler */}
      <List.Section>
        <List.Item
          title={t('settings.contacts.title')}
          left={() => renderIcon('account-group')}
          onPress={() => navigation.navigate('SettingsContacts' as any)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </List.Section>

      {/* Aramalar */}
      <List.Section>
        <List.Item
          title={t('settings.calls.title')}
          left={() => renderIcon('phone')}
          onPress={() => navigation.navigate('SettingsCalls' as any)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </List.Section>

      {/* Mağaza */}
      <List.Section>
        <List.Item
          title={t('store.themes')}
          left={() => renderIcon('brush')}
          onPress={() => navigation.navigate('ThemeStore')}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </List.Section>

      {/* Hakkında */}
      <List.Section>
        <List.Item
          title={t('settings.about.title')}
          left={() => renderIcon('information')}
          onPress={() => navigation.navigate('SettingsAbout' as any)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    padding: 20,
    paddingTop: 60,
    fontWeight: 'bold',
  },
  listItem: {
    paddingVertical: 8,
  },
});

export default SettingsScreen;
