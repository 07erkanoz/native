/**
 * LifeCall - Arama Geçmişi Ekranı
 *
 * Cihazdan arama geçmişini gösterir
 * - Tarih bazlı gruplama
 * - Arama tipi filtreleme
 * - Hızlı geri arama
 * - Kişi detayına gitme
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  Text,
  Chip,
  FAB,
  ActivityIndicator,
  IconButton,
  Menu,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import CallLogs from 'react-native-call-log';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { CallLogEntry, CallType, Contact } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeModules, Alert } from 'react-native';

const { BlockingModule } = NativeModules;

// Filtre tipi
type FilterType = 'all' | 'missed' | 'incoming' | 'outgoing';

// Gruplandırılmış arama tipi
interface CallSection {
  title: string;
  key: string;
  data: CallLogEntry[];
}

const CallsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<RootStackScreenProps<'Main'>['navigation']>();

  // State
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // İzin kontrolü
  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        );
        setHasPermission(granted);
        return granted;
      } catch (error) {
        console.error('İzin kontrolü hatası:', error);
        return false;
      }
    }
    return true;
  }, []);

  // İzin iste
  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          {
            title: t('permissions.phone'),
            message: t('calls.permissionMessage') || 'Arama geçmişine erişim izni gerekli',
            buttonPositive: t('common.ok'),
            buttonNegative: t('common.cancel'),
          }
        );
        const hasAccess = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(hasAccess);
        if (hasAccess) {
          loadCallLogs();
        }
      } catch (error) {
        console.error('İzin isteme hatası:', error);
      }
    }
  }, [t]);

  // Arama geçmişini yükle
  const loadCallLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      if (Platform.OS === 'android') {
        const logs = await CallLogs.loadAll();

        // CallLogEntry formatına dönüştür
        const formattedLogs: CallLogEntry[] = logs.map((log: any) => {
          // Arama tipini belirle
          let callType: CallType = 'outgoing';
          switch (log.type) {
            case 'INCOMING':
              callType = 'incoming';
              break;
            case 'OUTGOING':
              callType = 'outgoing';
              break;
            case 'MISSED':
              callType = 'missed';
              break;
            case 'REJECTED':
              callType = 'rejected';
              break;
            case 'BLOCKED':
              callType = 'blocked';
              break;
          }

          // Tarih formatlama
          const callDate = new Date(parseInt(log.timestamp, 10));
          const dateStr = callDate.toISOString().split('T')[0];
          const timeStr = callDate.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            id: log.timestamp.toString(),
            phoneNumber: log.phoneNumber || '',
            formattedNumber: formatPhoneNumber(log.phoneNumber || ''),
            contactName: log.name || undefined,
            callType,
            callCategory: 'voice' as const,
            duration: parseInt(log.duration, 10) || 0,
            callDate: dateStr,
            callTime: timeStr,
            isRead: true,
            isNew: false,
            hasNote: false,
          };
        });

        setCallLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Arama geçmişi yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Telefon numarası formatlama
  const formatPhoneNumber = (number: string): string => {
    if (!number) return '';

    const cleaned = number.replace(/[^0-9+]/g, '');

    // Türk formatı
    if (cleaned.startsWith('+90') && cleaned.length === 13) {
      return `+90 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`;
    }

    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `0${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }

    return number;
  };

  // İlk yükleme
  useEffect(() => {
    const init = async () => {
      const hasAccess = await checkPermission();
      if (hasAccess) {
        loadCallLogs();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkPermission]);

  // Sayfa odaklandığında yenile
  useFocusEffect(
    useCallback(() => {
      if (hasPermission) {
        loadCallLogs();
      }
    }, [hasPermission, loadCallLogs])
  );

  // Yenile
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCallLogs();
    setRefreshing(false);
  }, [loadCallLogs]);

  // Filtreli aramalar
  const filteredCallLogs = useMemo(() => {
    if (filter === 'all') return callLogs;
    return callLogs.filter((call) => call.callType === filter);
  }, [callLogs, filter]);

  // Tarihe göre grupla
  const groupedCallLogs = useMemo(() => {
    const groups: { [key: string]: CallLogEntry[] } = {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    filteredCallLogs.forEach((call) => {
      let groupKey = call.callDate;
      let groupTitle = formatDateTitle(call.callDate);

      if (call.callDate === today) {
        groupKey = 'today';
        groupTitle = t('common.today');
      } else if (call.callDate === yesterday) {
        groupKey = 'yesterday';
        groupTitle = t('common.yesterday');
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(call);
    });

    // Sections oluştur
    const sections: CallSection[] = [];

    // Sıralama: bugün, dün, sonra tarih sırasına göre
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'today') return -1;
      if (b === 'today') return 1;
      if (a === 'yesterday') return -1;
      if (b === 'yesterday') return 1;
      return b.localeCompare(a); // Yeni tarihler önce
    });

    sortedKeys.forEach((key) => {
      let title = key;
      if (key === 'today') {
        title = t('common.today');
      } else if (key === 'yesterday') {
        title = t('common.yesterday');
      } else {
        title = formatDateTitle(key);
      }

      sections.push({
        key,
        title,
        data: groups[key],
      });
    });

    return sections;
  }, [filteredCallLogs, t]);

  // Tarih başlığı formatlama
  const formatDateTitle = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Süre formatlama
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sn`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} dk`;
    }
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Arama tipi ikonu
  const getCallIcon = (type: CallType): { name: string; color: string } => {
    switch (type) {
      case 'incoming':
        return { name: 'phone-incoming', color: theme.colors.primary };
      case 'outgoing':
        return { name: 'phone-outgoing', color: theme.colors.secondary };
      case 'missed':
        return { name: 'phone-missed', color: theme.colors.error };
      case 'rejected':
        return { name: 'phone-cancel', color: theme.colors.error };
      case 'blocked':
        return { name: 'phone-off', color: theme.colors.onSurfaceVariant };
      default:
        return { name: 'phone', color: theme.colors.onSurfaceVariant };
    }
  };

  // Arama yap
  const handleCall = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber) return;

    try {
      await defaultAppService.makeCall(phoneNumber);
    } catch (error) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  }, []);

  // SMS gönder
  const handleSms = useCallback((phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`sms:${phoneNumber}`);
  }, []);

  // Arama kaydına uzun bas
  const handleLongPress = useCallback((call: CallLogEntry) => {
    setSelectedCall(call);
    setActionModalVisible(true);
  }, []);

  // Geçmişi temizle
  const handleClearHistory = useCallback(async () => {
    // Not: Android'de programatik olarak arama geçmişini silmek için
    // WRITE_CALL_LOG izni gerekir ve sistem API'si kullanılır
    setMenuVisible(false);
    // TODO: Implement clear history
  }, []);

  // Arama kaydı render
  const renderCallItem = useCallback(
    ({ item }: { item: CallLogEntry }) => {
      const iconInfo = getCallIcon(item.callType);

      return (
        <TouchableOpacity
          style={[styles.callItem, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleCall(item.phoneNumber)}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.7}
        >
          {/* Avatar veya İkon */}
          <View style={styles.avatarContainer}>
            {item.contactName ? (
              <Avatar name={item.contactName} photoUri={item.contactPhoto} size={48} />
            ) : (
              <View
                style={[
                  styles.iconAvatar,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            )}

            {/* Arama tipi ikonu */}
            <View
              style={[
                styles.callTypeIcon,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name={iconInfo.name}
                size={14}
                color={iconInfo.color}
              />
            </View>
          </View>

          {/* Bilgiler */}
          <View style={styles.callInfo}>
            <Text
              variant="bodyLarge"
              style={[
                styles.callName,
                { color: theme.colors.onSurface },
                item.callType === 'missed' && { color: theme.colors.error },
              ]}
              numberOfLines={1}
            >
              {item.contactName || item.formattedNumber || item.phoneNumber}
            </Text>

            <View style={styles.callDetails}>
              <MaterialCommunityIcons
                name={iconInfo.name}
                size={14}
                color={iconInfo.color}
              />
              <Text
                variant="bodySmall"
                style={[styles.callTime, { color: theme.colors.onSurfaceVariant }]}
              >
                {item.callTime}
              </Text>
              {item.duration > 0 && (
                <>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {' • '}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {formatDuration(item.duration)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Ara butonu */}
          <IconButton
            icon="phone"
            size={22}
            iconColor={theme.colors.primary}
            onPress={() => handleCall(item.phoneNumber)}
          />
        </TouchableOpacity>
      );
    },
    [theme, handleCall, handleLongPress]
  );

  // Section header render
  const renderSectionHeader = useCallback(
    ({ section }: { section: CallSection }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
        <Text
          variant="labelMedium"
          style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {section.title}
        </Text>
      </View>
    ),
    [theme]
  );

  // Boş liste
  const renderEmptyList = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="phone-lock"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
          >
            {t('permissions.phone')}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={{ color: theme.colors.onPrimary }}>
              {t('permissions.grantPermission')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="phone-clock"
          size={80}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
        >
          {t('calls.noCallHistory')}
        </Text>
      </View>
    );
  }, [isLoading, hasPermission, theme, t, requestPermission]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          {t('calls.title')}
        </Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={handleClearHistory}
            title={t('calls.clearHistory')}
            leadingIcon="delete-outline"
          />
        </Menu>
      </View>

      {/* Filtreler */}
      <View style={styles.filters}>
        <Chip
          mode={filter === 'all' ? 'flat' : 'outlined'}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          {t('calls.all')}
        </Chip>
        <Chip
          mode={filter === 'missed' ? 'flat' : 'outlined'}
          selected={filter === 'missed'}
          onPress={() => setFilter('missed')}
          style={styles.filterChip}
        >
          {t('calls.missed')}
        </Chip>
        <Chip
          mode={filter === 'incoming' ? 'flat' : 'outlined'}
          selected={filter === 'incoming'}
          onPress={() => setFilter('incoming')}
          style={styles.filterChip}
        >
          {t('calls.incoming')}
        </Chip>
        <Chip
          mode={filter === 'outgoing' ? 'flat' : 'outlined'}
          selected={filter === 'outgoing'}
          onPress={() => setFilter('outgoing')}
          style={styles.filterChip}
        >
          {t('calls.outgoing')}
        </Chip>
      </View>

      {/* Arama Listesi */}
      <SectionList
        sections={groupedCallLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[
          styles.listContent,
          groupedCallLogs.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyList}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Tuş Takımı FAB */}
      <FAB
        icon="dialpad"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('Dialer' as any)}
      />

      {/* Aksiyon Modal */}
      <Portal>
        <Modal
          visible={actionModalVisible}
          onDismiss={() => {
            setActionModalVisible(false);
            setSelectedCall(null);
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {selectedCall && (
            <>
              <View style={styles.modalHeader}>
                {selectedCall.contactName ? (
                  <Avatar
                    name={selectedCall.contactName}
                    photoUri={selectedCall.contactPhoto}
                    size={48}
                  />
                ) : (
                  <View
                    style={[
                      styles.iconAvatar,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={28}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                )}
                <View style={styles.modalHeaderText}>
                  <Text
                    variant="titleMedium"
                    style={[styles.modalName, { color: theme.colors.onSurface }]}
                  >
                    {selectedCall.contactName || t('common.unknown')}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {selectedCall.formattedNumber || selectedCall.phoneNumber}
                  </Text>
                </View>
              </View>

              <Divider style={styles.modalDivider} />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    handleCall(selectedCall.phoneNumber);
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    {t('calls.callAgain')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    handleSms(selectedCall.phoneNumber);
                  }}
                >
                  <MaterialCommunityIcons
                    name="message-text"
                    size={24}
                    color={theme.colors.secondary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    {t('contacts.actions.sms')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    const cleanNumber = selectedCall.phoneNumber.replace(/[^0-9]/g, '');
                    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
                  }}
                >
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={24}
                    color="#25D366"
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>

                <Divider style={styles.modalDivider} />

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    // Kişi ekleme ekranına yönlendir
                    navigation.navigate('ContactEdit', {
                      // Telefon numarasını yeni kişiye geçir
                    });
                  }}
                >
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    {t('contacts.newContact')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    Clipboard.setString(selectedCall.phoneNumber);
                    // Toast göster
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    {t('common.copy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    // Arama detay ekranına git
                    navigation.navigate('CallDetail' as any, {
                      callId: selectedCall.id,
                      phoneNumber: selectedCall.phoneNumber,
                      contactName: selectedCall.contactName,
                    });
                  }}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 16 }}
                  >
                    {t('calls.menu.callDetail')}
                  </Text>
                </TouchableOpacity>

                <Divider style={styles.modalDivider} />

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={async () => {
                    setActionModalVisible(false);
                    try {
                      await BlockingModule?.blockNumber(selectedCall.phoneNumber);
                      Alert.alert(t('common.success'), t('blocking.blocked'));
                    } catch (error) {
                      Alert.alert(t('common.error'), t('blocking.blockFailed'));
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="block-helper"
                    size={24}
                    color={theme.colors.error}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.error, marginLeft: 16 }}
                  >
                    {t('calls.menu.blockNumber')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  iconAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  callInfo: {
    flex: 1,
    marginLeft: 12,
  },
  callName: {
    fontWeight: '500',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  callTime: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    elevation: 4,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  modalName: {
    fontWeight: '600',
  },
  modalDivider: {
    marginVertical: 12,
  },
  modalActions: {},
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export default CallsScreen;
