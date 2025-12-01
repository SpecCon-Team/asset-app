/**
 * Centralized API configuration
 * Use this to get the API base URL consistently across the application
 * 
 * Priority:
 * 1. VITE_API_BASE_URL (if set, should include /api)
 * 2. VITE_API_URL + '/api' (if VITE_API_URL is set)
 * 3. Auto-detect GitHub Pages and use production API
 * 4. http://localhost:4000/api (fallback for local development)
 */
export const getApiBaseUrl = (): string => {
  // Check if we're in production (has production API URL set)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (apiBaseUrl) {
    return apiBaseUrl;
  }
  
  // If VITE_API_URL is set, append /api if not already present
  if (apiUrl) {
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  
  // Auto-detect GitHub Pages deployment
  // If we're on github.io domain, use production API
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io') || hostname.includes('speccon-team.github.io')) {
      return 'https://assettrack-api.onrender.com/api';
    }
  }
  
  // Fallback to localhost for development
  return 'http://localhost:4000/api';
};

/**
 * Get the base API URL without /api suffix
 * Useful for direct file downloads or special endpoints
 */
export const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_URL is set, use it
  if (apiUrl) {
    return apiUrl;
  }
  
  // If VITE_API_BASE_URL is set, remove /api suffix if present
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/api$/, '');
  }
  
  // Auto-detect GitHub Pages deployment
  // If we're on github.io domain, use production API
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io') || hostname.includes('speccon-team.github.io')) {
      return 'https://assettrack-api.onrender.com';
    }
  }
  
  // Fallback to localhost for development
  return 'http://localhost:4000';
};

/**
 * Check if we're running in production
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD === true || 
         import.meta.env.MODE === 'production' ||
         (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost'));
};


