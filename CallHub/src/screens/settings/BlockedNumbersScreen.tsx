/**
 * LifeCall - Engelli Numaralar Ekranı
 *
 * Kara liste yönetimi:
 * - Engelli numara listesi
 * - Manuel numara ekleme
 * - Engel kaldırma
 * - Spam koruma ayarları
 * - Sessize alınanlar
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  FAB,
  Searchbar,
  Chip,
  Menu,
  Portal,
  Modal,
  Button,
  Divider,
  Switch,
  List,
  SegmentedButtons,
  Badge,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { tr, enUS, de, fr, es, ru, ar } from 'date-fns/locale';

import { useAppTheme } from '../../theme';
import { RootState, AppDispatch } from '../../store';
import {
  selectBlockedNumbers,
  selectMutedContacts,
  selectBlockingSettings,
  selectBlockingStats,
  blockNumber,
  unblockNumber,
  muteContact,
  unmuteContact,
  updateSettings,
} from '../../store/slices/blockingSlice';
import {
  BlockedNumber,
  MutedContact,
  BlockReason,
  BLOCK_REASONS,
  SPAM_CATEGORIES,
  getSpamScoreColor,
} from '../../types/blocking';
import BlockingModule from '../../native/BlockingModule';

// Locale mapping
const LOCALES: Record<string, Locale> = {
  tr: tr,
  en: enUS,
  de: de,
  fr: fr,
  es: es,
  ru: ru,
  ar: ar,
};

type TabType = 'blocked' | 'muted' | 'settings';

const BlockedNumbersScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const blockedNumbers = useSelector(selectBlockedNumbers);
  const mutedContacts = useSelector(selectMutedContacts);
  const settings = useSelector(selectBlockingSettings);
  const stats = useSelector(selectBlockingStats);

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('blocked');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [selectedReason, setSelectedReason] = useState<BlockReason>('user_blocked');
  const [customReason, setCustomReason] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);

  // Locale
  const locale = LOCALES[i18n.language] || enUS;

  // API availability check
  useEffect(() => {
    BlockingModule.checkAvailability().then(setApiAvailable);
  }, []);

  // Filtered blocked numbers
  const filteredBlocked = useMemo(() => {
    if (!searchQuery.trim()) return blockedNumbers;

    const query = searchQuery.toLowerCase();
    return blockedNumbers.filter(
      (b) =>
        b.phoneNumber.includes(query) ||
        b.displayName?.toLowerCase().includes(query) ||
        b.customReason?.toLowerCase().includes(query)
    );
  }, [blockedNumbers, searchQuery]);

  // Filtered muted contacts
  const filteredMuted = useMemo(() => {
    if (!searchQuery.trim()) return mutedContacts;

    const query = searchQuery.toLowerCase();
    return mutedContacts.filter(
      (m) =>
        m.phoneNumber.includes(query) ||
        m.displayName?.toLowerCase().includes(query)
    );
  }, [mutedContacts, searchQuery]);

  // Handle add blocked number
  const handleAddBlocked = useCallback(async () => {
    if (!newNumber.trim()) {
      Alert.alert(t('blocking.error'), t('blocking.enterNumber'));
      return;
    }

    try {
      await dispatch(
        blockNumber({
          phoneNumber: newNumber.trim(),
          reason: selectedReason,
          customReason: customReason.trim() || undefined,
        })
      ).unwrap();

      setAddModalVisible(false);
      setNewNumber('');
      setSelectedReason('user_blocked');
      setCustomReason('');
    } catch (error: any) {
      Alert.alert(t('blocking.error'), error.message || t('blocking.blockFailed'));
    }
  }, [dispatch, newNumber, selectedReason, customReason, t]);

  // Handle unblock
  const handleUnblock = useCallback(
    async (phoneNumber: string) => {
      Alert.alert(
        t('blocking.unblock'),
        t('blocking.unblockConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('blocking.unblock'),
            style: 'destructive',
            onPress: async () => {
              try {
                await dispatch(unblockNumber({ phoneNumber })).unwrap();
              } catch (error: any) {
                Alert.alert(t('blocking.error'), error.message);
              }
            },
          },
        ]
      );
      setMenuVisible(null);
    },
    [dispatch, t]
  );

  // Handle unmute
  const handleUnmute = useCallback(
    (phoneNumber: string) => {
      dispatch(unmuteContact(phoneNumber));
      setMenuVisible(null);
    },
    [dispatch]
  );

  // Handle settings toggle
  const handleSettingToggle = useCallback(
    (key: keyof typeof settings, value: boolean) => {
      dispatch(updateSettings({ [key]: value }));
    },
    [dispatch]
  );

  // Format date
  const formatDate = useCallback(
    (dateStr: string) => {
      return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm', { locale });
    },
    [locale]
  );

  // Get reason label
  const getReasonLabel = useCallback(
    (reason: BlockReason) => {
      const reasonInfo = BLOCK_REASONS.find((r) => r.value === reason);
      return reasonInfo ? t(`blocking.reasons.${reasonInfo.labelKey}`) : reason;
    },
    [t]
  );

  // Render blocked number item
  const renderBlockedItem = useCallback(
    ({ item }: { item: BlockedNumber }) => (
      <Surface style={[styles.listItem, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.itemContent}>
          <View style={styles.itemIcon}>
            <MaterialCommunityIcons
              name="phone-cancel"
              size={24}
              color={theme.colors.error}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {item.displayName || item.phoneNumber}
            </Text>
            {item.displayName && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.phoneNumber}
              </Text>
            )}
            <View style={styles.itemMeta}>
              <Chip compact style={styles.reasonChip}>
                {getReasonLabel(item.reason)}
              </Chip>
              {item.callAttempts > 0 && (
                <Text variant="labelSmall" style={{ color: theme.colors.error }}>
                  {item.callAttempts} {t('blocking.attempts')}
                </Text>
              )}
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatDate(item.blockedAt)}
            </Text>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              leadingIcon="phone-check"
              title={t('blocking.unblock')}
              onPress={() => handleUnblock(item.phoneNumber)}
            />
            <Menu.Item
              leadingIcon="alert-circle"
              title={t('blocking.reportSpam')}
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('SpamReport' as never, { phoneNumber: item.phoneNumber } as never);
              }}
            />
          </Menu>
        </View>
      </Surface>
    ),
    [theme, menuVisible, getReasonLabel, formatDate, handleUnblock, navigation, t]
  );

  // Render muted contact item
  const renderMutedItem = useCallback(
    ({ item }: { item: MutedContact }) => (
      <Surface style={[styles.listItem, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.itemContent}>
          <View style={styles.itemIcon}>
            <MaterialCommunityIcons
              name="volume-off"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {item.displayName || item.phoneNumber}
            </Text>
            {item.displayName && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.phoneNumber}
              </Text>
            )}
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.isPermanent ? t('blocking.permanent') : `${t('blocking.until')} ${formatDate(item.muteUntil!)}`}
            </Text>
          </View>
          <IconButton
            icon="volume-high"
            onPress={() => handleUnmute(item.phoneNumber)}
          />
        </View>
      </Surface>
    ),
    [theme, formatDate, handleUnmute, t]
  );

  // Render settings tab
  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      {/* Stats */}
      <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.error }}>
              {stats.totalBlocked}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('blocking.totalBlocked')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {stats.blockedToday}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('blocking.blockedToday')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>
              {stats.spamDetected}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('blocking.spamDetected')}
            </Text>
          </View>
        </View>
      </Surface>

      {/* API Status */}
      {!apiAvailable && (
        <Surface style={[styles.warningCard, { backgroundColor: theme.colors.errorContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="alert"
            size={24}
            color={theme.colors.error}
          />
          <Text variant="bodyMedium" style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
            {t('blocking.notDefaultDialer')}
          </Text>
          <Button
            mode="contained"
            compact
            onPress={() => navigation.navigate('SetupWizard' as never)}
          >
            {t('blocking.setAsDefault')}
          </Button>
        </Surface>
      )}

      {/* Genel Ayarlar */}
      <List.Section>
        <List.Subheader>{t('blocking.generalSettings')}</List.Subheader>

        <List.Item
          title={t('blocking.enableBlocking')}
          description={t('blocking.enableBlockingDesc')}
          left={(props) => <List.Icon {...props} icon="shield-check" />}
          right={() => (
            <Switch
              value={settings.isEnabled}
              onValueChange={(value) => handleSettingToggle('isEnabled', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.blockUnknown')}
          description={t('blocking.blockUnknownDesc')}
          left={(props) => <List.Icon {...props} icon="account-question" />}
          right={() => (
            <Switch
              value={settings.blockUnknownCallers}
              onValueChange={(value) => handleSettingToggle('blockUnknownCallers', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.blockPrivate')}
          description={t('blocking.blockPrivateDesc')}
          left={(props) => <List.Icon {...props} icon="phone-off" />}
          right={() => (
            <Switch
              value={settings.blockPrivateNumbers}
              onValueChange={(value) => handleSettingToggle('blockPrivateNumbers', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.blockInternational')}
          description={t('blocking.blockInternationalDesc')}
          left={(props) => <List.Icon {...props} icon="earth-off" />}
          right={() => (
            <Switch
              value={settings.blockInternationalCalls}
              onValueChange={(value) => handleSettingToggle('blockInternationalCalls', value)}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* Spam Koruma */}
      <List.Section>
        <List.Subheader>{t('blocking.spamProtection')}</List.Subheader>

        <List.Item
          title={t('blocking.spamProtectionEnabled')}
          description={t('blocking.spamProtectionEnabledDesc')}
          left={(props) => <List.Icon {...props} icon="alert-circle" />}
          right={() => (
            <Switch
              value={settings.spamProtectionEnabled}
              onValueChange={(value) => handleSettingToggle('spamProtectionEnabled', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.showSpamWarning')}
          description={t('blocking.showSpamWarningDesc')}
          left={(props) => <List.Icon {...props} icon="alert" />}
          right={() => (
            <Switch
              value={settings.showSpamWarning}
              onValueChange={(value) => handleSettingToggle('showSpamWarning', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.contributeDatabase')}
          description={t('blocking.contributeDatabaseDesc')}
          left={(props) => <List.Icon {...props} icon="cloud-upload" />}
          right={() => (
            <Switch
              value={settings.contributeToDatabase}
              onValueChange={(value) => handleSettingToggle('contributeToDatabase', value)}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* Bildirimler */}
      <List.Section>
        <List.Subheader>{t('blocking.notifications')}</List.Subheader>

        <List.Item
          title={t('blocking.notifyBlocked')}
          description={t('blocking.notifyBlockedDesc')}
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={settings.notifyBlockedCalls}
              onValueChange={(value) => handleSettingToggle('notifyBlockedCalls', value)}
            />
          )}
        />

        <List.Item
          title={t('blocking.logBlocked')}
          description={t('blocking.logBlockedDesc')}
          left={(props) => <List.Icon {...props} icon="history" />}
          right={() => (
            <Switch
              value={settings.logBlockedCalls}
              onValueChange={(value) => handleSettingToggle('logBlockedCalls', value)}
            />
          )}
        />
      </List.Section>

      {/* Sistem Ayarları */}
      {apiAvailable && (
        <>
          <Divider />
          <List.Section>
            <List.Subheader>{t('blocking.systemSettings')}</List.Subheader>

            <List.Item
              title={t('blocking.openSystemBlocklist')}
              description={t('blocking.openSystemBlocklistDesc')}
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => BlockingModule.openSettings()}
            />
          </List.Section>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {/* Tabs */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          buttons={[
            {
              value: 'blocked',
              label: t('blocking.blocked'),
              icon: 'phone-cancel',
            },
            {
              value: 'muted',
              label: t('blocking.muted'),
              icon: 'volume-off',
            },
            {
              value: 'settings',
              label: t('common.settings'),
              icon: 'cog',
            },
          ]}
          style={styles.tabs}
        />

        {/* Search (sadece liste tablarında) */}
        {activeTab !== 'settings' && (
          <Searchbar
            placeholder={t('blocking.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
        )}
      </Surface>

      {/* Content */}
      {activeTab === 'blocked' && (
        <>
          {filteredBlocked.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="phone-check"
                size={80}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="headlineSmall"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                {searchQuery ? t('blocking.noSearchResults') : t('blocking.noBlockedNumbers')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('blocking.noBlockedDesc')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBlocked}
              renderItem={renderBlockedItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {activeTab === 'muted' && (
        <>
          {filteredMuted.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="volume-high"
                size={80}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="headlineSmall"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                {t('blocking.noMutedContacts')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('blocking.noMutedDesc')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMuted}
              renderItem={renderMutedItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {activeTab === 'settings' && renderSettings()}

      {/* FAB - Add blocked number */}
      {activeTab === 'blocked' && (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 },
          ]}
          color={theme.colors.onPrimary}
          onPress={() => setAddModalVisible(true)}
        />
      )}

      {/* Add Modal */}
      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('blocking.addNumber')}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
            placeholder={t('blocking.enterNumberPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newNumber}
            onChangeText={setNewNumber}
            keyboardType="phone-pad"
          />

          <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            {t('blocking.selectReason')}
          </Text>

          <View style={styles.reasonsContainer}>
            {BLOCK_REASONS.slice(0, 4).map((reason) => (
              <Chip
                key={reason.value}
                selected={selectedReason === reason.value}
                onPress={() => setSelectedReason(reason.value)}
                style={styles.reasonChipSelect}
                icon={reason.icon}
              >
                {t(`blocking.reasons.${reason.labelKey}`)}
              </Chip>
            ))}
          </View>

          {selectedReason === 'user_blocked' && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
              placeholder={t('blocking.customReasonPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={customReason}
              onChangeText={setCustomReason}
            />
          )}

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setAddModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddBlocked}>
              {t('blocking.block')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabs: {
    marginBottom: 12,
  },
  searchBar: {
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  listItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  reasonChip: {
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  warningCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonChipSelect: {
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
});

export default BlockedNumbersScreen;
