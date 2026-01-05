import axios from 'axios';
import { getApiBaseUrl } from './apiConfig';

// Check if we're making cross-origin requests
const isCrossOrigin = (): boolean => {
  if (typeof window === 'undefined') return false;

  const apiUrl = getApiBaseUrl();
  const apiOrigin = new URL(apiUrl).origin;
  const currentOrigin = window.location.origin;

  return apiOrigin !== currentOrigin;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: !isCrossOrigin(), // Only use credentials for same-origin requests
});

// Function to get CSRF token from cookies (only for same-origin)
function getCSRFToken(): string | null {
  if (isCrossOrigin()) return null; // Skip CSRF for cross-origin

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Function to fetch CSRF token from server (only for same-origin)
async function fetchCSRFToken(): Promise<string | null> {
  if (isCrossOrigin()) return null; // Skip CSRF for cross-origin

  try {
    const response = await axios.get(`${getApiBaseUrl()}/auth/csrf-token`, {
      withCredentials: true
    });
    return response.data.csrfToken || null;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests (except login which is exempt)
  // Only for same-origin requests
  if (!isCrossOrigin() &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '') &&
      !config.url?.includes('/auth/login')) {
    let csrfToken = getCSRFToken();

    // If no token in cookies, try to fetch one
    if (!csrfToken) {
      csrfToken = await fetchCSRFToken();
    }

    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

export default api;
