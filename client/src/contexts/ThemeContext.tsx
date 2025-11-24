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
  // Track current user role to detect role changes
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.role;
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    // Get role-specific theme color
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const roleThemeKey = `themeColor_${user.role}`;
        const savedColor = localStorage.getItem(roleThemeKey);
        if (savedColor) return savedColor as ThemeColor;
      }
    } catch (e) {
      // Ignore errors
    }

    // Fallback to default
    return 'blue';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Get user-specific theme mode by role
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);

        // Use role-based theme storage
        const roleThemeModeKey = `themeMode_${user.role}`;
        const savedRoleMode = localStorage.getItem(roleThemeModeKey);
        if (savedRoleMode) return savedRoleMode as ThemeMode;

        // Fallback to user-specific settings
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

    // Default to light mode (don't use system preference as it can be confusing)
    return 'light';
  });

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);

    // Save to role-specific localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const roleThemeKey = `themeColor_${user.role}`;
        localStorage.setItem(roleThemeKey, color);
      } else {
        // Fallback to global storage if no user
        localStorage.setItem('themeColor', color);
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

    // Save to role-specific localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const roleThemeModeKey = `themeMode_${user.role}`;
        localStorage.setItem(roleThemeModeKey, mode);
      } else {
        // Fallback to global storage if no user
        localStorage.setItem('themeMode', mode);
      }
    } catch (e) {
      // Fallback to global storage
      localStorage.setItem('themeMode', mode);
    }

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
    // Apply both color theme and dark/light mode on mount and when they change
    applyTheme(themeColor, themeMode);
  }, [themeColor, themeMode]);

  // Listen for user role changes and update theme accordingly
  useEffect(() => {
    const checkUserRoleChange = () => {
      try {
        const userStr = localStorage.getItem('user');
        const newRole = userStr ? JSON.parse(userStr).role : null;

        // Only reload theme if role actually changed (not just polling)
        if (newRole !== currentUserRole) {
          setCurrentUserRole(newRole);

          if (newRole) {
            // Load theme for the new role
            const roleThemeColorKey = `themeColor_${newRole}`;
            const roleThemeModeKey = `themeMode_${newRole}`;

            const savedColor = localStorage.getItem(roleThemeColorKey) as ThemeColor || 'blue';
            const savedMode = localStorage.getItem(roleThemeModeKey) as ThemeMode || 'light';

            setThemeColorState(savedColor);
            setThemeModeState(savedMode);
            applyTheme(savedColor, savedMode);
          } else {
            // User logged out, reset to light mode (default)
            setThemeColorState('blue');
            setThemeModeState('light');
            applyTheme('blue', 'light');
          }
        }
        // If role hasn't changed, don't reload theme (prevents overriding user changes)
      } catch (e) {
        console.error('Error checking user role change:', e);
      }
    };

    // Check on mount
    checkUserRoleChange();

    // Poll for role changes every 500ms
    // ONLY reloads theme when role actually changes (not on every poll)
    const interval = setInterval(checkUserRoleChange, 500);

    // Also listen for storage events (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        // Only check user changes, not theme changes (prevents circular updates)
        checkUserRoleChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUserRole]);

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
