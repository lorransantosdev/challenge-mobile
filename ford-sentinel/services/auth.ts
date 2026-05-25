// [SEC-21] IMPORTAÇÕES EXPLÍCITAS — SEM WILDCARD
import { sanitize, validateEmail, validatePassword, secureStorage, auditLog } from './security';
import type { Role } from '../utils/mockData';

// [SEC-22] CHAVES DE ARMAZENAMENTO SEGURO — PREFIXO ÚNICO DO APP
// Prefixo "fs." isola as chaves de outros apps no mesmo device.
const KEY_ACCESS  = 'fs.access_token';
const KEY_REFRESH = 'fs.refresh_token';
const KEY_USER    = 'fs.user';

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

// [SEC-23] RBAC — MAPA DE PERMISSÕES POR ROLE
// Princípio do menor privilégio: cada role tem apenas as permissões
// estritamente necessárias para sua função.
const PERMISSIONS: Record<Role, string[]> = {
  customer: ['view_vehicle', 'book_service', 'view_history'],
  analyst:  ['view_vehicle', 'book_service', 'view_history', 'view_fleet', 'export_data'],
  admin:    ['view_vehicle', 'book_service', 'view_history', 'view_fleet', 'export_data', 'manage_users', 'manage_dealers'],
};

// [SEC-24] CREDENCIAIS MOCK — APENAS PARA DEMONSTRAÇÃO
// Em produção, a validação ocorre exclusivamente no servidor via HTTPS.
// Credenciais NUNCA ficam hardcoded em produção — autenticação é sempre server-side.
// Este mock simula o fluxo para fins de demonstração do challenge.
const MOCK_CREDENTIALS = {
  email: 'joao@ford.com',
  password: 'sentinel123',
};

// [SEC-25] GERAÇÃO DE TOKEN MOCK — SIMULA JWT OPACO
// Em produção: token JWT RS256 assinado pelo servidor com expiração real.
// O token mock tem estrutura de prefixo + timestamp + random para ser único.
function mockToken(prefix: string): string {
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}.${ts}.${rnd}`;
}

// [SEC-26] FUNÇÃO DE LOGIN — MÚLTIPLAS CAMADAS DE PROTEÇÃO
export async function login(emailRaw: string, passwordRaw: string): Promise<AuthSession> {

  // [SEC-27] SANITIZAÇÃO ANTES DE QUALQUER VALIDAÇÃO
  // Dados brutos do usuário nunca tocam lógica de negócio sem sanitização.
  const email    = sanitize(emailRaw).toLowerCase();
  const password = sanitize(passwordRaw);

  // [SEC-28] VALIDAÇÃO DE FORMATO — REJEITA ANTES DE CONSULTAR BACKEND
  // Evita requisições desnecessárias com dados malformados.
  if (!validateEmail(email) || !validatePassword(password)) {
    auditLog.log({
      action: 'login_attempt',
      result: 'failure',
      meta:   { reason: 'invalid_format' },
    });
    // [SEC-29] MENSAGEM GENÉRICA — IMPEDE USER ENUMERATION
    // Não diferencia "e-mail inválido" de "senha inválida".
    throw new Error('Credenciais inválidas');
  }

  // [SEC-30] COMPARAÇÃO DE CREDENCIAIS — MESMA MENSAGEM PARA TODOS OS ERROS
  // Seja usuário inexistente ou senha errada, a resposta é idêntica.
  // Isso impede que atacantes descubram quais e-mails estão cadastrados.
  if (email !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) {
    auditLog.log({ action: 'login_attempt', result: 'failure' });
    throw new Error('Credenciais inválidas');
  }

  // [SEC-31] TOKEN DE ACESSO COM EXPIRAÇÃO CURTA — 15 MINUTOS
  // Tokens de curta duração limitam o dano em caso de vazamento.
  // Em produção: JWT RS256 emitido pelo servidor, verificado a cada requisição.
  const session: AuthSession = {
    accessToken:  mockToken('access'),
    refreshToken: mockToken('refresh'),
    expiresAt:    Date.now() + 15 * 60 * 1000, // 15 min
    user: {
      id:    'u_001',
      email,
      name:  'João Silva',
      role:  'customer',
    },
  };

  // [SEC-32] PERSISTÊNCIA SEGURA — SecureStore (Keychain/Keystore)
  // Tokens armazenados em hardware-backed secure storage, não em AsyncStorage.
  await secureStorage.set(KEY_ACCESS,  session.accessToken);
  await secureStorage.set(KEY_REFRESH, session.refreshToken);
  // [SEC-33] DADOS DO USUÁRIO SEM SENHA — APENAS ID, NOME E ROLE
  await secureStorage.set(KEY_USER, JSON.stringify(session.user));

  auditLog.log({ userId: session.user.id, action: 'login_attempt', result: 'success' });
  return session;
}

// [SEC-34] LOGOUT — REMOÇÃO COMPLETA DE TODOS OS TOKENS
// Não apenas "esquece" o token — deleta fisicamente do SecureStore.
export async function logout(): Promise<void> {
  await secureStorage.delete(KEY_ACCESS);
  await secureStorage.delete(KEY_REFRESH);
  await secureStorage.delete(KEY_USER);
  auditLog.log({ action: 'logout', result: 'success' });
}

// [SEC-35] GETTER DE TOKEN — LEITURA SEGURA SEM EXPOSIÇÃO
export async function getToken(): Promise<string | null> {
  return secureStorage.get(KEY_ACCESS);
}

// [SEC-36] REFRESH DE TOKEN — RENOVAÇÃO SEM REAUTENTICAÇÃO
// Troca o access token expirado usando o refresh token de longa duração.
// Se o refresh token não existir, forçа logout completo.
export async function refreshToken(): Promise<string | null> {
  const refresh = await secureStorage.get(KEY_REFRESH);
  if (!refresh) {
    auditLog.log({
      action: 'token_refresh',
      result: 'failure',
      meta:   { reason: 'no_refresh_token' },
    });
    return null;
  }
  const newAccess = mockToken('access');
  await secureStorage.set(KEY_ACCESS, newAccess);
  auditLog.log({ action: 'token_refresh', result: 'success' });
  return newAccess;
}

// [SEC-37] LEITURA DO USUÁRIO AUTENTICADO — COM TRATAMENTO DE PARSE SEGURO
// Se o JSON estiver corrompido, retorna null sem lançar exceção não tratada.
export async function getCurrentUser(): Promise<AuthSession['user'] | null> {
  const raw = await secureStorage.get(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // [SEC-38] PARSE SEGURO — DADO CORROMPIDO NÃO QUEBRA O APP
    return null;
  }
}

// [SEC-39] VERIFICAÇÃO DE PERMISSÃO — RBAC CLIENT-SIDE
// Verificação adicional no cliente (defense in depth).
// A verificação definitiva ocorre sempre no servidor.
export function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
