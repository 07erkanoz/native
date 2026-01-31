/**
 * LifeCall - Arama Teması Seçim Ekranı
 *
 * Kullanıcıların gelen arama ekranı temasını seçmesine olanak tanır
 * - 16 hazır tema
 * - Tema önizleme
 * - Özel tema oluşturma (ileride)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Surface, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme, useCallTheme, CallTheme, getGradientAngles } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

interface ThemeCardProps {
  theme: CallTheme;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Tema önizleme kartı
 */
const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isSelected, onSelect }) => {
  const { t } = useTranslation();

  // Gradient açıları
  const gradientAngles = useMemo(() => {
    if (theme.background.type === 'gradient' && theme.background.gradientDirection) {
      return getGradientAngles(theme.background.gradientDirection);
    }
    return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
  }, [theme.background]);

  // Arka plan render
  const renderBackground = () => {
    if (theme.background.type === 'gradient' && theme.background.gradientColors) {
      return (
        <LinearGradient
          colors={theme.background.gradientColors}
          start={gradientAngles.start}
          end={gradientAngles.end}
          style={StyleSheet.absoluteFill}
        />
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.background.color || '#000000' },
        ]}
      />
    );
  };

  // Tema adını çevir
  const themeName = theme.nameKey ? t(theme.nameKey) || theme.name : theme.name;

  return (
    <TouchableOpacity
      style={[
        styles.themeCard,
        isSelected && styles.themeCardSelected,
        isSelected && { borderColor: theme.colors.primary },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Arka plan */}
      <View style={styles.cardBackground}>
        {renderBackground()}

        {/* Overlay */}
        {theme.background.overlay && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.background.overlay,
                opacity: theme.background.overlayOpacity || 0.3,
              },
            ]}
          />
        )}

        {/* Mini önizleme - Avatar placeholder */}
        <View style={styles.previewContent}>
          <View
            style={[
              styles.miniAvatar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.avatar.ringColor || theme.colors.primary,
                borderWidth: theme.avatar.ringStyle !== 'none' ? 2 : 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={theme.colors.text}
            />
          </View>

          <View style={styles.miniTextContainer}>
            <View
              style={[styles.miniTextLine, { backgroundColor: theme.colors.text, width: 60 }]}
            />
            <View
              style={[styles.miniTextLine, { backgroundColor: theme.colors.textMuted, width: 40 }]}
            />
          </View>

          {/* Mini butonlar */}
          <View style={styles.miniButtons}>
            <View
              style={[styles.miniButton, { backgroundColor: theme.colors.danger }]}
            />
            <View
              style={[styles.miniButton, { backgroundColor: theme.colors.primary }]}
            />
          </View>
        </View>

        {/* Seçili işareti */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Tema adı */}
      <View style={styles.cardFooter}>
        <Text style={styles.themeName} numberOfLines={1}>
          {themeName}
        </Text>
        {theme.isPremium && (
          <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Ana tema seçim ekranı
 */
const SettingsCallThemeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { activeThemeId, setActiveTheme, defaultThemes, customThemes } = useCallTheme();

  // Kategorilere göre temalar
  const themeCategories = useMemo(() => {
    return {
      popular: defaultThemes.slice(0, 4), // İlk 4 tema
      dark: defaultThemes.filter(th =>
        th.background.type === 'gradient' ||
        (th.background.type === 'solid' && (th.background.color?.startsWith('#0') || th.background.color?.startsWith('#1')))
      ),
      colorful: defaultThemes.filter(th =>
        th.id === 'sunset' || th.id === 'neon' || th.id === 'aurora' || th.id === 'fire' || th.id === 'galaxy'
      ),
      minimal: defaultThemes.filter(th =>
        th.id === 'minimal' || th.id === 'ios-style' || th.id === 'pure-white'
      ),
      custom: customThemes,
    };
  }, [defaultThemes, customThemes]);

  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Başlık ve açıklama */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          {t('callThemes.title') || 'Arama Teması'}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('callThemes.subtitle') || 'Gelen arama ekranınızı özelleştirin'}
        </Text>
      </View>

      {/* Tüm Temalar */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('callThemes.allThemes') || 'Tüm Temalar'}
        </Text>

        <View style={styles.themeGrid}>
          {defaultThemes.map((callTheme) => (
            <ThemeCard
              key={callTheme.id}
              theme={callTheme}
              isSelected={activeThemeId === callTheme.id}
              onSelect={() => handleSelectTheme(callTheme.id)}
            />
          ))}
        </View>
      </View>

      {/* Özel Temalar (varsa) */}
      {customThemes.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('callThemes.customThemes') || 'Özel Temalarım'}
          </Text>

          <View style={styles.themeGrid}>
            {customThemes.map((callTheme) => (
              <ThemeCard
                key={callTheme.id}
                theme={callTheme}
                isSelected={activeThemeId === callTheme.id}
                onSelect={() => handleSelectTheme(callTheme.id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Tema Oluştur Butonu (ileride) */}
      <Surface style={[styles.createThemeCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <MaterialCommunityIcons
          name="palette-outline"
          size={32}
          color={theme.colors.primary}
        />
        <View style={styles.createThemeText}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {t('callThemes.createOwn') || 'Kendi Temanı Oluştur'}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('callThemes.createOwnDesc') || 'Yakında...'}
          </Text>
        </View>
        <Chip mode="outlined" style={styles.comingSoonChip}>
          {t('common.comingSoon') || 'Yakında'}
        </Chip>
      </Surface>

      {/* Alt boşluk */}
      <View style={styles.bottomSpacer} />
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
  header: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderWidth: 3,
  },
  cardBackground: {
    width: '100%',
    height: CARD_HEIGHT,
    overflow: 'hidden',
    borderRadius: 14,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  miniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniTextContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  miniTextLine: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  miniButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  miniButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
  },
  createThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  createThemeText: {
    flex: 1,
  },
  comingSoonChip: {
    backgroundColor: 'transparent',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SettingsCallThemeScreen;
