/**
 * LifeCall - Takvim Ayarları Ekranı
 *
 * Takvim modülü ayarları:
 * - Google Takvim senkronizasyonu
 * - Otomatik senkronizasyon ayarları
 * - ICS/Excel içe/dışa aktarma
 * - Varsayılan hatırlatıcı
 * - Hafta başlangıcı
 * - Varsayılan görünüm
 * - Bildirim ayarları
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {
  Text,
  Switch,
  List,
  Divider,
  Surface,
  Button,
  Portal,
  Modal,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import DocumentPicker from 'react-native-document-picker';

import { useAppTheme } from '../../theme';
import { RootState, AppDispatch } from '../../store';
import {
  updateSettings,
  syncWithGoogle,
  connectGoogleAccount,
  disconnectGoogleAccount,
  importICSFile,
} from '../../store/slices/calendarSlice';
import { CalendarViewMode, REMINDER_OPTIONS } from '../../types/calendar';

// Hafta başlangıç seçenekleri
const WEEK_START_OPTIONS = [
  { value: 0, labelKey: 'weekDaysFull.sunday' },
  { value: 1, labelKey: 'weekDaysFull.monday' },
  { value: 6, labelKey: 'weekDaysFull.saturday' },
];

// Görünüm modu seçenekleri
const VIEW_MODE_OPTIONS: { value: CalendarViewMode; labelKey: string }[] = [
  { value: 'month', labelKey: 'monthView' },
  { value: 'week', labelKey: 'weekView' },
  { value: 'day', labelKey: 'dayView' },
  { value: 'agenda', labelKey: 'agenda' },
];

// Senkronizasyon aralığı seçenekleri (dakika)
const SYNC_INTERVAL_OPTIONS = [
  { value: 15, label: '15 dakika' },
  { value: 30, label: '30 dakika' },
  { value: 60, label: '1 saat' },
  { value: 180, label: '3 saat' },
  { value: 360, label: '6 saat' },
  { value: 720, label: '12 saat' },
  { value: 1440, label: '24 saat' },
];

const SettingsCalendarScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { settings, syncInfo, isSyncing, calendars } = useSelector((state: RootState) => state.calendar);

  // Locale
  const locale = i18n.language === 'tr' ? tr : enUS;

  // UI state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showWeekStartModal, setShowWeekStartModal] = useState(false);
  const [showViewModeModal, setShowViewModeModal] = useState(false);
  const [showSyncIntervalModal, setShowSyncIntervalModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Google bağlantı durumu
  const isGoogleConnected = useMemo(() => {
    return calendars.some((c) => c.accountType === 'google');
  }, [calendars]);

  // Son senkronizasyon metni
  const lastSyncText = useMemo(() => {
    if (!syncInfo.lastSyncTime) {
      return t('settings.calendar.neverSynced');
    }
    return format(new Date(syncInfo.lastSyncTime), 'dd MMM yyyy HH:mm', { locale });
  }, [syncInfo.lastSyncTime, locale, t]);

  // Varsayılan hatırlatıcı metni
  const defaultReminderText = useMemo(() => {
    const option = REMINDER_OPTIONS.find((o) => o.minutes === settings.defaultReminderMinutes);
    if (option) {
      return t(`calendar.reminderOptions.${option.label}`);
    }
    return `${settings.defaultReminderMinutes} ${i18n.language === 'tr' ? 'dakika önce' : 'minutes before'}`;
  }, [settings.defaultReminderMinutes, t, i18n.language]);

  // Hafta başlangıcı metni
  const weekStartText = useMemo(() => {
    const option = WEEK_START_OPTIONS.find((o) => o.value === settings.firstDayOfWeek);
    if (option) {
      return t(`calendar.${option.labelKey}`);
    }
    return '';
  }, [settings.firstDayOfWeek, t]);

  // Varsayılan görünüm metni
  const defaultViewText = useMemo(() => {
    const option = VIEW_MODE_OPTIONS.find((o) => o.value === settings.defaultView);
    if (option) {
      return t(`calendar.${option.labelKey}`);
    }
    return '';
  }, [settings.defaultView, t]);

  // Senkronizasyon aralığı metni
  const syncIntervalText = useMemo(() => {
    const minutes = settings.syncInterval || 60;
    if (minutes < 60) {
      return `${minutes} ${i18n.language === 'tr' ? 'dakika' : 'minutes'}`;
    }
    const hours = minutes / 60;
    return `${hours} ${i18n.language === 'tr' ? 'saat' : 'hours'}`;
  }, [settings.syncInterval, i18n.language]);

  // Google hesabı bağla/kaldır
  const handleGoogleToggle = useCallback(async () => {
    if (isGoogleConnected) {
      Alert.alert(
        t('calendar.sync.disconnectGoogle'),
        t('common.confirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => dispatch(disconnectGoogleAccount()),
          },
        ]
      );
    } else {
      try {
        await dispatch(connectGoogleAccount()).unwrap();
        Alert.alert(t('common.success'), t('calendar.sync.googleConnected'));
      } catch (error) {
        Alert.alert(t('common.error'), t('calendar.sync.syncError'));
      }
    }
  }, [isGoogleConnected, dispatch, t]);

  // Şimdi senkronize et
  const handleSyncNow = useCallback(async () => {
    try {
      await dispatch(syncWithGoogle()).unwrap();
      Alert.alert(t('common.success'), t('calendar.sync.syncSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('calendar.sync.syncError'));
    }
  }, [dispatch, t]);

  // ICS dosyası içe aktar
  const handleImportICS = useCallback(async () => {
    try {
      setImporting(true);

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      const file = result[0];
      if (file && file.fileCopyUri) {
        const importResult = await dispatch(importICSFile(file.fileCopyUri)).unwrap();
        Alert.alert(
          t('common.success'),
          t('calendar.import.importSuccess', { count: importResult.importedEvents })
        );
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert(t('common.error'), t('calendar.import.importError'));
      }
    } finally {
      setImporting(false);
    }
  }, [dispatch, t]);

  // Takvimi dışa aktar
  const handleExport = useCallback(async () => {
    Alert.alert(
      t('calendar.export.title'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('calendar.export.exportICS'),
          onPress: () => {
            // TODO: ICS dışa aktarma
            Alert.alert('Bilgi', 'ICS dışa aktarma özelliği yakında eklenecek');
          },
        },
        {
          text: t('calendar.export.exportExcel'),
          onPress: () => {
            // TODO: Excel dışa aktarma
            Alert.alert('Bilgi', 'Excel dışa aktarma özelliği yakında eklenecek');
          },
        },
      ]
    );
  }, [t]);

  // Ayar değiştirme fonksiyonları
  const handleAutoSyncToggle = useCallback(
    (value: boolean) => {
      dispatch(updateSettings({ autoSync: value }));
    },
    [dispatch]
  );

  const handleNotificationSoundToggle = useCallback(
    (value: boolean) => {
      dispatch(updateSettings({ notificationSound: value }));
    },
    [dispatch]
  );

  const handleVibrationToggle = useCallback(
    (value: boolean) => {
      dispatch(updateSettings({ vibration: value }));
    },
    [dispatch]
  );

  const handleShowWeekNumbersToggle = useCallback(
    (value: boolean) => {
      dispatch(updateSettings({ showWeekNumbers: value }));
    },
    [dispatch]
  );

  const handleDefaultReminderChange = useCallback(
    (minutes: number) => {
      dispatch(updateSettings({ defaultReminderMinutes: minutes }));
      setShowReminderModal(false);
    },
    [dispatch]
  );

  const handleWeekStartChange = useCallback(
    (value: number) => {
      dispatch(updateSettings({ firstDayOfWeek: value as 0 | 1 | 6 }));
      setShowWeekStartModal(false);
    },
    [dispatch]
  );

  const handleDefaultViewChange = useCallback(
    (value: CalendarViewMode) => {
      dispatch(updateSettings({ defaultView: value }));
      setShowViewModeModal(false);
    },
    [dispatch]
  );

  const handleSyncIntervalChange = useCallback(
    (minutes: number) => {
      dispatch(updateSettings({ syncInterval: minutes }));
      setShowSyncIntervalModal(false);
    },
    [dispatch]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Google Senkronizasyon */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('settings.calendar.sync')}
          </Text>

          <List.Item
            title={t('settings.calendar.googleSync')}
            description={isGoogleConnected ? t('calendar.sync.googleConnected') : t('calendar.sync.googleNotConnected')}
            left={(props) => <List.Icon {...props} icon="google" />}
            right={() => (
              <Button
                mode={isGoogleConnected ? 'outlined' : 'contained'}
                onPress={handleGoogleToggle}
                compact
              >
                {isGoogleConnected ? t('calendar.sync.disconnectGoogle') : t('calendar.sync.connectGoogle')}
              </Button>
            )}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.autoSync')}
            description={t('settings.calendar.autoSyncDesc')}
            left={(props) => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={settings.autoSync}
                onValueChange={handleAutoSyncToggle}
                disabled={!isGoogleConnected}
              />
            )}
          />

          {settings.autoSync && isGoogleConnected && (
            <>
              <Divider />
              <List.Item
                title={t('settings.calendar.syncInterval')}
                description={syncIntervalText}
                left={(props) => <List.Icon {...props} icon="timer-outline" />}
                onPress={() => setShowSyncIntervalModal(true)}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            </>
          )}

          <Divider />

          <List.Item
            title={t('settings.calendar.lastSync')}
            description={lastSyncText}
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
            right={() =>
              isSyncing ? (
                <ActivityIndicator />
              ) : (
                <Button
                  mode="text"
                  onPress={handleSyncNow}
                  disabled={!isGoogleConnected}
                >
                  {t('settings.calendar.syncNow')}
                </Button>
              )
            }
          />
        </Surface>

        {/* İçe/Dışa Aktarma */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('settings.calendar.importExport')}
          </Text>

          <List.Item
            title={t('settings.calendar.importCalendar')}
            description={t('calendar.import.importICS')}
            left={(props) => <List.Icon {...props} icon="import" />}
            onPress={handleImportICS}
            right={() =>
              importing ? (
                <ActivityIndicator />
              ) : (
                <List.Icon icon="chevron-right" />
              )
            }
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.exportCalendar')}
            description={t('calendar.export.exportAll')}
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={handleExport}
            right={() =>
              exporting ? (
                <ActivityIndicator />
              ) : (
                <List.Icon icon="chevron-right" />
              )
            }
          />
        </Surface>

        {/* Genel Ayarlar */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('common.settings')}
          </Text>

          <List.Item
            title={t('settings.calendar.defaultReminder')}
            description={defaultReminderText}
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            onPress={() => setShowReminderModal(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.weekStartsOn')}
            description={weekStartText}
            left={(props) => <List.Icon {...props} icon="calendar-week" />}
            onPress={() => setShowWeekStartModal(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.defaultView')}
            description={defaultViewText}
            left={(props) => <List.Icon {...props} icon="view-grid-outline" />}
            onPress={() => setShowViewModeModal(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.showWeekNumbers')}
            left={(props) => <List.Icon {...props} icon="numeric" />}
            right={() => (
              <Switch
                value={settings.showWeekNumbers}
                onValueChange={handleShowWeekNumbersToggle}
              />
            )}
          />
        </Surface>

        {/* Bildirim Ayarları */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('settings.notifications.title')}
          </Text>

          <List.Item
            title={t('settings.calendar.notificationSound')}
            left={(props) => <List.Icon {...props} icon="volume-high" />}
            right={() => (
              <Switch
                value={settings.notificationSound}
                onValueChange={handleNotificationSoundToggle}
              />
            )}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.vibration')}
            left={(props) => <List.Icon {...props} icon="vibrate" />}
            right={() => (
              <Switch
                value={settings.vibration}
                onValueChange={handleVibrationToggle}
              />
            )}
          />

          <Divider />

          <List.Item
            title={t('settings.calendar.ringtone')}
            description={settings.reminderRingtone || t('common.default')}
            left={(props) => <List.Icon {...props} icon="music-note" />}
            onPress={() => {
              // TODO: Zil sesi seçme
              Alert.alert('Bilgi', 'Zil sesi seçme özelliği yakında eklenecek');
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* Hatırlatıcı Modal */}
      <Portal>
        <Modal
          visible={showReminderModal}
          onDismiss={() => setShowReminderModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('settings.calendar.defaultReminder')}
          </Text>
          <RadioButton.Group
            value={settings.defaultReminderMinutes.toString()}
            onValueChange={(value) => handleDefaultReminderChange(parseInt(value, 10))}
          >
            {REMINDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={styles.modalOption}
                onPress={() => handleDefaultReminderChange(option.minutes)}
              >
                <RadioButton value={option.minutes.toString()} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {t(`calendar.reminderOptions.${option.label}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Hafta Başlangıcı Modal */}
      <Portal>
        <Modal
          visible={showWeekStartModal}
          onDismiss={() => setShowWeekStartModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('settings.calendar.weekStartsOn')}
          </Text>
          <RadioButton.Group
            value={settings.firstDayOfWeek.toString()}
            onValueChange={(value) => handleWeekStartChange(parseInt(value, 10))}
          >
            {WEEK_START_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleWeekStartChange(option.value)}
              >
                <RadioButton value={option.value.toString()} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {t(`calendar.${option.labelKey}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Varsayılan Görünüm Modal */}
      <Portal>
        <Modal
          visible={showViewModeModal}
          onDismiss={() => setShowViewModeModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('settings.calendar.defaultView')}
          </Text>
          <RadioButton.Group
            value={settings.defaultView}
            onValueChange={(value) => handleDefaultViewChange(value as CalendarViewMode)}
          >
            {VIEW_MODE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleDefaultViewChange(option.value)}
              >
                <RadioButton value={option.value} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {t(`calendar.${option.labelKey}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Senkronizasyon Aralığı Modal */}
      <Portal>
        <Modal
          visible={showSyncIntervalModal}
          onDismiss={() => setShowSyncIntervalModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('settings.calendar.syncInterval')}
          </Text>
          <RadioButton.Group
            value={(settings.syncInterval || 60).toString()}
            onValueChange={(value) => handleSyncIntervalChange(parseInt(value, 10))}
          >
            {SYNC_INTERVAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleSyncIntervalChange(option.value)}
              >
                <RadioButton value={option.value.toString()} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
    fontWeight: '600',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});

export default SettingsCalendarScreen;
