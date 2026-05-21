# Ford Sentinel

App React Native (Expo) — sistema de inteligência preditiva veicular.
**FIAP × Ford Challenge 2026**

Duas telas: Login e Home. Tema dark, estética de painel automotivo premium com SVG blueprint do veículo, gauge de saúde animado e cards de manutenção preditiva.

---

## Setup

```bash
cd ford-sentinel
npm install
npx expo start
```

Pressione `i` para iOS, `a` para Android, ou abra no app **Expo Go**.

### Credenciais mock

| Campo | Valor              |
|-------|--------------------|
| Email | `joao@ford.com`    |
| Senha | `sentinel123`      |

Login biométrico (`finger-print`) também funciona em dispositivos com biometria habilitada.

---

## Estrutura

```
ford-sentinel/
├── app/
│   ├── _layout.tsx            Stack raiz, dark theme, safe area
│   ├── index.tsx              Redirect → /login
│   ├── login.tsx              Tela 1: Login + biometria
│   └── (app)/
│       ├── _layout.tsx        Layout da área autenticada
│       └── index.tsx          Tela 2: Home (todas as seções)
│
├── components/
│   ├── VehicleSVG.tsx         Blueprint SVG da pickup + pontos de status pulsantes
│   ├── HealthGauge.tsx        Gauge circular SVG com animação Reanimated
│   └── MaintenanceCard.tsx    Card de manutenção preditiva
│
├── services/
│   ├── security.ts            sanitize, validateEmail, secureStorage, auditLog
│   ├── auth.ts                login/logout/refresh + RBAC
│   └── api.ts                 Axios + interceptors (token, refresh on 401)
│
├── utils/
│   ├── theme.ts               Cores, spacing, radii
│   └── mockData.ts            User, Vehicle, Parts, Maintenances, Dealer
│
└── docs/
    ├── swagger.yaml           OpenAPI 3.0 — contrato completo da API
    ├── ARCHITECTURE.md        Arquitetura SOA (diagrama + serviços)
    └── SECURITY.md            Controles de segurança (OWASP Mobile)
```

---

## Tecnologias

- **Expo SDK 52** + **Expo Router 4** (file-based routing)
- **TypeScript** estrito
- **React Native Reanimated 3** — animações 60fps no JS thread
- **react-native-svg** — blueprint do veículo e gauge
- **expo-secure-store** — tokens JWT em Keychain/Keystore
- **expo-local-authentication** — biometria
- **expo-haptics** — feedback tátil
- **expo-linear-gradient** + **expo-blur** — efeitos visuais
- **Zustand** — state management (preparado para expansão)
- **Axios** — HTTP client com interceptors

---

## Decisões técnicas

### Por que Expo Router?
File-based routing simplifica navegação e isola a área autenticada via grupo `(app)`. Stack root cuida do tema dark e safe area.

### Por que SVG?
O blueprint do veículo precisa ser fluido em qualquer resolução e renderizar pontos coloridos sobre coordenadas precisas das peças. SVG + Reanimated entrega isso com performance.

### Por que SecureStore e não AsyncStorage?
Tokens são credenciais. AsyncStorage é texto plano. SecureStore usa Keychain (iOS) / Keystore (Android), encriptado pelo SO e isolado por device.

### Por que sanitização agressiva de inputs?
Defesa em profundidade. Mesmo com queries parametrizadas no backend, sanitizar no cliente reduz superfície de ataque (XSS, header injection, ataques contra logging mal feito).

### Por que arquitetura SOA?
Cada domínio (auth, vehicle, prediction, booking, notification) escala independente. ML do Prediction Service tem ciclo próprio. Telemetria de IoT escala diferente de booking. Ver `docs/ARCHITECTURE.md`.

---

## Segurança

Controles principais (detalhes em `docs/SECURITY.md`):

- ✅ Sanitização de todos os inputs (anti SQL injection / XSS)
- ✅ JWT (RS256) com access 15min + refresh 7 dias
- ✅ Tokens em SecureStore (Keychain/Keystore)
- ✅ RBAC com 3 roles (customer, analyst, admin)
- ✅ HTTPS/TLS 1.3 obrigatório
- ✅ Rate limiting no gateway
- ✅ Audit log estruturado sem PII
- ✅ Mensagens de erro genéricas (sem stack trace)
- ✅ Biometria local opcional
- ✅ Refresh automático de token via interceptor Axios

---

## API

Contrato completo: [`docs/swagger.yaml`](docs/swagger.yaml)

Endpoints principais:
- `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout`
- `GET /vehicles` · `GET /vehicles/{id}/parts` · `GET /vehicles/{id}/health`
- `GET /predictions/{vehicleId}` · `POST /predictions/{id}/dismiss`
- `GET /services/history` · `POST /services/book` · `GET /services/slots`
- `GET /dealers` · `GET /dealers/{id}`

---

## Time

FIAP × Ford Challenge 2026 — Edição Sentinel
