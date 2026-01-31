/**
 * LifeCall - Numara Çevirici Ekranı
 *
 * Telefon numarası girmek için tuş takımı
 * - T9 stil tuş takımı
 * - Numara görüntüleme
 * - Kişi arama önerileri
 * - Hızlı arama
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
  FlatList,
  Linking,
} from 'react-native';
import {
  Text,
  IconButton,
  FAB,
  Divider,
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
const BUTTON_SIZE = (width - 80) / 3;

// Tuş takımı düzeni
const DIAL_PAD = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const DialerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<RootStackScreenProps<'Main'>['navigation']>();

  // State
  const [number, setNumber] = useState('');
  const [suggestions, setSuggestions] = useState<Contact[]>([]);

  // Numara değiştiğinde kişi ara
  useEffect(() => {
    if (number.length >= 3) {
      searchContacts();
    } else {
      setSuggestions([]);
    }
  }, [number]);

  // Kişi ara
  const searchContacts = useCallback(async () => {
    try {
      const results = await ContactRepository.searchContacts(number);
      setSuggestions(results.slice(0, 5));
    } catch (error) {
      console.error('Kişi araması hatası:', error);
    }
  }, [number]);

  // Tuşa bas
  const handlePress = useCallback((digit: string) => {
    Vibration.vibrate(10);
    setNumber((prev) => prev + digit);
  }, []);

  // Uzun basma (0 için +)
  const handleLongPress = useCallback((digit: string) => {
    Vibration.vibrate(20);
    if (digit === '0') {
      setNumber((prev) => prev + '+');
    }
  }, []);

  // Sil
  const handleDelete = useCallback(() => {
    Vibration.vibrate(10);
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  // Tümünü sil
  const handleClear = useCallback(() => {
    Vibration.vibrate(20);
    setNumber('');
  }, []);

  // Arama yap
  const handleCall = useCallback(async () => {
    if (!number) return;

    try {
      await defaultAppService.makeCall(number);
    } catch (error) {
      Linking.openURL(`tel:${number}`);
    }
  }, [number]);

  // Kişiye dokun
  const handleContactPress = useCallback(
    (contact: Contact) => {
      if (contact.phoneNumbers.length > 0) {
        setNumber(contact.phoneNumbers[0].number);
      }
    },
    []
  );

  // Formatlanmış numara
  const formattedNumber = useMemo(() => {
    // Basit Türk telefon formatı
    if (number.length === 0) return '';

    let formatted = number;

    // +90 ile başlıyorsa
    if (number.startsWith('+90') && number.length > 3) {
      const rest = number.slice(3);
      if (rest.length <= 3) {
        formatted = `+90 ${rest}`;
      } else if (rest.length <= 6) {
        formatted = `+90 ${rest.slice(0, 3)} ${rest.slice(3)}`;
      } else if (rest.length <= 8) {
        formatted = `+90 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
      } else {
        formatted = `+90 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`;
      }
    } else if (number.startsWith('0') && number.length > 1) {
      // 0 ile başlıyorsa
      const rest = number.slice(1);
      if (rest.length <= 3) {
        formatted = `0${rest}`;
      } else if (rest.length <= 6) {
        formatted = `0${rest.slice(0, 3)} ${rest.slice(3)}`;
      } else if (rest.length <= 8) {
        formatted = `0${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
      } else {
        formatted = `0${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`;
      }
    }

    return formatted;
  }, [number]);

  // Tuş render
  const renderKey = useCallback(
    ({ digit, letters }: { digit: string; letters: string }) => (
      <TouchableOpacity
        key={digit}
        style={[styles.key, { backgroundColor: theme.colors.surfaceVariant }]}
        onPress={() => handlePress(digit)}
        onLongPress={() => handleLongPress(digit)}
        activeOpacity={0.7}
      >
        <Text
          variant="headlineLarge"
          style={[styles.keyDigit, { color: theme.colors.onSurface }]}
        >
          {digit}
        </Text>
        {letters && (
          <Text
            variant="labelSmall"
            style={[styles.keyLetters, { color: theme.colors.onSurfaceVariant }]}
          >
            {letters}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [theme, handlePress, handleLongPress]
  );

  // Öneri render
  const renderSuggestion = useCallback(
    ({ item }: { item: Contact }) => (
      <TouchableOpacity
        style={styles.suggestion}
        onPress={() => handleContactPress(item)}
      >
        <Avatar name={item.displayName} photoUri={item.photoUri} size={40} />
        <View style={styles.suggestionInfo}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface }}
            numberOfLines={1}
          >
            {item.displayName}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {item.phoneNumbers[0]?.number}
          </Text>
        </View>
        <IconButton
          icon="phone"
          size={20}
          onPress={() => {
            if (item.phoneNumbers[0]) {
              defaultAppService.makeCall(item.phoneNumbers[0].number);
            }
          }}
        />
      </TouchableOpacity>
    ),
    [theme, handleContactPress]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Kapatma Butonu */}
      <IconButton
        icon="close"
        size={28}
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
      />

      {/* Numara Görüntüleme */}
      <View style={styles.numberContainer}>
        <Text
          variant="displaySmall"
          style={[
            styles.numberText,
            { color: theme.colors.onBackground },
            number.length > 12 && styles.smallerNumber,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedNumber || t('dialer.enterNumber')}
        </Text>

        {number.length > 0 && (
          <View style={styles.numberActions}>
            <TouchableOpacity onPress={handleDelete} onLongPress={handleClear}>
              <MaterialCommunityIcons
                name="backspace-outline"
                size={28}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Öneriler */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
          <Divider style={styles.divider} />
        </View>
      )}

      {/* Tuş Takımı */}
      <View style={styles.dialPad}>
        <View style={styles.dialPadRow}>
          {DIAL_PAD.slice(0, 3).map(renderKey)}
        </View>
        <View style={styles.dialPadRow}>
          {DIAL_PAD.slice(3, 6).map(renderKey)}
        </View>
        <View style={styles.dialPadRow}>
          {DIAL_PAD.slice(6, 9).map(renderKey)}
        </View>
        <View style={styles.dialPadRow}>
          {DIAL_PAD.slice(9, 12).map(renderKey)}
        </View>
      </View>

      {/* Arama Butonu */}
      <View style={styles.callButtonContainer}>
        <FAB
          icon="phone"
          size="large"
          style={[styles.callButton, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={handleCall}
          disabled={!number}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingTop: 60,
    paddingBottom: 16,
    minHeight: 100,
  },
  numberText: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  smallerNumber: {
    fontSize: 28,
  },
  numberActions: {
    position: 'absolute',
    right: 16,
  },
  suggestionsContainer: {
    marginBottom: 8,
  },
  suggestionsList: {
    paddingHorizontal: 16,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  suggestionInfo: {
    marginLeft: 10,
    marginRight: 4,
  },
  divider: {
    marginTop: 8,
  },
  dialPad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialPadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontWeight: '400',
  },
  keyLetters: {
    marginTop: -4,
    letterSpacing: 1,
  },
  callButtonContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  callButton: {
    elevation: 4,
  },
});

export default DialerScreen;
