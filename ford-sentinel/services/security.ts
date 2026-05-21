import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const webStore = {
  setItemAsync: async (k: string, v: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(k, v);
  },
  getItemAsync: async (k: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(k);
  },
  deleteItemAsync: async (k: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(k);
  },
};

const Store = Platform.OS === 'web' ? webStore : SecureStore;

const MAX_INPUT = 500;
const MAX_EMAIL = 254;

export function sanitize(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/['";\\`]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim()
    .slice(0, MAX_INPUT);
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}

export function validatePassword(pwd: string): boolean {
  return typeof pwd === 'string' && pwd.length >= 6 && pwd.length <= 128;
}

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await Store.setItemAsync(key, value);
    } else {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
  },
  async get(key: string): Promise<string | null> {
    return Store.getItemAsync(key);
  },
  async delete(key: string): Promise<void> {
    await Store.deleteItemAsync(key);
  },
};

export interface AuditEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure';
  meta?: Record<string, string | number | boolean>;
}

class AuditLogger {
  private entries: AuditEntry[] = [];
  log(entry: Omit<AuditEntry, 'timestamp'>): void {
    const safe: AuditEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries.push(safe);
    if (this.entries.length > 200) this.entries.shift();
    if (__DEV__) {
      console.log('[AUDIT]', JSON.stringify(safe));
    }
  }
  history(): AuditEntry[] {
    return [...this.entries];
  }
}

export const auditLog = new AuditLogger();

export function safeError(_e: unknown): string {
  return 'Ocorreu um erro. Tente novamente.';
}
