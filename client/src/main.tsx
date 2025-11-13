import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from '@/app/router';
import '@/styles/globals.css';

// Initialize theme on app load
const initializeTheme = () => {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    try {
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
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
  }
};

// Apply theme before rendering
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true
      }}
    />
    <Toaster position="top-center" />
  </React.StrictMode>
); 