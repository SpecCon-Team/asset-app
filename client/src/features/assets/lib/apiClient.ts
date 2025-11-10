import axios, { AxiosInstance } from 'axios';

let client: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    withCredentials: true,
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
      // Optional: global error mapping/logging
      return Promise.reject(error);
    }
  );

  return client;
}


