# Arquitetura — Ford Sentinel

Arquitetura **SOA (Service-Oriented Architecture)** com separação em três camadas: Apresentação, Serviço e Dados. Comunicação por HTTPS/TLS, autenticação JWT, contrato OpenAPI.

## Visão geral

```
┌──────────────────────────────────────────────────────────────────────┐
│                       CAMADA DE APRESENTAÇÃO                         │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │   App Mobile (React Native / Expo)                           │   │
│   │   - SecureStore (tokens)                                     │   │
│   │   - Sanitização de inputs                                    │   │
│   │   - Biometria local                                          │   │
│   └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │ HTTPS / TLS 1.3
                                       │ JWT Bearer
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                 │
│                                                                      │
│  - Rate limiting (100 req/min/usuário)                               │
│  - CORS                                                              │
│  - Validação de tokens                                               │
│  - Logging estruturado                                               │
│  - WAF (Web Application Firewall)                                    │
└────┬───────────┬───────────┬───────────┬───────────┬─────────────────┘
     │           │           │           │           │
     ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│ Auth    │ │ Vehicle │ │Prediction│ │Booking  │ │ Notification │
│ Service │ │ Service │ │ Service  │ │Service  │ │ Service      │
│         │ │         │ │ (ML)     │ │         │ │              │
│ JWT +   │ │ CRUD +  │ │ TF Serv. │ │ Slots   │ │ FCM / APNS   │
│ OAuth2  │ │ IoT     │ │ + Cache  │ │ + Calend│ │ + Email      │
└────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └──────┬───────┘
     │           │            │            │             │
     │           │            │            │             │
     ▼           ▼            ▼            ▼             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE DADOS                             │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐            │
│  │ Postgres │  │ TimescaleDB │ Redis    │  │ S3 / Blob  │            │
│  │ (users,  │  │ (telemetria)│ (cache,  │  │ (logs,     │            │
│  │ veículos)│  │             │  filas)  │  │  modelos)  │            │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

## Serviços

### Auth Service
- Login / logout / refresh
- OAuth2 (Google, Apple)
- RBAC (customer, analyst, admin)
- JWT assinado com RS256, chaves rotacionadas a cada 90 dias

### Vehicle Service
- CRUD de veículos
- Ingestão de telemetria IoT (CAN bus, OBD-II)
- Cálculo de score de saúde agregado

### Prediction Service
- Modelos de ML (XGBoost / LSTM) para falhas preditivas
- Inferência online com cache Redis (TTL 1h)
- Pipeline de re-treino semanal

### Booking Service
- Agenda de concessionárias
- Slots disponíveis
- Confirmação por e-mail/push

### Notification Service
- Push (FCM/APNS)
- E-mail transacional
- Eventos críticos em tempo real (WebSocket)

## Princípios

1. **Separação de responsabilidades** — cada serviço é autônomo, com seu próprio banco quando aplicável.
2. **Stateless** — todos os serviços são stateless; sessão vive no JWT + Redis.
3. **Idempotência** — endpoints `POST` críticos aceitam header `Idempotency-Key`.
4. **Observabilidade** — logs estruturados (JSON), métricas Prometheus, tracing OpenTelemetry.
5. **Defense in depth** — TLS, JWT, rate limit, WAF, validação no gateway e nos serviços.

## Fluxos principais

### Login
```
App → Gateway → Auth Service → Postgres → JWT issued → App (armazena em SecureStore)
```

### Diagnóstico veicular
```
Veículo (IoT) → Vehicle Service → TimescaleDB
App → Gateway → Vehicle Service → cache Redis (hit) ou TimescaleDB
```

### Predição de manutenção
```
App → Gateway → Prediction Service → cache Redis (hit) ou modelo ML → resposta
                                  → log para retreino
```
