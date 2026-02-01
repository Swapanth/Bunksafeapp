import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Borders
  border: string;
  borderLight: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Chat specific
  chatBubbleReceived: string;
  chatBubbleSent: string;
  chatBubbleText: string;
  chatInputBackground: string;
  
  // UI Elements
  iconColor: string;
  iconColorSecondary: string;
  placeholder: string;
  shadow: string;
  
  // Status indicators
  online: string;
  offline: string;
  away: string;
  studying: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const lightTheme: ThemeColors = {
  // Backgrounds
  background: '#f9fafb', // gray-50
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text
  text: '#111827', // gray-900
  textSecondary: '#6b7280', // gray-500
  textTertiary: '#9ca3af', // gray-400
  
  // Borders
  border: '#e5e7eb', // gray-200
  borderLight: '#f3f4f6', // gray-100
  
  // Primary colors
  primary: '#10b981', // green-600
  primaryLight: '#d1fae5', // green-100
  primaryDark: '#059669', // green-700
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Chat specific
  chatBubbleReceived: '#ffffff',
  chatBubbleSent: '#10b981',
  chatBubbleText: '#111827',
  chatInputBackground: '#f9fafb',
  
  // UI Elements
  iconColor: '#1f2937', // gray-800
  iconColorSecondary: '#6b7280', // gray-500
  placeholder: '#9ca3af',
  shadow: '#000000',
  
  // Status indicators
  online: '#10b981',
  offline: '#6b7280',
  away: '#6b7280',
  studying: '#f59e0b',
};

const darkTheme: ThemeColors = {
  // Backgrounds
  background: '#0f172a', // slate-900
  surface: '#1e293b', // slate-800
  card: '#1e293b',
  
  // Text
  text: '#f1f5f9', // slate-100
  textSecondary: '#cbd5e1', // slate-300
  textTertiary: '#94a3b8', // slate-400
  
  // Borders
  border: '#334155', // slate-700
  borderLight: '#475569', // slate-600
  
  // Primary colors
  primary: '#10b981', // green-600 (keep vibrant)
  primaryLight: '#065f46', // green-800 (darker for dark mode)
  primaryDark: '#059669', // green-700
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Chat specific
  chatBubbleReceived: '#334155', // slate-700
  chatBubbleSent: '#10b981',
  chatBubbleText: '#f1f5f9',
  chatInputBackground: '#1e293b',
  
  // UI Elements
  iconColor: '#f1f5f9', // slate-100
  iconColorSecondary: '#94a3b8', // slate-400
  placeholder: '#64748b', // slate-500
  shadow: '#000000',
  
  // Status indicators
  online: '#10b981',
  offline: '#64748b',
  away: '#64748b',
  studying: '#f59e0b',
};

const THEME_STORAGE_KEY = '@app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setMode(savedTheme);
        console.log('🎨 Loaded theme from storage:', savedTheme);
      }
    } catch (error) {
      console.error('❌ Error loading theme:', error);
    }
  };

  const saveTheme = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      console.log('💾 Saved theme to storage:', newMode);
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    saveTheme(newMode);
    console.log('🎨 Theme toggled to:', newMode);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    saveTheme(newMode);
    console.log('🎨 Theme set to:', newMode);
  };

  const theme: Theme = {
    mode,
    colors: mode === 'light' ? lightTheme : darkTheme,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: mode === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
