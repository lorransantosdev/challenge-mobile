import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, refreshToken, logout } from './auth';
import { auditLog, safeError } from './security';

const BASE_URL = 'https://api.fordsentinel.com/v1';
const TIMEOUT = 15000;

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
      await logout();
    }

    auditLog.log({
      action: 'api_error',
      resource: original?.url ?? 'unknown',
      result: 'failure',
      meta: { status: status ?? 0 },
    });

    return Promise.reject(new Error(safeError(error)));
  }
);
