import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeColors = {
  blue: {
    name: 'Blue',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    gradient: 'from-blue-500 to-blue-600',
  },
  purple: {
    name: 'Purple',
    primary: '#9333EA',
    primaryDark: '#7E22CE',
    primaryLight: '#A855F7',
    gradient: 'from-purple-500 to-purple-600',
  },
  green: {
    name: 'Green',
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    gradient: 'from-green-500 to-green-600',
  },
  orange: {
    name: 'Orange',
    primary: '#F97316',
    primaryDark: '#EA580C',
    primaryLight: '#FB923C',
    gradient: 'from-orange-500 to-orange-600',
  },
  red: {
    name: 'Red',
    primary: '#EF4444',
    primaryDark: '#DC2626',
    primaryLight: '#F87171',
    gradient: 'from-red-500 to-red-600',
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    // Get user-specific theme color
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userThemeKey = `themeColor_${user.id}`;
        const savedColor = localStorage.getItem(userThemeKey);
        if (savedColor) return savedColor as ThemeColor;
      }
    } catch (e) {
      // Ignore errors
    }

    // Fallback to global or default
    const saved = localStorage.getItem('themeColor');
    return (saved as ThemeColor) || 'blue';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Check user-specific settings first
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userSettingsKey = `appSettings_${user.id}`;
        const savedSettings = localStorage.getItem(userSettingsKey);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.theme === 'dark') return 'dark';
          if (settings.theme === 'light') return 'light';
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Fallback to standalone themeMode
    const saved = localStorage.getItem('themeMode');
    if (saved) return saved as ThemeMode;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);

    // Save to user-specific localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userThemeKey = `themeColor_${user.id}`;
        localStorage.setItem(userThemeKey, color);
      }
    } catch (e) {
      // Fallback to global storage
      localStorage.setItem('themeColor', color);
    }

    // Only update color CSS variables, don't touch dark/light mode
    const root = document.documentElement;
    const theme = themeColors[color];

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '59, 130, 246';
    };

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
    applyTheme(themeColor, mode);
  };

  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const applyTheme = (color: ThemeColor, mode: ThemeMode) => {
    const root = document.documentElement;
    const theme = themeColors[color];

    // Convert hex to RGB for opacity support
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '59, 130, 246'; // fallback to blue
    };

    // Apply color theme
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));

    // Apply dark/light mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Only apply color theme on mount, don't touch dark/light mode
    // Let AppLayout handle dark/light mode to avoid conflicts
    const root = document.documentElement;
    const theme = themeColors[themeColor];

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '59, 130, 246';
    };

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));
  }, [themeColor]);

  // Listen for user changes (login/logout) via storage events only
  useEffect(() => {
    const checkUserChange = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userThemeKey = `themeColor_${user.id}`;
          const savedColor = localStorage.getItem(userThemeKey);
          const expectedColor = savedColor as ThemeColor || 'blue';

          // If the theme color doesn't match what it should be for this user, update it
          if (themeColor !== expectedColor) {
            setThemeColorState(expectedColor);
          }
        } else {
          // User logged out, reset to default
          if (themeColor !== 'blue') {
            setThemeColorState('blue');
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Check only once on mount
    checkUserChange();

    // Listen for storage events (for cross-tab sync and login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key?.startsWith('themeColor_')) {
        checkUserChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [themeColor]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        themeMode,
        setThemeColor,
        setThemeMode,
        toggleThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
