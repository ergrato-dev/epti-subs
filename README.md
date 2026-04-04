# epti-subs

Gestor personal de suscripciones. Monorepo con API REST y app móvil (Android).

> ⚠️ **Antes de tocar dependencias:** consultar [`_docs/compatibility.md`](_docs/compatibility.md)

## Roadmap

| Fase | Descripción                                                                  | Estado       |
| ---- | ---------------------------------------------------------------------------- | ------------ |
| 0    | Security audit — CVEs dependencias, `@clerk/express` pinado a `2.0.7`        | ✅ Completo  |
| 1    | API skeleton — Express 5, Drizzle ORM, rutas CRUD, Docker, GitHub Actions CI | ✅ Completo  |
| 2    | Expo mobile setup — Router, Clerk, i18n, tema, EAS, todas las dependencias   | ✅ Completo  |
| 3    | Auth screens — onboarding, sign-in, sign-up (2-step), auth guards            | ✅ Completo  |
| 4    | Core screens — home, subscriptions, insights, settings, detail, form         | ✅ Completo  |
| 5    | PostHog + notificaciones locales + preferencias de moneda persistentes       | ✅ Completo  |
| 6    | Integración end-to-end — app conectada a la API real en device/emulador      | ⬜ Pendiente |
| 7    | EAS build — APK preview firmado, pruebas en device sin Expo Go               | ⬜ Pendiente |
| 8    | Deploy producción — VPS Hostinger, dominio, HTTPS, variables de entorno prod | ⬜ Pendiente |

```
epti-subs/
├── api/        Express 5 + Drizzle ORM + PostgreSQL
└── mobile/     Expo SDK 54 + React Native 0.81 + Expo Router
```

## Stack

| Capa           | Tecnología                                                   |
| -------------- | ------------------------------------------------------------ |
| Auth           | Clerk (JWT en Android Keystore vía expo-secure-store)        |
| API            | Express 5.2, Drizzle ORM 0.45, PostgreSQL 16                 |
| Mobile         | Expo SDK 54, React Native 0.81, Expo Router 6                |
| Gráficas       | victory-native 41 (`CartesianChart`/`Bar`)                   |
| Analytics      | PostHog (deshabilitado en `__DEV__`)                         |
| Notificaciones | expo-notifications (triggers locales)                        |
| i18n           | i18next + react-i18next + expo-localization (ES por defecto) |
| Monorepo       | pnpm 10 workspaces                                           |
| CI/CD          | GitHub Actions → GHCR → Docker en Hostinger VPS              |
| Build          | EAS: `preview` (APK) / `production` (AAB)                    |

## Requisitos

- Node ≥ 20, pnpm ≥ 9
- Docker + Docker Compose (para la API local)
- Cuenta Clerk → `pk_test_...` y `sk_test_...`
- Expo Go 54.0.7 en el dispositivo Android

## Arranque rápido

```bash
# Instalar todo
pnpm install

# API (Docker)
cp api/.env.example api/.env   # ajusta las variables
docker compose up -d

# Mobile
(cd mobile && npx expo start --clear)
# → abre http://localhost:8081 en el browser
# → o escanea el QR con Expo Go (misma red WiFi)
```

> **Importante:** siempre arrancar Expo desde `mobile/`, no desde la raíz.
> Usar `(cd mobile && npx expo start --clear)` para forzar el directorio.

## Variables de entorno

### `api/.env`

```
DATABASE_URL=postgresql://user:pass@localhost:5432/eptisubs
CLERK_SECRET_KEY=sk_test_...
PORT=3000
```

### `mobile/.env`

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # IP local de la PC
# Para emulador Android usar: http://10.0.2.2:3000
```

## Comandos frecuentes

```bash
# Instalar dependencias
pnpm install

# API — desarrollo local
pnpm api:dev

# API — migraciones DB
pnpm api:generate   # genera SQL desde el schema
pnpm api:migrate    # aplica migraciones
pnpm api:studio     # Drizzle Studio en http://localhost:4983

# Mobile — bundler
(cd mobile && npx expo start --clear)

# Mobile — build APK para pruebas (EAS)
(cd mobile && pnpm build:preview)

# TypeScript — validación sin emitir
(cd mobile && npx tsc --noEmit)
(cd api && npx tsc --noEmit)
```

## Estructura detallada

```
api/src/
├── index.ts              Entry point Express 5
├── db/
│   ├── index.ts          Pool pg + instancia Drizzle
│   └── schema.ts         Tablas: subscriptions, categories
├── middleware/
│   └── clerkAuth.ts      Middleware JWT Clerk
└── routes/
    ├── subscriptions.ts  CRUD /api/subscriptions
    └── insights.ts       GET /api/insights/monthly

mobile/
├── app/
│   ├── _layout.tsx       Root layout: ClerkProvider, i18n, PostHog
│   ├── (auth)/           Onboarding, sign-in, sign-up
│   └── (app)/
│       ├── _layout.tsx   Auth guard
│       ├── subscription-detail.tsx
│       ├── subscription-form.tsx
│       └── (tabs)/       home, subscriptions, insights, settings
├── components/
│   └── SubscriptionCard.tsx
├── lib/
│   ├── apiClient.ts      Axios + interceptor de token Clerk
│   ├── i18n.ts           Configuración i18next
│   ├── notifications.ts  Permisos y scheduling
│   ├── posthog.ts        Singleton PostHog (disabled en __DEV__)
│   ├── useApiClient.ts   Hook para llamadas autenticadas
│   └── useUserPrefs.ts   Prefs persistentes (AsyncStorage)
├── locales/
│   ├── es.json           Español (por defecto)
│   └── en.json           Inglés
└── types/
    └── subscription.ts   Interfaces TypeScript compartidas
```

## Seguridad

- Tokens JWT almacenados en **Android Keystore** vía `expo-secure-store@15`
- `@clerk/express` pinado a `2.0.7` (CVE mitigado)
- `expo-crypto` pinado a `15.0.8` vía `pnpm.overrides` (evita `ExpoCryptoAES` ausente en Expo Go SDK 54)
- No se loguean tokens ni datos PII en ningún punto
- PostHog solo identifica por `userId` opaco de Clerk (sin email, sin nombre)

## Convenciones

- **Package manager:** pnpm siempre, nunca npm
- **Versiones:** `save-exact=true` — sin rangos `^` ni `~` en producción
- **Commits:** Conventional Commits con formato `tipo(scope): qué/para qué/impacto`
- **Gráficas:** victory-native v41 usa `CartesianChart`/`Bar` — NO `VictoryChart`/`VictoryBar` (eso es v4)
- **Expo Router:** siempre arrancar desde `mobile/`, nunca desde la raíz del monorepo

## CI/CD

`push` a `main` con cambios en `api/**` → GitHub Actions → build imagen Docker → push a GHCR → deploy en Hostinger VPS (`subs-api.ergrato.dev`).

```
main branch
  └── api/** cambios
        └── .github/workflows/api-docker.yml
              ├── docker build ./api (target: production)
              ├── push ghcr.io/ergrato-dev/epti-subs-api:latest
              └── push ghcr.io/ergrato-dev/epti-subs-api:{sha}
```

## Licencia

Privado — uso personal.
