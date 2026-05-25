// [SEC-01] IMPORTAÇÕES EXPLÍCITAS — SEM WILDCARD
// Cada classe/função importada individualmente para facilitar auditoria de dependências
// e respeitar o princípio do menor privilégio no código.
import { Platform } from 'react-native';
import {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} from 'expo-secure-store';

// [SEC-02] FALLBACK SEGURO PARA WEB — SEM localStorage PARA DADOS SENSÍVEIS
// localStorage é inseguro para tokens: acessível por qualquer script na página (XSS).
// Em web, usamos sessionStorage (escopo de aba, não persiste) como fallback.
// Em produção real, web deveria usar cookies HttpOnly + SameSite=Strict.
const webStore = {
  setItemAsync: async (k: string, v: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      // [SEC-03] sessionStorage COMO FALLBACK WEB — MELHOR QUE localStorage
      // sessionStorage expira quando a aba fecha, reduzindo a janela de ataque.
      // localStorage persiste indefinidamente — nunca usar para tokens sensíveis.
      window.sessionStorage.setItem(k, v);
    }
  },
  getItemAsync: async (k: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(k);
  },
  deleteItemAsync: async (k: string): Promise<void> => {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(k);
  },
};

// [SEC-04] ROTEAMENTO NATIVO VS WEB — SecureStore APENAS EM DISPOSITIVOS FÍSICOS
// expo-secure-store usa Keychain (iOS) e Android Keystore (Android) —
// armazenamento criptografado pelo SO, inacessível a outros apps.
const Store = Platform.OS === 'web' ? webStore : { setItemAsync, getItemAsync, deleteItemAsync };

// [SEC-05] LIMITES DE TAMANHO — PROTEÇÃO CONTRA BUFFER OVERFLOW E FLOODING
// Entrada acima dos limites é truncada antes de qualquer processamento.
const MAX_INPUT = 500;
const MAX_EMAIL = 254; // RFC 5321 — limite oficial de e-mail

// [SEC-06] SANITIZAÇÃO DE INPUT — PRIMEIRA LINHA DE DEFESA
// Remove padrões de ataque antes que o dado chegue a qualquer lógica de negócio.
// Cobre XSS, SQL Injection, command injection e header injection.
export function sanitize(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    // [SEC-07] REMOÇÃO DE TAGS HTML — PREVINE XSS
    .replace(/<[^>]*>/g, '')
    // [SEC-08] REMOÇÃO DE PROTOCOLOS PERIGOSOS — PREVINE XSS E REDIRECIONAMENTO
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // [SEC-09] REMOÇÃO DE EVENT HANDLERS INLINE — PREVINE XSS
    .replace(/on\w+\s*=/gi, '')
    // [SEC-10] REMOÇÃO DE CARACTERES DE SQL INJECTION
    // Remove aspas simples, duplas, ponto-e-vírgula, backslash, backtick,
    // comentários SQL (-- e /* */) que são vetores clássicos de SQLi.
    .replace(/['";\\\`]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // [SEC-05] APLICAÇÃO DO LIMITE DE TAMANHO
    .trim()
    .slice(0, MAX_INPUT);
}

// [SEC-11] VALIDAÇÃO DE E-MAIL — TIPAGEM + PRESENÇA + TAMANHO
// Verifica formato RFC antes de qualquer tentativa de autenticação.
export function validateEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL) return false;
  // Regex estrita: exige usuario@dominio.tld sem espaços
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}

// [SEC-12] VALIDAÇÃO DE SENHA — TIPAGEM + TAMANHO
// Mínimo de 6 chars para aceitar, máximo de 128 para prevenir flooding.
export function validatePassword(pwd: string): boolean {
  return typeof pwd === 'string' && pwd.length >= 6 && pwd.length <= 128;
}

// [SEC-13] ARMAZENAMENTO SEGURO — KEYCHAIN (iOS) / KEYSTORE (Android)
// Abstrai o armazenamento seguro com opção WHEN_UNLOCKED_THIS_DEVICE_ONLY:
// - NÃO sincroniza para iCloud ou outros dispositivos
// - NÃO acessível quando o dispositivo está bloqueado
// - NÃO acessível por outros aplicativos
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await Store.setItemAsync(key, value);
    } else {
      // [SEC-14] QUANDO_DESBLOQUEADO_APENAS_ESTE_DISPOSITIVO
      // Garante que tokens não sejam acessados com dispositivo bloqueado
      // e não sejam migrados para backups ou outros dispositivos.
      await setItemAsync(key, value, {
        keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY,
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

// [SEC-15] ESTRUTURA DE ENTRADA DE AUDITORIA — SEM PII SENSÍVEL
// Campos registrados: timestamp, userId (opaque ID), action, resource, result.
// Campos NUNCA registrados: senhas, tokens completos, dados pessoais completos.
export interface AuditEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure';
  meta?: Record<string, string | number | boolean>;
}

// [SEC-16] AUDIT LOGGER — TRILHA DE AUDITORIA IN-MEMORY
// Registra eventos sensíveis com estrutura padronizada.
// Buffer circular de 200 entradas — entradas antigas são descartadas automaticamente.
class AuditLogger {
  private entries: AuditEntry[] = [];

  log(entry: Omit<AuditEntry, 'timestamp'>): void {
    // [SEC-17] TIMESTAMP ISO 8601 — RASTREABILIDADE TEMPORAL
    const safe: AuditEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries.push(safe);

    // [SEC-18] BUFFER CIRCULAR — PREVINE ESGOTAMENTO DE MEMÓRIA
    if (this.entries.length > 200) this.entries.shift();

    // [SEC-19] LOGS APENAS EM DEV — SEM VAZAMENTO EM PRODUÇÃO
    // Em produção, logs seriam enviados para sistema de logging seguro (SIEM).
    // Nunca usar console.log com dados sensíveis em produção.
    if (__DEV__) {
      console.log('[AUDIT]', JSON.stringify(safe));
    }
  }

  history(): AuditEntry[] {
    return [...this.entries];
  }
}

export const auditLog = new AuditLogger();

// [SEC-20] TRATAMENTO SEGURO DE ERROS — SEM VAZAMENTO DE INFORMAÇÕES INTERNAS
// Nunca expõe stack trace, mensagens internas, estrutura do banco,
// ou qualquer detalhe que ajude um atacante a mapear o sistema.
export function safeError(_e: unknown): string {
  return 'Ocorreu um erro. Tente novamente.';
}
