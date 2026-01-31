/**
 * LifeCall - Zil Sesi Ayarları Ekranı
 *
 * Sistem zil sesleri ve özel zil sesleri seçimi.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Text,
  Appbar,
  List,
  RadioButton,
  Divider,
  Searchbar,
  Chip,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ringtoneService, RingtoneInfo } from '../../native/RingtoneModule';

const SELECTED_RINGTONE_KEY = '@lifecall_selected_ringtone';

type RingtoneCategory = 'system' | 'custom' | 'all';

export const SettingsRingtoneScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [systemRingtones, setSystemRingtones] = useState<RingtoneInfo[]>([]);
  const [customRingtones, setCustomRingtones] = useState<RingtoneInfo[]>([]);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<RingtoneCategory>('system');

  // Zil seslerini yükle
  useEffect(() => {
    loadRingtones();
    loadSelectedRingtone();

    return () => {
      // Ekrandan çıkınca durduromething
      ringtoneService.stopRingtone();
    };
  }, []);

  const loadRingtones = async () => {
    setLoading(true);
    try {
      const { system, custom } = await ringtoneService.getAllRingtones();
      setSystemRingtones(system);
      setCustomRingtones(custom);
    } catch (error) {
      console.error('Zil sesleri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedRingtone = async () => {
    try {
      const stored = await AsyncStorage.getItem(SELECTED_RINGTONE_KEY);
      if (stored) {
        setSelectedUri(stored);
      } else {
        const defaultRingtone = await ringtoneService.getDefaultRingtone();
        setSelectedUri(defaultRingtone.uri);
      }
    } catch (error) {
      console.error('Seçili zil sesi yüklenemedi:', error);
    }
  };

  const handleSelect = async (ringtone: RingtoneInfo) => {
    setSelectedUri(ringtone.uri);
    await AsyncStorage.setItem(SELECTED_RINGTONE_KEY, ringtone.uri);
  };

  const handlePlay = async (ringtone: RingtoneInfo) => {
    if (playingUri === ringtone.uri) {
      // Durdur
      await ringtoneService.stopRingtone();
      setPlayingUri(null);
    } else {
      // Çal
      setPlayingUri(ringtone.uri);
      const success = await ringtoneService.playRingtone(ringtone.uri);
      if (!success) {
        setPlayingUri(null);
        Alert.alert('Hata', 'Zil sesi çalınamadı');
      }

      // 10 saniye sonra otomatik durdur
      setTimeout(async () => {
        await ringtoneService.stopRingtone();
        setPlayingUri(null);
      }, 10000);
    }
  };

  const handleSetDefault = async () => {
    const defaultRingtone = await ringtoneService.getDefaultRingtone();
    if (defaultRingtone.uri) {
      setSelectedUri(defaultRingtone.uri);
      await AsyncStorage.setItem(SELECTED_RINGTONE_KEY, defaultRingtone.uri);
    }
  };

  const handleSetSilent = async () => {
    setSelectedUri('silent');
    await AsyncStorage.setItem(SELECTED_RINGTONE_KEY, 'silent');
  };

  // Filtreleme
  const getFilteredRingtones = useCallback(() => {
    let ringtones: RingtoneInfo[] = [];

    if (category === 'system' || category === 'all') {
      ringtones = [...ringtones, ...systemRingtones];
    }
    if (category === 'custom' || category === 'all') {
      ringtones = [...ringtones, ...customRingtones];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      ringtones = ringtones.filter(r =>
        r.title.toLowerCase().includes(query)
      );
    }

    return ringtones;
  }, [category, systemRingtones, customRingtones, searchQuery]);

  const filteredRingtones = getFilteredRingtones();

  const renderRingtoneItem = (ringtone: RingtoneInfo) => {
    const isSelected = selectedUri === ringtone.uri;
    const isPlaying = playingUri === ringtone.uri;

    return (
      <TouchableOpacity
        key={ringtone.id}
        style={[
          styles.ringtoneItem,
          isSelected && { backgroundColor: theme.colors.primaryContainer },
        ]}
        onPress={() => handleSelect(ringtone)}
      >
        <View style={styles.ringtoneInfo}>
          <RadioButton
            value={ringtone.uri}
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => handleSelect(ringtone)}
            color={theme.colors.primary}
          />
          <View style={styles.ringtoneText}>
            <Text
              style={[
                styles.ringtoneTitle,
                isSelected && { color: theme.colors.primary, fontWeight: 'bold' },
              ]}
              numberOfLines={1}
            >
              {ringtone.title}
            </Text>
            {ringtone.type === 'custom' && (
              <Text style={styles.ringtoneType}>Özel</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.playButton,
            isPlaying && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handlePlay(ringtone)}
        >
          <Icon
            name={isPlaying ? 'stop' : 'play'}
            size={20}
            color={isPlaying ? '#fff' : theme.colors.primary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.ringtone', 'Zil Sesi')} />
      </Appbar.Header>

      {/* Arama */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('common.search', 'Ara...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Kategori seçimi */}
      <View style={styles.categoryContainer}>
        <Chip
          selected={category === 'system'}
          onPress={() => setCategory('system')}
          style={styles.chip}
          showSelectedCheck={false}
        >
          Sistem ({systemRingtones.length})
        </Chip>
        <Chip
          selected={category === 'custom'}
          onPress={() => setCategory('custom')}
          style={styles.chip}
          showSelectedCheck={false}
        >
          Özel ({customRingtones.length})
        </Chip>
        <Chip
          selected={category === 'all'}
          onPress={() => setCategory('all')}
          style={styles.chip}
          showSelectedCheck={false}
        >
          Tümü
        </Chip>
      </View>

      {/* Hızlı seçenekler */}
      <View style={styles.quickOptions}>
        <TouchableOpacity
          style={[
            styles.quickOption,
            selectedUri === 'silent' && { backgroundColor: theme.colors.primaryContainer },
          ]}
          onPress={handleSetSilent}
        >
          <Icon name="volume-off" size={24} color={theme.colors.primary} />
          <Text style={styles.quickOptionText}>Sessiz</Text>
          {selectedUri === 'silent' && (
            <Icon name="check" size={20} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickOption}
          onPress={handleSetDefault}
        >
          <Icon name="music-note" size={24} color={theme.colors.primary} />
          <Text style={styles.quickOptionText}>Varsayılan</Text>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* Zil sesi listesi */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Zil sesleri yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {filteredRingtones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="music-note-off" size={48} color={theme.colors.outline} />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Arama sonucu bulunamadı'
                  : category === 'custom'
                  ? 'Özel zil sesi bulunamadı'
                  : 'Zil sesi bulunamadı'}
              </Text>
              {category === 'custom' && !searchQuery && (
                <Text style={styles.emptyHint}>
                  Müzik dosyalarınızı indirmeler klasörüne ekleyin
                </Text>
              )}
            </View>
          ) : (
            filteredRingtones.map(renderRingtoneItem)
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 0,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
  quickOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  quickOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  ringtoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  ringtoneInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringtoneText: {
    flex: 1,
    marginLeft: 4,
  },
  ringtoneTitle: {
    fontSize: 15,
  },
  ringtoneType: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomPadding: {
    height: 32,
  },
});

export default SettingsRingtoneScreen;
