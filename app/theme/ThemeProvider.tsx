import React, { createContext, useContext, useEffect, useState } from 'react';
import { colors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

const ThemeContext = createContext({
  theme: 'light' as ThemeType,
  setTheme: (_t: ThemeType) => {},
  themeColors: colors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [themeColors, setThemeColors] = useState(colors);

  useEffect(() => {
    AsyncStorage.getItem('appearance_settings').then((settings) => {
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.theme === 'dark') {
          setTheme('dark');
          setThemeColors(colors);
        } else {
          setTheme('light');
          setThemeColors(colors);
        }
      }
    });
  }, []);

  useEffect(() => {
    setThemeColors(colors);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
