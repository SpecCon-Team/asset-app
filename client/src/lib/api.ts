import axios from 'axios';
import { getApiBaseUrl } from './apiConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Function to get CSRF token from cookies
function getCSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Function to fetch CSRF token from server
async function fetchCSRFToken(): Promise<string | null> {
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
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '') && 
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
