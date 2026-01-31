/**
 * LifeCall - Call Theme Context
 *
 * Arama ekranı tema yönetimi için React Context
 * - Aktif tema seçimi
 * - Özel tema kaydetme
 * - AsyncStorage ile tema saklama
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CallTheme,
  DEFAULT_CALL_THEME,
  DEFAULT_CALL_THEMES,
  getCallThemeById,
  createCustomCallTheme,
} from './callThemes';

// AsyncStorage keys
const ACTIVE_THEME_KEY = '@lifecall_call_theme';
const CUSTOM_THEMES_KEY = '@lifecall_custom_themes';

// Context tipi
interface CallThemeContextType {
  // Aktif tema
  activeTheme: CallTheme;
  activeThemeId: string;

  // Tüm temalar
  defaultThemes: CallTheme[];
  customThemes: CallTheme[];
  allThemes: CallTheme[];

  // Tema değiştirme
  setActiveTheme: (themeId: string) => Promise<void>;

  // Özel tema işlemleri
  saveCustomTheme: (theme: CallTheme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  updateCustomTheme: (theme: CallTheme) => Promise<void>;
  duplicateTheme: (themeId: string) => Promise<CallTheme>;

  // Yardımcılar
  isLoading: boolean;
  getThemeById: (id: string) => CallTheme | undefined;
}

// Context oluştur
const CallThemeContext = createContext<CallThemeContextType | undefined>(undefined);

// Provider props
interface CallThemeProviderProps {
  children: ReactNode;
}

/**
 * Call Theme Provider bileşeni
 */
export const CallThemeProvider: React.FC<CallThemeProviderProps> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<string>(DEFAULT_CALL_THEME.id);
  const [customThemes, setCustomThemes] = useState<CallTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tüm temaları birleştir
  const allThemes = useMemo(() => {
    return [...DEFAULT_CALL_THEMES, ...customThemes];
  }, [customThemes]);

  // Aktif temayı bul
  const activeTheme = useMemo(() => {
    const theme = allThemes.find(t => t.id === activeThemeId);
    return theme || DEFAULT_CALL_THEME;
  }, [activeThemeId, allThemes]);

  // Tema bul
  const getThemeById = useCallback((id: string): CallTheme | undefined => {
    return allThemes.find(t => t.id === id);
  }, [allThemes]);

  // Kaydedilmiş verileri yükle
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Aktif tema ID'sini yükle
        const savedThemeId = await AsyncStorage.getItem(ACTIVE_THEME_KEY);
        if (savedThemeId) {
          setActiveThemeId(savedThemeId);
        }

        // Özel temaları yükle
        const savedCustomThemes = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);
        if (savedCustomThemes) {
          const parsed = JSON.parse(savedCustomThemes);
          if (Array.isArray(parsed)) {
            setCustomThemes(parsed);
          }
        }
      } catch (error) {
        console.warn('Call theme verileri yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedData();
  }, []);

  // Aktif temayı değiştir
  const setActiveTheme = useCallback(async (themeId: string) => {
    setActiveThemeId(themeId);
    try {
      await AsyncStorage.setItem(ACTIVE_THEME_KEY, themeId);
    } catch (error) {
      console.error('Aktif tema kaydedilemedi:', error);
    }
  }, []);

  // Özel temaları kaydet (yardımcı)
  const saveCustomThemesToStorage = useCallback(async (themes: CallTheme[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
    } catch (error) {
      console.error('Özel temalar kaydedilemedi:', error);
    }
  }, []);

  // Yeni özel tema kaydet
  const saveCustomTheme = useCallback(async (theme: CallTheme) => {
    const newTheme: CallTheme = {
      ...theme,
      isCustom: true,
      createdAt: theme.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedThemes = [...customThemes, newTheme];
    setCustomThemes(updatedThemes);
    await saveCustomThemesToStorage(updatedThemes);
  }, [customThemes, saveCustomThemesToStorage]);

  // Özel tema güncelle
  const updateCustomTheme = useCallback(async (theme: CallTheme) => {
    const updatedTheme: CallTheme = {
      ...theme,
      updatedAt: new Date().toISOString(),
    };

    const updatedThemes = customThemes.map(t =>
      t.id === theme.id ? updatedTheme : t
    );
    setCustomThemes(updatedThemes);
    await saveCustomThemesToStorage(updatedThemes);
  }, [customThemes, saveCustomThemesToStorage]);

  // Özel tema sil
  const deleteCustomTheme = useCallback(async (themeId: string) => {
    const updatedThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(updatedThemes);
    await saveCustomThemesToStorage(updatedThemes);

    // Eğer silinen tema aktifse, varsayılana dön
    if (activeThemeId === themeId) {
      await setActiveTheme(DEFAULT_CALL_THEME.id);
    }
  }, [customThemes, activeThemeId, saveCustomThemesToStorage, setActiveTheme]);

  // Tema kopyala
  const duplicateTheme = useCallback(async (themeId: string): Promise<CallTheme> => {
    const sourceTheme = getThemeById(themeId) || DEFAULT_CALL_THEME;
    const newTheme = createCustomCallTheme(sourceTheme);
    newTheme.name = `${sourceTheme.name} (Copy)`;

    await saveCustomTheme(newTheme);
    return newTheme;
  }, [getThemeById, saveCustomTheme]);

  // Context değeri
  const value = useMemo(
    () => ({
      activeTheme,
      activeThemeId,
      defaultThemes: DEFAULT_CALL_THEMES,
      customThemes,
      allThemes,
      setActiveTheme,
      saveCustomTheme,
      deleteCustomTheme,
      updateCustomTheme,
      duplicateTheme,
      isLoading,
      getThemeById,
    }),
    [
      activeTheme,
      activeThemeId,
      customThemes,
      allThemes,
      setActiveTheme,
      saveCustomTheme,
      deleteCustomTheme,
      updateCustomTheme,
      duplicateTheme,
      isLoading,
      getThemeById,
    ]
  );

  return (
    <CallThemeContext.Provider value={value}>
      {children}
    </CallThemeContext.Provider>
  );
};

/**
 * Call Theme hook'u
 */
export const useCallTheme = (): CallThemeContextType => {
  const context = useContext(CallThemeContext);
  if (context === undefined) {
    throw new Error('useCallTheme must be used within a CallThemeProvider');
  }
  return context;
};

export default CallThemeProvider;
