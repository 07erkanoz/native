/**
 * LifeCall - All-in-One Phone, Contacts, Calendar & Notes App
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Store
import { store, persistor } from './src/store';

// Theme
import { ThemeProvider, useAppTheme } from './src/theme';

// i18n
import { initI18n } from './src/i18n';

// Navigation
import { RootNavigator } from './src/navigation';

// Components
import { CallOverlay } from './src/components';

// Loading bileşeni
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
    <Text style={styles.loadingText}>LifeCall</Text>
  </View>
);

// Ana uygulama içeriği
const AppContent: React.FC = () => {
  const { theme, isDarkMode } = useAppTheme();

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

  // i18n'i başlat
  useEffect(() => {
    const init = async () => {
      await initI18n();
      setIsI18nReady(true);
    };
    init();
  }, []);

  // i18n hazır olana kadar bekle
  if (!isI18nReady) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <ThemeProvider>
              <NavigationContainer>
                <AppContent />
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
    color: '#2196F3',
  },
});

export default App;
