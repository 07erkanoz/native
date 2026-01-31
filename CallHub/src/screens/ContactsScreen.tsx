/**
 * LifeCall - Kişiler Ekranı
 *
 * Cihaz rehberinden kişileri listeler
 * - Alfabetik sıralama
 * - Hızlı alfabe kaydırma
 * - Arama
 * - Hesap filtreleme
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  ActivityIndicator,
  Divider,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchContacts, setSearchQuery } from '../store/slices/contactsSlice';
import { ContactListItem } from '../components';
import { Contact } from '../types';
import { RootStackScreenProps } from '../navigation/types';

// Alfabetik bölüm tipi
interface ContactSection {
  title: string;
  data: Contact[];
}

const ContactsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<RootStackScreenProps<'Main'>['navigation']>();
  const dispatch = useAppDispatch();
  const sectionListRef = useRef<SectionList>(null);

  // Redux state
  const { contacts, isLoading, searchQuery } = useAppSelector(
    (state) => state.contacts
  );

  // Lokal state
  const [refreshing, setRefreshing] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(true);

  // İlk yükleme
  useEffect(() => {
    loadContacts();
  }, []);

  // Kişileri yükle
  const loadContacts = useCallback(async () => {
    try {
      await dispatch(fetchContacts()).unwrap();
    } catch (error) {
      console.error('Kişiler yüklenemedi:', error);
    }
  }, [dispatch]);

  // Yenile
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  // Arama
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  // Filtrelenmiş kişiler
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.displayName.toLowerCase().includes(query) ||
        contact.phoneNumbers.some((p) => p.number.includes(query))
    );
  }, [contacts, searchQuery]);

  // Alfabetik bölümlere ayır
  const sections = useMemo((): ContactSection[] => {
    const grouped: Record<string, Contact[]> = {};

    filteredContacts.forEach((contact) => {
      const firstChar = contact.displayName.charAt(0).toUpperCase();
      const key = /[A-ZÇĞİÖŞÜ]/.test(firstChar) ? firstChar : '#';

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(contact);
    });

    // Türkçe alfabeye göre sırala
    const turkishAlphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ#';

    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const indexA = turkishAlphabet.indexOf(a);
        const indexB = turkishAlphabet.indexOf(b);
        return indexA - indexB;
      })
      .map(([title, data]) => ({ title, data }));
  }, [filteredContacts]);

  // Alfabe harfleri
  const alphabetLetters = useMemo(() => {
    return sections.map((s) => s.title);
  }, [sections]);

  // Kişiye tıklama
  const handleContactPress = useCallback(
    (contact: Contact) => {
      navigation.navigate('ContactDetail', { contactId: contact.id });
    },
    [navigation]
  );

  // Yeni kişi ekle
  const handleAddContact = useCallback(() => {
    navigation.navigate('ContactAdd', {});
  }, [navigation]);

  // Harfe tıklama - ilgili bölüme kaydır
  const handleAlphabetPress = useCallback(
    (letter: string) => {
      const sectionIndex = sections.findIndex((s) => s.title === letter);
      if (sectionIndex !== -1 && sectionListRef.current) {
        sectionListRef.current.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      }
    },
    [sections]
  );

  // Bölüm başlığı render
  const renderSectionHeader = useCallback(
    ({ section }: { section: ContactSection }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Text
          variant="titleSmall"
          style={[styles.sectionTitle, { color: theme.colors.primary }]}
        >
          {section.title}
        </Text>
      </View>
    ),
    [theme]
  );

  // Kişi render
  const renderContact = useCallback(
    ({ item }: { item: Contact }) => (
      <ContactListItem
        contact={item}
        onPress={() => handleContactPress(item)}
        showPhoneNumber
      />
    ),
    [handleContactPress]
  );

  // Boş liste
  const renderEmptyList = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('common.loading')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={80}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
        >
          {t('contacts.noContacts')}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('contacts.addFirstContact')}
        </Text>
      </View>
    );
  }, [isLoading, theme, t]);

  // Alfabe kaydırıcı
  const renderAlphabetIndex = useCallback(() => {
    if (!showAlphabet || alphabetLetters.length === 0) return null;

    return (
      <View style={styles.alphabetContainer}>
        {alphabetLetters.map((letter) => (
          <TouchableOpacity
            key={letter}
            style={styles.alphabetLetter}
            onPress={() => handleAlphabetPress(letter)}
          >
            <Text
              style={[styles.alphabetText, { color: theme.colors.primary }]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [showAlphabet, alphabetLetters, theme, handleAlphabetPress]);

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
          {t('contacts.title')}
        </Text>

        {/* Kişi sayısı */}
        <Chip
          mode="outlined"
          style={styles.countChip}
          textStyle={{ fontSize: 12 }}
        >
          {filteredContacts.length}
        </Chip>
      </View>

      {/* Arama */}
      <Searchbar
        placeholder={t('contacts.searchContacts', {
          count: contacts.length,
        })}
        onChangeText={handleSearch}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ fontSize: 14 }}
      />

      {/* Kişi Listesi */}
      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmptyList}
          ItemSeparatorComponent={() => (
            <Divider style={{ marginLeft: 76 }} />
          )}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={
            sections.length === 0 ? styles.emptyList : undefined
          }
          getItemLayout={(data, index) => ({
            length: 68,
            offset: 68 * index,
            index,
          })}
        />

        {/* Alfabe İndeksi */}
        {renderAlphabetIndex()}
      </View>

      {/* Yeni Kişi FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={handleAddContact}
      />
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
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  countChip: {
    height: 28,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 0,
    borderRadius: 12,
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  alphabetContainer: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  alphabetLetter: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  alphabetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default ContactsScreen;
