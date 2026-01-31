/**
 * LifeCall - Arama Detay Ekranı
 *
 * Bir telefon numarasının tüm arama geçmişini ve istatistiklerini gösterir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Appbar,
  Avatar,
  Divider,
  Menu,
  useTheme,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import CallLogs from 'react-native-call-log';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { RootStackParamList } from '../navigation/types';
import { BlockingModule } from '../native';
import { useAppTheme } from '../theme';

type CallDetailRouteProp = RouteProp<RootStackParamList, 'CallDetail'>;

interface CallRecord {
  id: string;
  phoneNumber: string;
  name: string;
  dateTime: string;
  timestamp: number;
  duration: number;
  type: number; // 1: incoming, 2: outgoing, 3: missed, 5: rejected
}

interface CallStats {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  missedCalls: number;
  rejectedCalls: number;
  totalDuration: number;
  averageDuration: number;
  longestCall: number;
  firstCallDate: Date | null;
  lastCallDate: Date | null;
}

const CallDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CallDetailRouteProp>();
  const paperTheme = useTheme();
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();

  const { phoneNumber, contactName } = route.params;

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0,
    rejectedCalls: 0,
    totalDuration: 0,
    averageDuration: 0,
    longestCall: 0,
    firstCallDate: null,
    lastCallDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const locale = i18n.language === 'tr' ? tr : enUS;

  // Arama kayıtlarını yükle
  const loadCallHistory = useCallback(async () => {
    try {
      const filter = {
        phoneNumbers: phoneNumber,
      };

      const callRecords = await CallLogs.load(500, filter);

      const formattedCalls: CallRecord[] = callRecords.map((call: any) => ({
        id: call.timestamp?.toString() || Date.now().toString(),
        phoneNumber: call.phoneNumber || call.number || '',
        name: call.name || contactName || '',
        dateTime: call.dateTime || new Date().toISOString(),
        timestamp: parseInt(call.timestamp || Date.now().toString(), 10),
        duration: parseInt(call.duration || '0', 10),
        type: parseInt(call.type || '1', 10),
      }));

      // Zamana göre sırala (en yeni önce)
      formattedCalls.sort((a, b) => b.timestamp - a.timestamp);

      setCalls(formattedCalls);
      calculateStats(formattedCalls);
    } catch (error) {
      console.error('Arama geçmişi yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phoneNumber, contactName]);

  // İstatistikleri hesapla
  const calculateStats = (callRecords: CallRecord[]) => {
    if (callRecords.length === 0) {
      setStats({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        longestCall: 0,
        firstCallDate: null,
        lastCallDate: null,
      });
      return;
    }

    let incoming = 0;
    let outgoing = 0;
    let missed = 0;
    let rejected = 0;
    let totalDur = 0;
    let longest = 0;

    callRecords.forEach(call => {
      switch (call.type) {
        case 1:
          incoming++;
          break;
        case 2:
          outgoing++;
          break;
        case 3:
          missed++;
          break;
        case 5:
          rejected++;
          break;
      }

      totalDur += call.duration;
      if (call.duration > longest) {
        longest = call.duration;
      }
    });

    const answeredCalls = incoming + outgoing;

    setStats({
      totalCalls: callRecords.length,
      incomingCalls: incoming,
      outgoingCalls: outgoing,
      missedCalls: missed,
      rejectedCalls: rejected,
      totalDuration: totalDur,
      averageDuration: answeredCalls > 0 ? Math.round(totalDur / answeredCalls) : 0,
      longestCall: longest,
      firstCallDate: new Date(callRecords[callRecords.length - 1].timestamp),
      lastCallDate: new Date(callRecords[0].timestamp),
    });
  };

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCallHistory();
  };

  // Süreyi formatla
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0 sn';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} sa`);
    if (minutes > 0) parts.push(`${minutes} dk`);
    if (secs > 0 && hours === 0) parts.push(`${secs} sn`);

    return parts.join(' ');
  };

  // Arama tipine göre ikon
  const getCallTypeIcon = (type: number): { name: string; color: string } => {
    switch (type) {
      case 1: // Gelen
        return { name: 'phone-incoming', color: '#4CAF50' };
      case 2: // Giden
        return { name: 'phone-outgoing', color: '#2196F3' };
      case 3: // Cevapsız
        return { name: 'phone-missed', color: '#F44336' };
      case 5: // Reddedilen
        return { name: 'phone-cancel', color: '#FF9800' };
      default:
        return { name: 'phone', color: '#888' };
    }
  };

  // Arama tipine göre metin
  const getCallTypeText = (type: number): string => {
    switch (type) {
      case 1:
        return 'Gelen arama';
      case 2:
        return 'Giden arama';
      case 3:
        return 'Cevapsız arama';
      case 5:
        return 'Reddedilen arama';
      default:
        return 'Arama';
    }
  };

  // Arama yap
  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // SMS gönder
  const handleSMS = () => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  // WhatsApp aç
  const handleWhatsApp = () => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  // Numarayı kopyala
  const handleCopy = () => {
    Clipboard.setString(phoneNumber);
    Alert.alert('Kopyalandı', 'Telefon numarası panoya kopyalandı');
    setMenuVisible(false);
  };

  // Numarayı engelle
  const handleBlock = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Numarayı Engelle',
      `${phoneNumber} numarasını engellemek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              await BlockingModule?.blockNumber(phoneNumber);
              Alert.alert('Başarılı', 'Numara engellendi');
            } catch (error) {
              Alert.alert('Hata', 'Numara engellenemedi');
            }
          },
        },
      ]
    );
  };

  // Rehbere kaydet
  const handleAddToContacts = () => {
    setMenuVisible(false);
    navigation.navigate('ContactAdd' as any, {
      phoneNumber: phoneNumber,
    });
  };

  // Tarihi formatla
  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale });
  };

  // Avatar için baş harf
  const getInitials = (name: string): string => {
    if (!name) return '#';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('calls.details', 'Arama Detayı')} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item onPress={handleCopy} title="Numarayı Kopyala" leadingIcon="content-copy" />
          {!contactName && (
            <Menu.Item onPress={handleAddToContacts} title="Rehbere Ekle" leadingIcon="account-plus" />
          )}
          <Divider />
          <Menu.Item onPress={handleBlock} title="Numarayı Engelle" leadingIcon="block-helper" />
        </Menu>
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profil Bölümü */}
        <View style={[styles.profileSection, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Text
            size={80}
            label={getInitials(contactName || phoneNumber)}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text style={styles.profileName}>
            {contactName || phoneNumber}
          </Text>
          {contactName && (
            <Text style={[styles.profileNumber, { color: theme.colors.onSurfaceVariant }]}>
              {phoneNumber}
            </Text>
          )}
        </View>

        {/* Hızlı Aksiyonlar */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Icon name="phone" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Ara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Icon name="message-text" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
            <View style={[styles.actionIcon, { backgroundColor: '#25D366' }]}>
              <Icon name="whatsapp" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* İstatistik Kartları */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="phone" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.totalCalls}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Toplam
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="phone-incoming" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.incomingCalls}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Gelen
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="phone-outgoing" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{stats.outgoingCalls}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Giden
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="phone-missed" size={24} color="#F44336" />
            <Text style={styles.statValue}>{stats.missedCalls}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Cevapsız
            </Text>
          </View>
        </View>

        {/* Detaylı İstatistikler */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Arama İstatistikleri
          </Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="timer-outline" size={20} color={theme.colors.primary} />
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Toplam Süre
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {formatDuration(stats.totalDuration)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="chart-timeline-variant" size={20} color={theme.colors.primary} />
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Ortalama Süre
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {formatDuration(stats.averageDuration)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="trophy-outline" size={20} color={theme.colors.primary} />
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  En Uzun Arama
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {formatDuration(stats.longestCall)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="phone-cancel" size={20} color="#FF9800" />
              <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Reddedilen
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {stats.rejectedCalls}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                İlk Arama
              </Text>
              <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>
                {formatDate(stats.firstCallDate)}
              </Text>
            </View>

            <View style={styles.dateItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                Son Arama
              </Text>
              <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>
                {formatDate(stats.lastCallDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Arama Geçmişi */}
        <View style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Arama Geçmişi ({calls.length})
          </Text>

          {calls.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="phone-off" size={48} color={theme.colors.outline} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Arama kaydı bulunamadı
              </Text>
            </View>
          ) : (
            calls.map((call, index) => {
              const icon = getCallTypeIcon(call.type);
              return (
                <View key={call.id + index}>
                  <View style={styles.callItem}>
                    <View style={styles.callIcon}>
                      <Icon name={icon.name} size={20} color={icon.color} />
                    </View>
                    <View style={styles.callInfo}>
                      <Text style={[styles.callType, { color: theme.colors.onSurface }]}>
                        {getCallTypeText(call.type)}
                      </Text>
                      <Text style={[styles.callDate, { color: theme.colors.onSurfaceVariant }]}>
                        {format(new Date(call.timestamp), 'dd MMM yyyy, HH:mm', { locale })}
                      </Text>
                    </View>
                    <View style={styles.callDuration}>
                      {call.duration > 0 ? (
                        <Text style={[styles.durationText, { color: theme.colors.onSurfaceVariant }]}>
                          {formatDuration(call.duration)}
                        </Text>
                      ) : (
                        <Text style={[styles.durationText, { color: '#F44336' }]}>
                          {call.type === 3 ? 'Cevapsız' : call.type === 5 ? 'Reddedildi' : '0 sn'}
                        </Text>
                      )}
                    </View>
                  </View>
                  {index < calls.length - 1 && <Divider style={styles.itemDivider} />}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  profileNumber: {
    fontSize: 16,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  detailsCard: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateItem: {
    flex: 1,
  },
  dateValue: {
    fontSize: 13,
    marginTop: 4,
  },
  historyCard: {
    margin: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  callIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callInfo: {
    flex: 1,
    marginLeft: 12,
  },
  callType: {
    fontSize: 14,
    fontWeight: '500',
  },
  callDate: {
    fontSize: 12,
    marginTop: 2,
  },
  callDuration: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 13,
  },
  itemDivider: {
    marginLeft: 48,
  },
  bottomPadding: {
    height: 32,
  },
});

export default CallDetailScreen;
