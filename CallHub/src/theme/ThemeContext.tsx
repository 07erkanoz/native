/**
 * LifeCall - Tema Context
 *
 * Tema yönetimi için React Context
 * - Light/Dark/System mod desteği
 * - AsyncStorage ile tema tercihi saklama
 * - Sistem teması değişikliklerini izleme
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme, ThemeMode } from './themes';

// AsyncStorage key
const THEME_STORAGE_KEY = '@lifecall_theme';

// Context tipi
interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

// Context oluştur
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Tema Provider bileşeni
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Gerçek dark mode durumunu hesapla
  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Aktif temayı seç
  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  // Kaydedilmiş temayı yükle
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.warn('Tema tercihi yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  // Sistem teması değişikliklerini izle
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Sadece sistem modundayken güncelle
      if (themeMode === 'system') {
        // State otomatik güncellenecek (useMemo bağımlılığı)
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  // Tema modunu değiştir ve kaydet
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Tema tercihi kaydedilemedi:', error);
    }
  }, []);

  // Temayı toggle et (light <-> dark)
  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(newMode);
  }, [isDarkMode, setThemeMode]);

  // Context değeri
  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDarkMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isDarkMode, setThemeMode, toggleTheme]
  );

  // Yüklenene kadar bekle
  if (isLoading) {
    return null; // veya bir loading indicator
  }

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Tema hook'u
 * @returns Tema context değerleri
 */
export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
