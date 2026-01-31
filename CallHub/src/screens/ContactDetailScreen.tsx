/**
 * LifeCall - Kişi Detay Ekranı
 *
 * Kişi bilgilerini görüntüler ve düzenler
 * - Telefon numaraları
 * - E-posta adresleri
 * - Arama geçmişi
 * - Favori ve engelleme işlemleri
 * - Kişiye özel zil sesi
 * - Arama istatistikleri
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  IconButton,
  Divider,
  List,
  Menu,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
  Chip,
  Modal,
  RadioButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import CallLogs from 'react-native-call-log';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { Contact } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';
import { ringtoneService, RingtoneInfo, ContactRingtoneInfo } from '../native/RingtoneModule';

type Props = RootStackScreenProps<'ContactDetail'>;

const ContactDetailScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<Props['navigation']>();

  const { contactId } = route.params;

  // State
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Zil sesi
  const [ringtoneModalVisible, setRingtoneModalVisible] = useState(false);
  const [contactRingtone, setContactRingtone] = useState<ContactRingtoneInfo | null>(null);
  const [systemRingtones, setSystemRingtones] = useState<RingtoneInfo[]>([]);
  const [selectedRingtoneUri, setSelectedRingtoneUri] = useState<string | null>(null);
  const [loadingRingtones, setLoadingRingtones] = useState(false);

  // Arama geçmişi
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0,
    totalDuration: 0,
    lastCallDate: null as Date | null,
  });
  const [showAllCalls, setShowAllCalls] = useState(false);

  // Kişiyi yükle
  useEffect(() => {
    loadContact();
  }, [contactId]);

  // Zil sesi ve arama geçmişini yükle
  useEffect(() => {
    if (contact) {
      loadContactRingtone();
      loadCallHistory();
    }
  }, [contact?.id]);

  // Kişinin zil sesini yükle
  const loadContactRingtone = useCallback(async () => {
    if (!contact) return;
    try {
      const ringtone = await ringtoneService.getContactRingtone(contact.id);
      setContactRingtone(ringtone);
      setSelectedRingtoneUri(ringtone.uri);
    } catch (error) {
      console.error('Zil sesi yüklenemedi:', error);
    }
  }, [contact]);

  // Zil sesi listesini yükle
  const loadRingtones = useCallback(async () => {
    setLoadingRingtones(true);
    try {
      const ringtones = await ringtoneService.getSystemRingtones();
      setSystemRingtones(ringtones);
    } catch (error) {
      console.error('Zil sesleri yüklenemedi:', error);
    } finally {
      setLoadingRingtones(false);
    }
  }, []);

  // Arama geçmişini yükle
  const loadCallHistory = useCallback(async () => {
    if (!contact || contact.phoneNumbers.length === 0) return;

    try {
      // Tüm telefon numaralarını normalize et
      const phoneNumbers = contact.phoneNumbers.map(p =>
        p.number.replace(/[^0-9+]/g, '')
      );

      // Son 6 ayın aramalarını al
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const allCalls = await CallLogs.load(-1, { minTimestamp: sixMonthsAgo.getTime() });

      // Bu kişiye ait aramaları filtrele
      const contactCalls = allCalls.filter((call: any) => {
        const callNumber = call.phoneNumber?.replace(/[^0-9+]/g, '') || '';
        return phoneNumbers.some(pn =>
          callNumber.endsWith(pn.slice(-10)) || pn.endsWith(callNumber.slice(-10))
        );
      });

      // Tarihe göre sırala (en yeni en üstte)
      contactCalls.sort((a: any, b: any) => b.timestamp - a.timestamp);

      setCallHistory(contactCalls);

      // İstatistikleri hesapla
      let incoming = 0, outgoing = 0, missed = 0, totalDuration = 0;
      let lastCall: Date | null = null;

      contactCalls.forEach((call: any) => {
        const duration = parseInt(call.duration) || 0;
        totalDuration += duration;

        if (call.type === 'INCOMING') incoming++;
        else if (call.type === 'OUTGOING') outgoing++;
        else if (call.type === 'MISSED') missed++;

        if (!lastCall && call.timestamp) {
          lastCall = new Date(parseInt(call.timestamp));
        }
      });

      setCallStats({
        totalCalls: contactCalls.length,
        incomingCalls: incoming,
        outgoingCalls: outgoing,
        missedCalls: missed,
        totalDuration,
        lastCallDate: lastCall,
      });
    } catch (error) {
      console.error('Arama geçmişi yüklenemedi:', error);
    }
  }, [contact]);

  // Zil sesi seçimi modal'ını aç
  const openRingtoneModal = useCallback(() => {
    loadRingtones();
    setRingtoneModalVisible(true);
  }, [loadRingtones]);

  // Zil sesini kaydet
  const saveRingtone = useCallback(async () => {
    if (!contact) return;

    try {
      if (selectedRingtoneUri === 'default' || !selectedRingtoneUri) {
        await ringtoneService.removeContactRingtone(contact.id);
      } else {
        await ringtoneService.setContactRingtone(contact.id, selectedRingtoneUri);
      }
      await loadContactRingtone();
      setRingtoneModalVisible(false);
    } catch (error) {
      console.error('Zil sesi kaydedilemedi:', error);
      Alert.alert('Hata', 'Zil sesi kaydedilemedi');
    }
  }, [contact, selectedRingtoneUri, loadContactRingtone]);

  // Zil sesini önizle
  const previewRingtone = useCallback(async (uri: string) => {
    await ringtoneService.stopRingtone();
    if (uri && uri !== 'default') {
      await ringtoneService.playRingtone(uri);
    }
  }, []);

  // Süreyi formatla
  const formatDuration = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds} sn`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dk ${seconds % 60} sn`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours} sa ${mins} dk`;
  }, []);

  // Tarihi formatla
  const formatCallDate = useCallback((timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  // Arama tipi ikonunu al
  const getCallTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'INCOMING': return 'phone-incoming';
      case 'OUTGOING': return 'phone-outgoing';
      case 'MISSED': return 'phone-missed';
      default: return 'phone';
    }
  }, []);

  // Arama tipi rengini al
  const getCallTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'INCOMING': return '#4CAF50';
      case 'OUTGOING': return '#2196F3';
      case 'MISSED': return '#F44336';
      default: return '#888';
    }
  }, []);

  const loadContact = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedContact = await ContactRepository.getContactById(contactId);
      setContact(loadedContact);
    } catch (error) {
      console.error('Kişi yüklenemedi:', error);
      Alert.alert(t('common.error'), t('contacts.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [contactId, t]);

  // Arama yap
  const handleCall = useCallback(async (phoneNumber: string) => {
    try {
      await defaultAppService.makeCall(phoneNumber);
    } catch (error) {
      console.error('Arama hatası:', error);
      // Fallback
      Linking.openURL(`tel:${phoneNumber}`);
    }
  }, []);

  // SMS gönder
  const handleSms = useCallback((phoneNumber: string) => {
    Linking.openURL(`sms:${phoneNumber}`);
  }, []);

  // E-posta gönder
  const handleEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`);
  }, []);

  // WhatsApp aç
  const handleWhatsApp = useCallback((phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  }, []);

  // Favori değiştir
  const handleToggleFavorite = useCallback(async () => {
    if (!contact) return;

    try {
      await ContactRepository.toggleFavorite(contact.id, !contact.isFavorite);
      setContact({ ...contact, isFavorite: !contact.isFavorite });
    } catch (error) {
      console.error('Favori değiştirilemedi:', error);
    }
  }, [contact]);

  // Engelleme değiştir
  const handleToggleBlocked = useCallback(async () => {
    if (!contact) return;

    const newBlockedState = !contact.isBlocked;

    Alert.alert(
      newBlockedState ? t('contacts.blockContact') : t('contacts.unblockContact'),
      newBlockedState
        ? t('contacts.blockConfirm', { name: contact.displayName })
        : t('contacts.unblockConfirm', { name: contact.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: newBlockedState ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await ContactRepository.toggleBlocked(contact.id, newBlockedState);
              setContact({ ...contact, isBlocked: newBlockedState });
              setMenuVisible(false);
            } catch (error) {
              console.error('Engelleme değiştirilemedi:', error);
            }
          },
        },
      ]
    );
  }, [contact, t]);

  // Kişiyi düzenle
  const handleEdit = useCallback(() => {
    if (!contact) return;
    navigation.navigate('ContactEdit', { contactId: contact.id });
    setMenuVisible(false);
  }, [contact, navigation]);

  // Kişiyi sil
  const handleDelete = useCallback(async () => {
    if (!contact) return;

    try {
      await ContactRepository.deleteContact(contact.id);
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Kişi silinemedi:', error);
      Alert.alert(t('common.error'), t('contacts.deleteError'));
    }
  }, [contact, navigation, t]);

  // Telefon numarası label'ı
  const getPhoneLabel = useCallback(
    (label: string) => {
      const labels: Record<string, string> = {
        mobile: t('contacts.phoneLabels.mobile'),
        home: t('contacts.phoneLabels.home'),
        work: t('contacts.phoneLabels.work'),
        main: t('contacts.phoneLabels.main'),
        other: t('contacts.phoneLabels.other'),
      };
      return labels[label] || label;
    },
    [t]
  );

  // E-posta label'ı
  const getEmailLabel = useCallback(
    (label: string) => {
      const labels: Record<string, string> = {
        home: t('contacts.emailLabels.home'),
        work: t('contacts.emailLabels.work'),
        other: t('contacts.emailLabels.other'),
      };
      return labels[label] || label;
    },
    [t]
  );

  // Yükleniyor
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Kişi bulunamadı
  if (!contact) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-off"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('contacts.notFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />

        <View style={styles.headerActions}>
          <IconButton
            icon={contact.isFavorite ? 'star' : 'star-outline'}
            iconColor={contact.isFavorite ? theme.colors.tertiary : theme.colors.onSurface}
            onPress={handleToggleFavorite}
          />

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={handleEdit}
              title={t('common.edit')}
            />
            <Menu.Item
              leadingIcon={contact.isBlocked ? 'account-check' : 'block-helper'}
              onPress={handleToggleBlocked}
              title={contact.isBlocked ? t('contacts.unblock') : t('contacts.block')}
            />
            <Divider />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                setMenuVisible(false);
                setDeleteDialogVisible(true);
              }}
              title={t('common.delete')}
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profil Başlığı */}
        <View style={styles.profileSection}>
          <Avatar
            name={contact.displayName}
            photoUri={contact.photoUri}
            size={100}
          />
          <Text
            variant="headlineSmall"
            style={[styles.displayName, { color: theme.colors.onBackground }]}
          >
            {contact.displayName}
          </Text>

          {contact.company && (
            <Text
              variant="bodyMedium"
              style={[styles.company, { color: theme.colors.onSurfaceVariant }]}
            >
              {contact.company}
              {contact.jobTitle && ` - ${contact.jobTitle}`}
            </Text>
          )}

          {contact.isBlocked && (
            <Chip
              mode="flat"
              icon="block-helper"
              style={[styles.blockedChip, { backgroundColor: theme.colors.errorContainer }]}
              textStyle={{ color: theme.colors.onErrorContainer }}
            >
              {t('contacts.blocked')}
            </Chip>
          )}
        </View>

        {/* Hızlı Eylemler */}
        {contact.phoneNumbers.length > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => handleCall(contact.phoneNumbers[0].number)}
            >
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={theme.colors.onPrimaryContainer}
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {t('contacts.call')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
              onPress={() => handleSms(contact.phoneNumbers[0].number)}
            >
              <MaterialCommunityIcons
                name="message-text"
                size={24}
                color={theme.colors.onSecondaryContainer}
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onSecondaryContainer }}
              >
                {t('contacts.message')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#25D366' }]}
              onPress={() => handleWhatsApp(contact.phoneNumbers[0].number)}
            >
              <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
              <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Telefon Numaraları */}
        {contact.phoneNumbers.length > 0 && (
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.phoneNumbers')}
            </Text>

            {contact.phoneNumbers.map((phone, index) => (
              <List.Item
                key={phone.id || index}
                title={phone.formattedNumber || phone.number}
                description={getPhoneLabel(phone.label)}
                left={() => (
                  <List.Icon icon="phone" color={theme.colors.primary} />
                )}
                right={() => (
                  <View style={styles.phoneActions}>
                    <IconButton
                      icon="phone"
                      size={20}
                      onPress={() => handleCall(phone.number)}
                    />
                    <IconButton
                      icon="message-text"
                      size={20}
                      onPress={() => handleSms(phone.number)}
                    />
                  </View>
                )}
                onPress={() => handleCall(phone.number)}
                style={styles.listItem}
              />
            ))}
          </View>
        )}

        {/* E-posta Adresleri */}
        {contact.emailAddresses.length > 0 && (
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.emailAddresses')}
            </Text>

            {contact.emailAddresses.map((email, index) => (
              <List.Item
                key={email.id || index}
                title={email.email}
                description={getEmailLabel(email.label)}
                left={() => (
                  <List.Icon icon="email" color={theme.colors.primary} />
                )}
                onPress={() => handleEmail(email.email)}
                style={styles.listItem}
              />
            ))}
          </View>
        )}

        {/* Notlar */}
        {contact.note && (
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.notes')}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.noteText, { color: theme.colors.onSurface }]}
            >
              {contact.note}
            </Text>
          </View>
        )}

        {/* Zil Sesi Ayarı */}
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.primary }]}
          >
            Zil Sesi
          </Text>
          <List.Item
            title={contactRingtone?.title || 'Varsayılan'}
            description={contactRingtone?.hasCustomRingtone ? 'Özel zil sesi' : 'Sistem varsayılanı'}
            left={() => (
              <List.Icon icon="music-note" color={theme.colors.primary} />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            )}
            onPress={openRingtoneModal}
            style={styles.listItem}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Arama İstatistikleri */}
        {callStats.totalCalls > 0 && (
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Arama İstatistikleri
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>{callStats.totalCalls}</Text>
                <Text style={styles.statLabel}>Toplam</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="phone-incoming" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{callStats.incomingCalls}</Text>
                <Text style={styles.statLabel}>Gelen</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="phone-outgoing" size={24} color="#2196F3" />
                <Text style={styles.statValue}>{callStats.outgoingCalls}</Text>
                <Text style={styles.statLabel}>Giden</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="phone-missed" size={24} color="#F44336" />
                <Text style={styles.statValue}>{callStats.missedCalls}</Text>
                <Text style={styles.statLabel}>Cevapsız</Text>
              </View>
            </View>

            <View style={styles.totalDuration}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.totalDurationText, { color: theme.colors.onSurfaceVariant }]}>
                Toplam görüşme: {formatDuration(callStats.totalDuration)}
              </Text>
            </View>

            {callStats.lastCallDate && (
              <Text style={[styles.lastCallText, { color: theme.colors.onSurfaceVariant }]}>
                Son arama: {callStats.lastCallDate.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        )}

        {/* Arama Geçmişi */}
        {callHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Arama Geçmişi
              </Text>
              {callHistory.length > 5 && (
                <TouchableOpacity onPress={() => setShowAllCalls(!showAllCalls)}>
                  <Text style={{ color: theme.colors.primary }}>
                    {showAllCalls ? 'Daha az' : `Tümünü gör (${callHistory.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {(showAllCalls ? callHistory : callHistory.slice(0, 5)).map((call, index) => (
              <List.Item
                key={index}
                title={formatCallDate(call.timestamp)}
                description={`${call.type === 'MISSED' ? 'Cevapsız' : formatDuration(parseInt(call.duration) || 0)} • ${new Date(parseInt(call.timestamp)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                left={() => (
                  <List.Icon
                    icon={getCallTypeIcon(call.type)}
                    color={getCallTypeColor(call.type)}
                  />
                )}
                right={() => (
                  <IconButton
                    icon="phone"
                    size={20}
                    onPress={() => handleCall(call.phoneNumber)}
                  />
                )}
                style={styles.listItem}
              />
            ))}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Ek Bilgiler */}
        <View style={styles.section}>
          {contact.birthday && (
            <List.Item
              title={contact.birthday}
              description={t('contacts.birthday')}
              left={() => (
                <List.Icon icon="cake-variant" color={theme.colors.primary} />
              )}
              style={styles.listItem}
            />
          )}

          {contact.anniversary && (
            <List.Item
              title={contact.anniversary}
              description={t('contacts.anniversary')}
              left={() => (
                <List.Icon icon="heart" color={theme.colors.error} />
              )}
              style={styles.listItem}
            />
          )}
        </View>
      </ScrollView>

      {/* Zil Sesi Seçim Modalı */}
      <Portal>
        <Modal
          visible={ringtoneModalVisible}
          onDismiss={() => {
            ringtoneService.stopRingtone();
            setRingtoneModalVisible(false);
          }}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Zil Sesi Seç
          </Text>

          {loadingRingtones ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView style={styles.ringtoneList}>
              {/* Varsayılan seçeneği */}
              <TouchableOpacity
                style={styles.ringtoneItem}
                onPress={() => setSelectedRingtoneUri('default')}
              >
                <RadioButton
                  value="default"
                  status={selectedRingtoneUri === 'default' || !selectedRingtoneUri ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedRingtoneUri('default')}
                />
                <Text style={styles.ringtoneTitle}>Varsayılan</Text>
              </TouchableOpacity>

              {/* Sistem zil sesleri */}
              {systemRingtones.map((ringtone) => (
                <TouchableOpacity
                  key={ringtone.id}
                  style={styles.ringtoneItem}
                  onPress={() => {
                    setSelectedRingtoneUri(ringtone.uri);
                    previewRingtone(ringtone.uri);
                  }}
                >
                  <RadioButton
                    value={ringtone.uri}
                    status={selectedRingtoneUri === ringtone.uri ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setSelectedRingtoneUri(ringtone.uri);
                      previewRingtone(ringtone.uri);
                    }}
                  />
                  <Text style={styles.ringtoneTitle}>{ringtone.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <Button
              onPress={() => {
                ringtoneService.stopRingtone();
                setRingtoneModalVisible(false);
              }}
            >
              İptal
            </Button>
            <Button mode="contained" onPress={saveRingtone}>
              Kaydet
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Silme Onay Dialogu */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>{t('contacts.deleteContact')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('contacts.deleteConfirm', { name: contact.displayName })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  displayName: {
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  company: {
    marginTop: 4,
    textAlign: 'center',
  },
  blockedChip: {
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    gap: 4,
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listItem: {
    paddingVertical: 4,
  },
  phoneActions: {
    flexDirection: 'row',
  },
  noteText: {
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  // İstatistikler
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  totalDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  totalDurationText: {
    fontSize: 14,
  },
  lastCallText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
    marginBottom: 8,
  },
  // Modal
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  ringtoneList: {
    maxHeight: 300,
  },
  ringtoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ringtoneTitle: {
    fontSize: 15,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
});

export default ContactDetailScreen;
