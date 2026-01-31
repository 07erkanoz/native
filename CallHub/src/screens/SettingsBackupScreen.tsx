/**
 * LifeCall - Yedekleme Ayarları Ekranı
 *
 * Uygulama verilerini yedekleme ve geri yükleme
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  List,
  Switch,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import DocumentPicker from 'react-native-document-picker';
import { format } from 'date-fns';
import { tr, enUS, de, fr, es, ru, ar } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState } from '../store';
import { toggleAutoBackupEnabled, setLastBackupTime } from '../store/slices/settingsSlice';
import backupService, { BackupListItem } from '../services/BackupService';

const SettingsBackupScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { autoBackupEnabled, lastBackupTime } = useSelector(
    (state: RootState) => state.settings
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backups, setBackups] = useState<BackupListItem[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Locale map
  const localeMap: Record<string, any> = {
    tr,
    en: enUS,
    de,
    fr,
    es,
    ru,
    ar,
  };

  const getLocale = () => localeMap[i18n.language] || enUS;

  // Yedekleme listesini yükle
  const loadBackups = useCallback(async () => {
    const list = await backupService.listBackups();
    setBackups(list);
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // Yenile
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBackups();
    setIsRefreshing(false);
  };

  // Yeni yedekleme oluştur
  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await backupService.createBackup();

      if (result.success) {
        dispatch(setLastBackupTime(new Date().toISOString()));
        await loadBackups();
        Alert.alert(
          t('common.success'),
          t('backup.backupCreated', 'Yedekleme oluşturuldu')
        );
      } else {
        Alert.alert(t('common.error'), result.error || t('backup.backupFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Yedekleme geri yükle
  const handleRestore = async (backup: BackupListItem) => {
    Alert.alert(
      t('backup.restoreConfirmTitle', 'Geri Yükle'),
      t('backup.restoreConfirmMessage', 'Bu yedeklemeyi geri yüklemek istediğinizden emin misiniz? Mevcut veriler üzerine yazılacak.'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backup.restore', 'Geri Yükle'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await backupService.restoreBackup(backup.filePath);

              if (result.success) {
                Alert.alert(
                  t('common.success'),
                  t('backup.restoreSuccess', 'Veriler başarıyla geri yüklendi. Uygulamayı yeniden başlatın.'),
                  [{ text: t('common.ok') }]
                );
              } else {
                Alert.alert(t('common.error'), result.error || t('backup.restoreFailed'));
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Yedeklemeyi paylaş
  const handleShare = async (backup: BackupListItem) => {
    setIsLoading(true);
    try {
      await backupService.shareBackup(backup.filePath);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Yedeklemeyi sil
  const handleDelete = (backup: BackupListItem) => {
    Alert.alert(
      t('backup.deleteConfirmTitle', 'Yedeklemeyi Sil'),
      t('backup.deleteConfirmMessage', 'Bu yedeklemeyi silmek istediğinizden emin misiniz?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await backupService.deleteBackup(backup.filePath);
            if (success) {
              await loadBackups();
            }
          },
        },
      ]
    );
  };

  // Dosyadan içe aktar
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (result[0]) {
        setIsLoading(true);
        const restoreResult = await backupService.importBackup(result[0].uri);

        if (restoreResult.success) {
          await loadBackups();
          Alert.alert(
            t('common.success'),
            t('backup.importSuccess', 'Yedekleme içe aktarıldı ve geri yüklendi. Uygulamayı yeniden başlatın.')
          );
        } else {
          Alert.alert(t('common.error'), restoreResult.error || t('backup.importFailed'));
        }
      }
    } catch (error: any) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert(t('common.error'), error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Tarih formatla
  const formatDate = (date: Date) => {
    return format(date, 'dd MMM yyyy HH:mm', { locale: getLocale() });
  };

  const renderIcon = (name: string, color?: string) => (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={color || theme.colors.primary}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          {t('settings.backup.title')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Otomatik Yedekleme */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>
            {t('backup.autoBackup', 'Otomatik Yedekleme')}
          </List.Subheader>
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
            <List.Item
              title={t('backup.autoBackupEnabled', 'Otomatik Yedekleme')}
              description={t('backup.autoBackupDesc', 'Günlük otomatik yedekleme')}
              left={() => renderIcon('backup-restore')}
              right={() => (
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={() => dispatch(toggleAutoBackupEnabled())}
                  color={theme.colors.primary}
                />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            {lastBackupTime && (
              <>
                <Divider />
                <List.Item
                  title={t('backup.lastBackup', 'Son Yedekleme')}
                  description={formatDate(new Date(lastBackupTime))}
                  left={() => renderIcon('clock-outline')}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              </>
            )}
          </Surface>
        </List.Section>

        {/* Yedekleme Oluştur */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>
            {t('backup.actions', 'Eylemler')}
          </List.Subheader>
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleCreateBackup}
                loading={isLoading}
                disabled={isLoading}
                icon="cloud-upload"
                style={styles.button}
              >
                {t('settings.backup.backupNow')}
              </Button>
              <Button
                mode="outlined"
                onPress={handleImport}
                loading={isLoading}
                disabled={isLoading}
                icon="file-import"
                style={styles.button}
              >
                {t('backup.import', 'Dosyadan Yükle')}
              </Button>
            </View>
          </Surface>
        </List.Section>

        {/* Yedekleme Listesi */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>
            {t('backup.backupList', 'Yedeklemeler')} ({backups.length})
          </List.Subheader>

          {backups.length === 0 ? (
            <Surface style={[styles.surface, styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name="cloud-off-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                {t('backup.noBackups', 'Henüz yedekleme yok')}
              </Text>
            </Surface>
          ) : (
            <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
              {backups.map((backup, index) => (
                <React.Fragment key={backup.filePath}>
                  {index > 0 && <Divider />}
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedBackup(
                        selectedBackup === backup.filePath ? null : backup.filePath
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <List.Item
                      title={formatDate(backup.createdAt)}
                      description={backupService.formatFileSize(backup.size)}
                      left={() => renderIcon('file-document')}
                      right={() => (
                        <MaterialCommunityIcons
                          name={
                            selectedBackup === backup.filePath
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={24}
                          color={theme.colors.onSurfaceVariant}
                        />
                      )}
                      titleStyle={{ color: theme.colors.onSurface }}
                      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                    />
                  </TouchableOpacity>

                  {/* Açılır Menü */}
                  {selectedBackup === backup.filePath && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="contained"
                        onPress={() => handleRestore(backup)}
                        icon="restore"
                        compact
                        style={styles.actionButton}
                      >
                        {t('settings.backup.restore')}
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleShare(backup)}
                        icon="share"
                        compact
                        style={styles.actionButton}
                      >
                        {t('common.share')}
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleDelete(backup)}
                        icon="delete"
                        compact
                        textColor={theme.colors.error}
                        style={styles.actionButton}
                      >
                        {t('common.delete')}
                      </Button>
                    </View>
                  )}
                </React.Fragment>
              ))}
            </Surface>
          )}
        </List.Section>

        {/* Bilgi */}
        <Surface style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            {t(
              'backup.infoText',
              'Yedeklemeler cihazınızda yerel olarak saklanır. Ayarlar, notlar, takvim etkinlikleri ve engelleme listesi yedeklenir.'
            )}
          </Text>
        </Surface>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  surface: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginRight: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingsBackupScreen;
