/**
 * LifeCall - Favoriler Ekranı
 *
 * Favori kişileri grid görünümde gösterir
 * - Hızlı arama butonu
 * - Sürükle-bırak ile sıralama
 * - Favori ekleme/kaldırma
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Linking,
} from 'react-native';
import {
  Text,
  FAB,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { Contact } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import ContactRepository from '../database/repositories/ContactRepository';
import { defaultAppService } from '../services';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_SIZE = (width - 48) / COLUMN_COUNT;

const FavoritesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<RootStackScreenProps<'Main'>['navigation']>();

  // State
  const [favorites, setFavorites] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Favorileri yükle
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const contacts = await ContactRepository.getFavoriteContacts();
      setFavorites(contacts);
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Yenile
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  // Arama yap
  const handleCall = useCallback(async (contact: Contact) => {
    if (contact.phoneNumbers.length === 0) return;

    try {
      await defaultAppService.makeCall(contact.phoneNumbers[0].number);
    } catch (error) {
      Linking.openURL(`tel:${contact.phoneNumbers[0].number}`);
    }
  }, []);

  // SMS gönder
  const handleSms = useCallback((contact: Contact) => {
    if (contact.phoneNumbers.length === 0) return;
    Linking.openURL(`sms:${contact.phoneNumbers[0].number}`);
  }, []);

  // WhatsApp
  const handleWhatsApp = useCallback((contact: Contact) => {
    if (contact.phoneNumbers.length === 0) return;
    const cleanNumber = contact.phoneNumbers[0].number.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  }, []);

  // Kişi detayına git
  const handleContactPress = useCallback(
    (contact: Contact) => {
      navigation.navigate('ContactDetail', { contactId: contact.id });
    },
    [navigation]
  );

  // Uzun basma - aksiyon menüsü
  const handleLongPress = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setActionModalVisible(true);
  }, []);

  // Favoriden kaldır
  const handleRemoveFavorite = useCallback(async () => {
    if (!selectedContact) return;

    try {
      await ContactRepository.toggleFavorite(selectedContact.id, false);
      setFavorites((prev) => prev.filter((c) => c.id !== selectedContact.id));
    } catch (error) {
      console.error('Favori kaldırılamadı:', error);
    } finally {
      setActionModalVisible(false);
      setSelectedContact(null);
    }
  }, [selectedContact]);

  // Kart render
  const renderFavoriteCard = useCallback(
    ({ item }: { item: Contact }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleContactPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <Avatar name={item.displayName} photoUri={item.photoUri} size={56} />

        <Text
          variant="labelMedium"
          numberOfLines={1}
          style={[styles.cardName, { color: theme.colors.onSurface }]}
        >
          {item.displayName}
        </Text>

        {/* Hızlı Arama Butonu */}
        <TouchableOpacity
          style={[styles.callButton, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={() => handleCall(item)}
        >
          <MaterialCommunityIcons
            name="phone"
            size={18}
            color={theme.colors.onPrimaryContainer}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [theme, handleContactPress, handleLongPress, handleCall]
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

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="star-outline"
          size={80}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
        >
          {t('favorites.noFavorites')}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('favorites.addFavoriteHint')}
        </Text>
      </View>
    );
  }, [isLoading, theme, t]);

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
          {t('favorites.title')}
        </Text>

        {favorites.length > 0 && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {favorites.length} {t('favorites.count')}
          </Text>
        )}
      </View>

      {/* Grid Liste */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteCard}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Aksiyon Modal */}
      <Portal>
        <Modal
          visible={actionModalVisible}
          onDismiss={() => {
            setActionModalVisible(false);
            setSelectedContact(null);
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {selectedContact && (
            <>
              <View style={styles.modalHeader}>
                <Avatar
                  name={selectedContact.displayName}
                  photoUri={selectedContact.photoUri}
                  size={48}
                />
                <Text
                  variant="titleMedium"
                  style={[styles.modalName, { color: theme.colors.onSurface }]}
                >
                  {selectedContact.displayName}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    handleCall(selectedContact);
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                  >
                    {t('contacts.call')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    handleSms(selectedContact);
                  }}
                >
                  <MaterialCommunityIcons
                    name="message-text"
                    size={24}
                    color={theme.colors.secondary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                  >
                    {t('contacts.message')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    handleWhatsApp(selectedContact);
                  }}
                >
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={24}
                    color="#25D366"
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>

                <View
                  style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]}
                />

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setActionModalVisible(false);
                    navigation.navigate('ContactDetail', {
                      contactId: selectedContact.id,
                    });
                  }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                  >
                    {t('contacts.viewDetails')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={handleRemoveFavorite}
                >
                  <MaterialCommunityIcons
                    name="star-off"
                    size={24}
                    color={theme.colors.error}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.error, marginLeft: 12 }}
                  >
                    {t('favorites.remove')}
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
    paddingBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: 8,
  },
  cardName: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  callButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalName: {
    marginLeft: 12,
    fontWeight: '600',
  },
  modalActions: {},
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});

export default FavoritesScreen;
