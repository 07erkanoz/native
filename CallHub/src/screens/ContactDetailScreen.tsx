/**
 * LifeCall - Kişi Detay Ekranı
 *
 * Kişi bilgilerini görüntüler ve düzenler
 * - Telefon numaraları
 * - E-posta adresleri
 * - Arama geçmişi
 * - Favori ve engelleme işlemleri
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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { Contact } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';

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

  // Kişiyi yükle
  useEffect(() => {
    loadContact();
  }, [contactId]);

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
});

export default ContactDetailScreen;
