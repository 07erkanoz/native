/**
 * LifeCall - Spam Raporlama Ekranı
 *
 * Spam numara raporlama:
 * - Kategori seçimi
 * - Açıklama ekleme
 * - Topluluğa katkı
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Chip,
  RadioButton,
  Checkbox,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme';
import { RootState, AppDispatch } from '../../store';
import {
  reportSpam,
  blockNumber,
  selectBlockingSettings,
} from '../../store/slices/blockingSlice';
import {
  SpamCategory,
  SPAM_CATEGORIES,
} from '../../types/blocking';
import { RootStackParamList } from '../../navigation/types';

type SpamReportRouteProp = RouteProp<RootStackParamList, 'SpamReport'>;

const SpamReportScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<SpamReportRouteProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { phoneNumber, callerName: initialCallerName } = route.params || {};

  // Redux state
  const settings = useSelector(selectBlockingSettings);

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<SpamCategory>('spam');
  const [description, setDescription] = useState('');
  const [callerName, setCallerName] = useState(initialCallerName || '');
  const [blockAfterReport, setBlockAfterReport] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!phoneNumber) {
      Alert.alert(t('spam.error'), t('spam.noNumber'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Spam raporu gönder
      await dispatch(
        reportSpam({
          phoneNumber,
          category: selectedCategory,
          description: description.trim() || undefined,
          callerName: callerName.trim() || undefined,
        })
      ).unwrap();

      // İsteğe bağlı olarak engelle
      if (blockAfterReport) {
        await dispatch(
          blockNumber({
            phoneNumber,
            reason: selectedCategory === 'scam' ? 'scam_reported' : 'spam_reported',
            customReason: description.trim() || undefined,
          })
        ).unwrap();
      }

      Alert.alert(
        t('spam.success'),
        t('spam.reportSubmitted'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(t('spam.error'), error.message || t('spam.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    dispatch,
    phoneNumber,
    selectedCategory,
    description,
    callerName,
    blockAfterReport,
    navigation,
    t,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Surface style={[styles.headerCard, { backgroundColor: theme.colors.errorContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="alert-octagon"
            size={48}
            color={theme.colors.error}
          />
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onErrorContainer }]}>
            {t('spam.reportTitle')}
          </Text>
          <Text variant="bodyLarge" style={[styles.headerNumber, { color: theme.colors.onErrorContainer }]}>
            {phoneNumber || t('spam.unknownNumber')}
          </Text>
        </Surface>

        {/* Kategori Seçimi */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('spam.selectCategory')}
        </Text>

        <Surface style={[styles.categoryContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          {SPAM_CATEGORIES.map((category) => (
            <View key={category.value} style={styles.categoryItem}>
              <RadioButton.Android
                value={category.value}
                status={selectedCategory === category.value ? 'checked' : 'unchecked'}
                onPress={() => setSelectedCategory(category.value)}
                color={category.color}
              />
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <MaterialCommunityIcons
                  name={category.icon}
                  size={20}
                  color={category.color}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t(`spam.categories.${category.labelKey}`)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t(`spam.categoryDesc.${category.labelKey}`)}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

        {/* Arayan adı */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('spam.callerName')}
        </Text>
        <Text variant="bodySmall" style={[styles.sectionDesc, { color: theme.colors.onSurfaceVariant }]}>
          {t('spam.callerNameDesc')}
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
          placeholder={t('spam.callerNamePlaceholder')}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={callerName}
          onChangeText={setCallerName}
          maxLength={100}
        />

        {/* Açıklama */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('spam.description')}
        </Text>
        <Text variant="bodySmall" style={[styles.sectionDesc, { color: theme.colors.onSurfaceVariant }]}>
          {t('spam.descriptionDesc')}
        </Text>

        <TextInput
          style={[styles.textArea, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
          placeholder={t('spam.descriptionPlaceholder')}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />

        <Text variant="labelSmall" style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
          {description.length}/500
        </Text>

        {/* Engelleme seçeneği */}
        <Surface style={[styles.blockOption, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
          <Checkbox.Android
            status={blockAfterReport ? 'checked' : 'unchecked'}
            onPress={() => setBlockAfterReport(!blockAfterReport)}
          />
          <View style={styles.blockOptionText}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              {t('spam.blockAfterReport')}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('spam.blockAfterReportDesc')}
            </Text>
          </View>
        </Surface>

        {/* Gizlilik notu */}
        {settings.contributeToDatabase && (
          <Surface style={[styles.privacyNote, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
            <MaterialCommunityIcons
              name="shield-check"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={[styles.privacyText, { color: theme.colors.onPrimaryContainer }]}>
              {t('spam.privacyNote')}
            </Text>
          </Surface>
        )}
      </ScrollView>

      {/* Submit button */}
      <Surface style={[styles.footer, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 16 }]} elevation={2}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          icon="send"
          style={styles.submitButton}
          buttonColor={theme.colors.error}
        >
          {t('spam.submit')}
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    marginTop: 12,
    fontWeight: '600',
  },
  headerNumber: {
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  sectionDesc: {
    marginBottom: 12,
  },
  categoryContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  blockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  blockOptionText: {
    flex: 1,
    marginLeft: 8,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  privacyText: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    borderRadius: 12,
  },
});

export default SpamReportScreen;
