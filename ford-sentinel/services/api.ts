// [SEC-40] IMPORTAÇÕES EXPLÍCITAS — SEM WILDCARD
import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, refreshToken, logout } from './auth';
import { auditLog, safeError } from './security';

// [SEC-41] BASE URL HTTPS OBRIGATÓRIO — SEM HTTP PERMITIDO
// Toda comunicação com o servidor ocorre via HTTPS/TLS.
// Em produção: Certificate Pinning seria adicionado aqui.
const BASE_URL = 'https://api.fordsentinel.com/v1';

// [SEC-42] TIMEOUT DE REQUISIÇÃO — PROTEÇÃO CONTRA SLOW LORIS / HANGING REQUESTS
// 15 segundos é o máximo permitido. Requisições que demoram mais são abortadas
// para evitar que recursos do app fiquem bloqueados indefinidamente.
const TIMEOUT = 15_000;

// [SEC-43] INSTÂNCIA AXIOS COM HEADERS DE SEGURANÇA PADRÃO
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// [SEC-44] INTERCEPTOR DE REQUISIÇÃO — INJEÇÃO AUTOMÁTICA DO BEARER TOKEN
// O token é lido do SecureStore a cada requisição, garantindo que tokens
// revogados não sejam usados após um logout.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    // [SEC-45] BEARER TOKEN NO HEADER Authorization — PADRÃO OAuth2
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// [SEC-46] INTERCEPTOR DE RESPOSTA — TRATAMENTO SEGURO DE ERROS E REFRESH AUTOMÁTICO
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status   = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // [SEC-47] REFRESH AUTOMÁTICO DE TOKEN — UMA TENTATIVA APENAS
    // Se o servidor retorna 401 (token expirado), tenta renovar o access token
    // usando o refresh token. A flag _retry evita loop infinito de refreshes.
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken  = await refreshToken();
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
      // [SEC-48] LOGOUT FORÇADO — REFRESH FALHOU
      // Se não há refresh token válido, o usuário é desconectado
      // e todos os tokens são apagados do SecureStore.
      await logout();
    }

    // [SEC-49] LOG DE ERRO DE API — SEM DADOS SENSÍVEIS
    // Registra apenas status HTTP e URL — nunca headers, tokens ou body.
    auditLog.log({
      action:   'api_error',
      resource: original?.url ?? 'unknown',
      result:   'failure',
      meta:     { status: status ?? 0 },
    });

    // [SEC-50] MENSAGEM DE ERRO SEGURA — safeError() PARA O CLIENTE
    // O erro real fica no log interno. O cliente recebe apenas mensagem genérica.
    return Promise.reject(new Error(safeError(error)));
  }
);
