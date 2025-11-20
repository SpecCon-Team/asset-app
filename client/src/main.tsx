import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from '@/app/router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';

// Initialize theme on app load using user-specific settings
const initializeTheme = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userSettingsKey = `appSettings_${user.id}`;
      const savedSettings = localStorage.getItem(userSettingsKey);

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const theme = settings.theme || 'light';

        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (theme === 'auto') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to load theme settings:', error);
  }
};

// Apply theme before rendering
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true
      }}
    />
    <Toaster
      position="top-center"
      toastOptions={{
        // Default styles for all toasts
        style: {
          background: 'var(--toast-bg, #fff)',
          color: 'var(--toast-text, #333)',
          border: '1px solid var(--toast-border, #e5e7eb)',
        },
        // Success toast
        success: {
          style: {
            background: 'var(--toast-success-bg, #f0fdf4)',
            color: 'var(--toast-success-text, #166534)',
            border: '1px solid var(--toast-success-border, #86efac)',
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: '#f0fdf4',
          },
        },
        // Error toast
        error: {
          style: {
            background: 'var(--toast-error-bg, #fef2f2)',
            color: 'var(--toast-error-text, #991b1b)',
            border: '1px solid var(--toast-error-border, #fca5a5)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
        // Loading toast
        loading: {
          style: {
            background: 'var(--toast-loading-bg, #eff6ff)',
            color: 'var(--toast-loading-text, #1e40af)',
            border: '1px solid var(--toast-loading-border, #93c5fd)',
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#eff6ff',
          },
        },
      }}
    />
  </ThemeProvider>
); 