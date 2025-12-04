import axios, { AxiosInstance } from 'axios';
import { getApiBaseUrl } from '@/lib/apiConfig';

let client: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout for faster failure
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (resp) => resp,
    (error) => {
      // Log detailed error information for debugging
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        hasAuth: !!error.config?.headers?.Authorization,
      });

      // Handle rate limiting and non-JSON error responses
      if (error.response) {
        const contentType = error.response.headers['content-type'];

        // If response is not JSON (e.g., rate limit text response)
        if (contentType && !contentType.includes('application/json')) {
          // Try to parse the text response
          const textError = error.response.data;
          error.response.data = {
            error: 'Rate Limit',
            message: typeof textError === 'string' ? textError : 'Too many requests. Please try again later.'
          };
        }

        // Log specific 500 errors with more context
        if (error.response.status === 500) {
          console.error('Server Error (500):', {
            endpoint: error.config?.url,
            errorMessage: error.response.data?.message || error.response.data?.error,
            fullResponse: error.response.data,
          });
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}