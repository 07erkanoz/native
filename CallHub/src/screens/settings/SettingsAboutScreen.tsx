/**
 * LifeCall - Hakkında Ekranı
 * Lifeos branding ve uygulama bilgileri
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { List, Text, Divider, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme';

// App version - package.json'dan alınacak
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

// Lifeos links
const LIFEOS_LINKS = {
  website: 'https://lifeos.app',
  privacy: 'https://lifeos.app/privacy',
  terms: 'https://lifeos.app/terms',
  support: 'mailto:support@lifeos.app',
  twitter: 'https://twitter.com/lifeosapp',
  instagram: 'https://instagram.com/lifeosapp',
};

const SettingsAboutScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Link açılamadı:', err));
  };

  const openPlayStore = () => {
    const packageName = 'com.lifeos.lifecall';
    const url = Platform.select({
      android: `market://details?id=${packageName}`,
      ios: `itms-apps://itunes.apple.com/app/id123456789`, // TODO: App Store ID
      default: `https://play.google.com/store/apps/details?id=${packageName}`,
    });
    Linking.openURL(url as string).catch(() => {
      // Fallback web linki
      Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
    });
  };

  const renderIcon = (name: string, color?: string) => (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={color || theme.colors.onSurfaceVariant}
      style={styles.icon}
    />
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Lifeos Branding Header */}
      <Surface style={[styles.brandingCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {/* Lifeos Logo Area */}
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={48}
            color="#FFFFFF"
          />
        </View>

        {/* App Name */}
        <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.onSurface }]}>
          LifeCall
        </Text>

        {/* By Lifeos */}
        <Text variant="bodyMedium" style={[styles.byLifeos, { color: theme.colors.primary }]}>
          {t('about.byLifeos')}
        </Text>

        {/* Version */}
        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          {t('about.version')} {APP_VERSION} ({BUILD_NUMBER})
        </Text>

        {/* Description */}
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {t('about.appDescription')}
        </Text>
      </Surface>

      {/* Lifeos Ecosystem */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('about.lifeos')}
        </Text>
        <Surface style={[styles.ecosystemCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <MaterialCommunityIcons
            name="infinity"
            size={32}
            color={theme.colors.primary}
          />
          <Text variant="bodyMedium" style={[styles.ecosystemText, { color: theme.colors.onSurface }]}>
            {t('about.lifeosDescription')}
          </Text>
          <TouchableOpacity
            style={[styles.websiteButton, { borderColor: theme.colors.primary }]}
            onPress={() => openLink(LIFEOS_LINKS.website)}
          >
            <Text style={[styles.websiteButtonText, { color: theme.colors.primary }]}>
              {t('about.visitWebsite')}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </Surface>
      </View>

      <Divider style={styles.divider} />

      {/* Legal Links */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('about.legal')}
        </Text>

        <List.Item
          title={t('about.privacyPolicy')}
          left={() => renderIcon('shield-lock')}
          right={() => renderIcon('open-in-new')}
          onPress={() => openLink(LIFEOS_LINKS.privacy)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
        <List.Item
          title={t('about.termsOfService')}
          left={() => renderIcon('file-document')}
          right={() => renderIcon('open-in-new')}
          onPress={() => openLink(LIFEOS_LINKS.terms)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </View>

      <Divider style={styles.divider} />

      {/* Support */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('about.support')}
        </Text>

        <List.Item
          title={t('about.rateApp')}
          description={t('about.rateAppDesc')}
          left={() => renderIcon('star', '#FFD700')}
          right={() => renderIcon('chevron-right')}
          onPress={openPlayStore}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
        <List.Item
          title={t('about.contactSupport')}
          description={t('about.contactSupportDesc')}
          left={() => renderIcon('email')}
          right={() => renderIcon('open-in-new')}
          onPress={() => openLink(LIFEOS_LINKS.support)}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      </View>

      <Divider style={styles.divider} />

      {/* Social Media */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('about.followUs')}
        </Text>

        <View style={styles.socialLinks}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => openLink(LIFEOS_LINKS.twitter)}
          >
            <MaterialCommunityIcons name="twitter" size={28} color="#1DA1F2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => openLink(LIFEOS_LINKS.instagram)}
          >
            <MaterialCommunityIcons name="instagram" size={28} color="#E4405F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => openLink(LIFEOS_LINKS.website)}
          >
            <MaterialCommunityIcons name="web" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="heart"
          size={16}
          color={theme.colors.error}
        />
        <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          {t('about.madeWithLove')}
        </Text>
      </View>

      {/* Copyright */}
      <Text variant="bodySmall" style={[styles.copyright, { color: theme.colors.onSurfaceVariant }]}>
        © 2026 Lifeos. {t('about.allRightsReserved')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  brandingCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  byLifeos: {
    fontWeight: '600',
    marginBottom: 8,
  },
  version: {
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: '600',
  },
  ecosystemCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ecosystemText: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  websiteButtonText: {
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 4,
  },
  icon: {
    marginLeft: 16,
    alignSelf: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontWeight: '500',
  },
  copyright: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});

export default SettingsAboutScreen;
