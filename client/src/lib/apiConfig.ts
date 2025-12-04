/**
 * Centralized API configuration.
 * Determines the API base URL based on the environment.
 */
export const getApiBaseUrl = (): string => {
  // For development, Vite exposes `import.meta.env.DEV`.
  // Default to localhost, but allow override via .env file for flexibility.
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  }

  // For production builds, use the environment variable.
  // This is typically set in .env.production or by the hosting provider.
  const prodUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (prodUrl) {
    return prodUrl.endsWith('/api') ? prodUrl : `${prodUrl}/api`;
  }
  
  // Auto-detect GitHub Pages and fallback to a known production URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io') || hostname.includes('speccon-team.github.io')) {
      return 'https://assettrack-api.onrender.com/api';
    }
  }

  // A final, safe fallback for production environments.
  return 'https://assettrack-api.onrender.com/api';
};

/**
 * Gets the root API URL without the /api suffix.
 * This is derived from `getApiBaseUrl` to ensure consistency.
 */
export const getApiUrl = (): string => {
  return getApiBaseUrl().replace(/\/api$/, '');
};

/**
 * Checks if the application is running in a production build.
 * Vite exposes `import.meta.env.PROD`.
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};


