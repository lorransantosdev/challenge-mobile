# Segurança — Ford Sentinel

Este documento descreve os controles de segurança implementados no aplicativo Ford Sentinel e na API associada.

## 1. Validação e sanitização de inputs

**Onde:** `services/security.ts` (`sanitize`, `validateEmail`, `validatePassword`).

Todo input do usuário é sanitizado antes de qualquer uso (rede, armazenamento, renderização):
- Remoção de tags HTML
- Remoção de protocolos perigosos (`javascript:`, `data:`, `vbscript:`)
- Remoção de handlers inline (`onclick=`, etc.)
- Remoção de caracteres comuns em SQL injection (`'`, `"`, `;`, `\`, `` ` ``, `--`, `/*`, `*/`)
- Trim e limite de 500 chars (254 para e-mail, 128 para senha)
- Validação de e-mail via regex estrita

**Mitiga:** SQL Injection, XSS, command injection, header injection.

## 2. Autenticação

- **JWT (RS256)** com access token de **15 minutos** e refresh token de **7 dias**
- Refresh tokens são opacos no servidor, podem ser revogados
- **Biometria local** (`expo-local-authentication`) — Face ID / Touch ID / fingerprint
- Mensagens de erro **genéricas** — nunca expor stack trace, estrutura interna, ou diferenciar "usuário não existe" de "senha errada"

## 3. RBAC (Role-Based Access Control)

Três papéis, com permissões verificadas em cada endpoint:

| Role     | Permissões                                                                          |
|----------|-------------------------------------------------------------------------------------|
| customer | `view_vehicle`, `book_service`, `view_history`                                      |
| analyst  | + `view_fleet`, `export_data`                                                       |
| admin    | + `manage_users`, `manage_dealers`                                                  |

Verificação dupla: no API Gateway e em cada serviço (defense in depth).

## 4. Armazenamento seguro

- Tokens JWT são gravados em **`expo-secure-store`** (Keychain no iOS, Keystore no Android)
- **NUNCA** usar `AsyncStorage` ou `localStorage` para dados sensíveis
- Acesso configurado como `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — não sincroniza para iCloud / outros devices

## 5. Transporte

- **HTTPS/TLS 1.3** obrigatório em todas as chamadas de API
- HSTS habilitado no Gateway
- Certificate pinning planejado para v1.1 (mobile)

## 6. Rate limiting

- 100 requisições/minuto/usuário no Gateway
- 5 tentativas de login/15min/IP — após isso, captcha + bloqueio temporário
- Backoff exponencial em retries no cliente

## 7. Tratamento de erros

- Erros internos **nunca** são expostos ao cliente (`safeError()` retorna mensagem genérica)
- Stack traces, queries SQL, e dados sensíveis ficam apenas em logs internos
- O cliente sempre recebe códigos HTTP padronizados e o envelope `{ success: false, error: { code, message } }`

## 8. Audit logging

`auditLog.log()` registra eventos sensíveis com estrutura padronizada:

```json
{
  "timestamp": "2026-05-20T14:30:00Z",
  "userId": "u_001",
  "action": "login_attempt",
  "resource": "/auth/login",
  "result": "success"
}
```

**Importante:** logs **NÃO contêm PII** — sem nomes, e-mails completos, senhas, ou tokens. Apenas IDs e ações.

## 9. Dependências e supply chain

- `npm audit` rodando em CI
- Versões fixadas no `package.json`
- Dependabot habilitado para PRs de segurança

## 10. Outros controles

- Inputs limitados em tamanho no cliente (`maxLength` em TextInputs)
- Senhas com mínimo de 6 caracteres (recomendação: 12+)
- Sem `console.log` de dados sensíveis em produção (`__DEV__` guard)
- Linter eslint-plugin-security ativo em CI

## Checklist OWASP Mobile Top 10

| Risco                        | Mitigação                                         |
|------------------------------|---------------------------------------------------|
| M1 — Improper Credential Use | SecureStore + JWT curto + refresh                 |
| M2 — Inadequate Supply Chain | npm audit, versões fixadas, dependabot            |
| M3 — Insecure Auth/Auth      | JWT RS256 + RBAC dual-check                       |
| M4 — Insufficient Validation | `sanitize()` em todo input                        |
| M5 — Insecure Communication  | HTTPS/TLS 1.3 obrigatório                         |
| M6 — Inadequate Privacy      | Logs sem PII, scopes mínimos                      |
| M7 — Insufficient Crypto     | Tokens em Keychain/Keystore                       |
| M8 — Security Misconfig.     | Headers seguros, CSP no web companion             |
| M9 — Insecure Data Storage   | SecureStore, sem AsyncStorage para tokens         |
| M10 — Insufficient Crypto    | Algoritmos modernos (RS256, AES-256-GCM)          |
