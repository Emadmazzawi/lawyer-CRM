import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initialized: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) {
          setThemeMode(storedTheme as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setInitialized(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('app_theme', mode);
  };

  const colorScheme: ColorScheme = 
    themeMode === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : (themeMode as ColorScheme);

  return (
    <ThemeContext.Provider value={{ themeMode, colorScheme, setTheme, initialized }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return a fallback if used outside of provider (though it shouldn't be)
    return { 
      themeMode: 'system' as ThemeMode, 
      colorScheme: 'light' as ColorScheme, 
      setTheme: async () => {}, 
      initialized: false 
    };
  }
  return context;
};
