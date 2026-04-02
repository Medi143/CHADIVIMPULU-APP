import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  colors: {
    primary: '#FFD700',
    secondary: '#002366',
    background: '#FFFFFF',
    cardBackground: '#F9F9F9',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#DC3545',
    success: '#28A745',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
};

const darkTheme = {
  colors: {
    primary: '#FFD700',
    secondary: '#1A3A6B',
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#F5F5F5',
    textSecondary: '#AAAAAA',
    border: '#333333',
    error: '#FF6B6B',
    success: '#4CAF50',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
};

type ThemeType = typeof lightTheme;

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved === 'dark') setIsDark(true);
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
  };

  const setThemeMode = async (mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
    await AsyncStorage.setItem('app_theme', mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: isDark ? darkTheme : lightTheme,
        isDark,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export { lightTheme, darkTheme };
