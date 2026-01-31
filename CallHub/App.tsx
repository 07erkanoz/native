/**
 * LifeCall - All-in-One Phone, Contacts, Calendar & Notes App
 * @format
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store
import { store, persistor } from './src/store';

// Theme
import { ThemeProvider, useAppTheme } from './src/theme';

// i18n
import { initI18n } from './src/i18n';

// Navigation
import { RootNavigator } from './src/navigation';
import { RootStackParamList } from './src/navigation/types';

// Components
import { CallOverlay } from './src/components';

// Screens
import SetupWizardScreen from './src/screens/SetupWizardScreen';

// Storage key
const SETUP_COMPLETED_KEY = 'setupCompleted';

// Loading bileşeni
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6750A4" />
    <Text style={styles.loadingText}>LifeCall</Text>
  </View>
);

// Ana uygulama içeriği
const AppContent: React.FC<{
  showSetupWizard: boolean;
  onSetupComplete: () => void;
}> = ({ showSetupWizard, onSetupComplete }) => {
  const { theme, isDarkMode } = useAppTheme();

  // Kurulum sihirbazı gösterilecekse
  if (showSetupWizard) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <SetupWizardScreen onComplete={onSetupComplete} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <RootNavigator />
      {/* Çağrı Overlay - Floating UI'ları yönetir */}
      <CallOverlay />
    </>
  );
};

// Ana App bileşeni
function App(): React.JSX.Element {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // i18n'i başlat
  useEffect(() => {
    const init = async () => {
      await initI18n();
      setIsI18nReady(true);
    };
    init();
  }, []);

  // Kurulum durumunu kontrol et
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Sadece Android için kurulum sihirbazı göster
        if (Platform.OS !== 'android') {
          setIsCheckingSetup(false);
          return;
        }

        const setupCompleted = await AsyncStorage.getItem(SETUP_COMPLETED_KEY);

        // Kurulum tamamlanmamışsa sihirbazı göster
        if (setupCompleted !== 'true') {
          setShowSetupWizard(true);
        }
      } catch (error) {
        console.error('Kurulum durumu kontrolü hatası:', error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (isI18nReady) {
      checkSetupStatus();
    }
  }, [isI18nReady]);

  // Kurulum tamamlandığında
  const handleSetupComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SETUP_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Kurulum kaydetme hatası:', error);
    }
    setShowSetupWizard(false);
  }, []);

  // i18n veya setup kontrolü hazır olana kadar bekle
  if (!isI18nReady || isCheckingSetup) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <ThemeProvider>
              <NavigationContainer>
                <AppContent
                  showSetupWizard={showSetupWizard}
                  onSetupComplete={handleSetupComplete}
                />
              </NavigationContainer>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750A4',
  },
});

export default App;
