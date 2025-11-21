import axios, { AxiosInstance } from 'axios';

let client: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
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
      }

      return Promise.reject(error);
    }
  );

  return client;
}