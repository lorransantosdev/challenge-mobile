import { sanitize, validateEmail, validatePassword, secureStorage, auditLog } from './security';
import type { Role } from '../utils/mockData';

const KEY_ACCESS = 'fs.access_token';
const KEY_REFRESH = 'fs.refresh_token';
const KEY_USER = 'fs.user';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

const PERMISSIONS: Record<Role, string[]> = {
  customer: ['view_vehicle', 'book_service', 'view_history'],
  analyst: ['view_vehicle', 'book_service', 'view_history', 'view_fleet', 'export_data'],
  admin: ['view_vehicle', 'book_service', 'view_history', 'view_fleet', 'export_data', 'manage_users', 'manage_dealers'],
};

const MOCK_CREDENTIALS = {
  email: 'joao@ford.com',
  password: 'sentinel123',
};

function mockToken(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}.${ts}.${rnd}`;
}

export async function login(emailRaw: string, passwordRaw: string): Promise<AuthSession> {
  const email = sanitize(emailRaw).toLowerCase();
  const password = sanitize(passwordRaw);

  if (!validateEmail(email) || !validatePassword(password)) {
    auditLog.log({ action: 'login_attempt', result: 'failure', meta: { reason: 'invalid_format' } });
    throw new Error('Credenciais inválidas');
  }

  if (email !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) {
    auditLog.log({ action: 'login_attempt', result: 'failure' });
    throw new Error('Credenciais inválidas');
  }

  const session: AuthSession = {
    accessToken: mockToken('access'),
    refreshToken: mockToken('refresh'),
    expiresAt: Date.now() + 15 * 60 * 1000,
    user: {
      id: 'u_001',
      email,
      name: 'João Silva',
      role: 'customer',
    },
  };

  await secureStorage.set(KEY_ACCESS, session.accessToken);
  await secureStorage.set(KEY_REFRESH, session.refreshToken);
  await secureStorage.set(KEY_USER, JSON.stringify(session.user));

  auditLog.log({ userId: session.user.id, action: 'login_attempt', result: 'success' });
  return session;
}

export async function logout(): Promise<void> {
  await secureStorage.delete(KEY_ACCESS);
  await secureStorage.delete(KEY_REFRESH);
  await secureStorage.delete(KEY_USER);
  auditLog.log({ action: 'logout', result: 'success' });
}

export async function getToken(): Promise<string | null> {
  return secureStorage.get(KEY_ACCESS);
}

export async function refreshToken(): Promise<string | null> {
  const refresh = await secureStorage.get(KEY_REFRESH);
  if (!refresh) {
    auditLog.log({ action: 'token_refresh', result: 'failure', meta: { reason: 'no_refresh_token' } });
    return null;
  }
  const newAccess = mockToken('access');
  await secureStorage.set(KEY_ACCESS, newAccess);
  auditLog.log({ action: 'token_refresh', result: 'success' });
  return newAccess;
}

export async function getCurrentUser(): Promise<AuthSession['user'] | null> {
  const raw = await secureStorage.get(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
