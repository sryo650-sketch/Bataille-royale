import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, Theme } from '../theme';

type ThemeContextType = {
  theme: Theme;
  effective: 'light' | 'dark';
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'app_theme';

const resolveEffectiveTheme = (mode: Theme, systemScheme: ColorSchemeName): 'light' | 'dark' => {
  if (mode === 'auto') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('auto');
  const systemScheme = useColorScheme();

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'auto') {
          setTheme(stored);
        }
      } catch {
        // ignore storage errors
      }
    };

    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => undefined);
  }, [theme]);

  const effective = resolveEffectiveTheme(theme, systemScheme);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
    setTheme(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  };

  const value = useMemo<ThemeContextType>(
    () => ({ theme, effective, toggle }),
    [theme, effective]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeColor = () => {
  const { effective } = useTheme();
  return palette[effective];
};
