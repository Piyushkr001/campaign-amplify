import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '@/constants/config';

export const SECURE_TOKEN_KEY = 'campaign_amplify_access_token';

let cachedToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  cachedToken = token;
};

export const getCachedAuthToken = () => cachedToken;

export const setOnUnauthorizedCallback = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

export async function getPersistedToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    if (token) {
      cachedToken = token;
    }
    return token;
  } catch {
    return null;
  }
}

export async function persistToken(token: string): Promise<void> {
  try {
    cachedToken = token;
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to save access token in SecureStore:', err);
  }
}

export async function clearPersistedToken(): Promise<void> {
  try {
    cachedToken = null;
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to remove access token from SecureStore:', err);
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: Config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    let token = cachedToken;
    if (!token) {
      token = await getPersistedToken();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        await clearPersistedToken();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
