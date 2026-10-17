import axios, { AxiosInstance } from 'axios';
import { Config } from '@/constants/config';

export const apiClient: AxiosInstance = axios.create({
  baseURL: Config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Interceptor placeholder for future auth tokens (e.g. from SecureStore)
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Structured error handling placeholder
    return Promise.reject(error);
  }
);

export default apiClient;
