# Copilot Instructions — epti-subs

## Contexto del proyecto

Monorepo de gestor personal de suscripciones:

- `api/` — Express 5 + Drizzle ORM + PostgreSQL (ESM, TypeScript)
- `mobile/` — Expo SDK 54 + React Native 0.81 + Expo Router 6 (TypeScript)

El usuario es instructor de desarrollo de software. Las respuestas deben ser directas y técnicas, sin paternalismos.

---

## Reglas absolutas

### Package manager

- **Siempre pnpm**, nunca npm ni yarn
- Comandos del monorepo: `pnpm --filter api <cmd>` o `(cd mobile && npx expo ...)`
- **Todas las versiones exactas** (`save-exact=true`): sin `^` ni `~` en dependencias de producción
- Para web: `(cd mobile && npx expo start --clear)` — SIEMPRE con subshell `()` para evitar que el CWD incorrecto rompa Metro

### Commits

Formato Conventional Commits con 3 líneas de cuerpo:

```
tipo(scope): qué se hizo

- qué: descripción técnica concisa
- para qué: motivación / problema que resuelve
- impacto: efectos observables (performance, seguridad, UX, etc.)
```

Tipos válidos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `security`, `ci`

### TypeScript

- Siempre verificar con `tsc --noEmit` antes de commitear
- Sin `any` implícito; usar tipos explícitos
- Los tipos compartidos entre api y mobile van en `mobile/types/`

---

## API (`api/`)

### Stack

- Express 5.2 (async errors nativos, sin `try/catch` explícito en handlers)
- Drizzle ORM 0.45 con esquema en `api/src/db/schema.ts`
- Auth: JWT local via `jsonwebtoken@9.0.3` — verifica tokens emitidos por Supabase Auth
- ESM nativo (`"type": "module"`)
- Tests: Vitest 4.1.2 + supertest, cobertura ≥85% (thresholds en `vitest.config.ts`)

### Variables de entorno API

```
DATABASE_URL=postgres://...
SUPABASE_JWT_SECRET=<JWT Secret desde Supabase Dashboard > Settings > API>
CORS_ORIGIN=http://localhost:8081,...
```

### Schema DB (PostgreSQL)

```
subscriptions: id, userId, name, logoUrl, cost, currency(COP),
               billingCycle(enum), nextPaymentDate, categoryId,
               paymentLast4, planName, color, active, createdAt, updatedAt
categories: id, name, icon
```

### Convenciones API

- Rutas bajo `/api/`: `/api/subscriptions`, `/api/insights/monthly`
- Middleware `supabaseAuth` en todas las rutas protegidas (`api/src/middleware/supabaseAuth.ts`)
- Filtrar SIEMPRE por `userId` extraído del JWT (`req.userId`) — nunca confiar en params del body
- Respuestas: `{ data: T }` en éxito, `{ error: string }` en fallo

---

## Mobile (`mobile/`)

### Stack crítico

- Expo SDK 54 + React Native 0.81 + New Architecture **deshabilitada** para Expo Go
- Expo Router 6 — estructura de carpetas como rutas
- **Auth: Supabase Auth** — `@supabase/supabase-js`, sesión en `AsyncStorage` via `supabase.auth`
- i18next + react-i18next, idioma ES por defecto
- Tests: jest@29 + jest-expo@55 + @testing-library/react-native, cobertura ≥85%

### Variables de entorno mobile

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key desde Supabase Dashboard > Settings > API>
```

### Auth flow (Supabase)

- `mobile/lib/supabase.ts` — cliente singleton con `AsyncStorage`
- `app/_layout.tsx` — `TokenSync` sincroniza `supabase.auth.getSession()` → `setAuthToken(axios)`
- `(auth)/_layout.tsx` — redirige a home si ya hay sesión
- `(app)/_layout.tsx` — auth guard: redirige a onboarding si no hay sesión
- Credenciales: `supabase.auth.signInWithPassword`, OTP via `supabase.auth.verifyOtp`

### Versiones con override (pnpm.overrides en raíz)

Estas versiones están pinadas porque Expo Go SDK 54 incluye sus binarios nativos:

- `expo-crypto@15.0.8` — v55 introduce `ExpoCryptoAES` ausente en Expo Go
- `@shopify/react-native-skia@2.2.12` — v2.6 tiene módulos nativos incompatibles
- `react-native-svg@15.12.1`

### Estructura de rutas

```
app/
├── _layout.tsx          TokenSync (Supabase session → axios token) + AppBootstrap
├── (auth)/              sin auth guard: onboarding, sign-in, sign-up
└── (app)/
    ├── _layout.tsx      auth guard (redirect si !session)
    ├── subscription-detail.tsx
    ├── subscription-form.tsx
    └── (tabs)/          home, subscriptions, insights, settings
```

### Gráficas — victory-native v41

**CRÍTICO:** v41 usa API nueva, completamente distinta de v4:

```tsx
// ✅ CORRECTO (v41)
import { CartesianChart, Bar } from "victory-native";
<CartesianChart data={data} xKey="index" yKeys={["value"]}>
  {({ points, chartBounds }) => (
    <Bar points={points.value} chartBounds={chartBounds} color="#06B6D4" />
  )}
</CartesianChart>;

// ❌ INCORRECTO (v4 — no usar)
import { VictoryChart, VictoryBar } from "victory-native";
```

### Seguridad — regla de auditoría

Cualquier código que toque criptografía, tokens o almacenamiento seguro **debe incluir** un bloque de comentario:

```typescript
// ── [Componente] security audit ───────────────────────────────────────────
// [x] Verificación 1
// [x] Verificación 2
// ──────────────────────────────────────────────────────────────────────────
```

### PostHog

- Singleton en `lib/posthog.ts`, disabled en `__DEV__`
- Solo identificar por `userId` opaco de Supabase Auth — sin PII
- Helpers tipados: `trackSubscriptionCreated`, `trackSubscriptionDeleted`, `trackScreenView`

### i18n

- Inicializar en `lib/i18n.ts` importado como primer import en `_layout.tsx`
- Namespace `translation`, keys en camelCase
- Archivos: `locales/es.json` (por defecto), `locales/en.json`

### Tipos compartidos (`mobile/types/subscription.ts`)

```typescript
InsightsMonthly.breakdown: { id, name, cost, currency, nextPaymentDate, color }
// ⚠️ Los campos son id/name, NO subscriptionId/subscriptionName
```

---

## Infraestructura

### Docker Compose

- `docker-compose.yml` — desarrollo local (PostgreSQL + API con hot reload)
- `docker-compose.prod.yml` — producción en VPS Hostinger

### CI/CD

- Push a `main` con cambios en `api/**` → GitHub Actions → imagen Docker → GHCR
- Imagen: `ghcr.io/ergrato-dev/epti-subs-api:latest`
- VPS: `subs-api.ergrato.dev`

---

## Anti-patterns conocidos

| ❌ No hacer                              | ✅ Hacer                                    |
| ---------------------------------------- | ------------------------------------------- |
| `npm install`                            | `pnpm add`                                  |
| `npx expo start` desde raíz del monorepo | `(cd mobile && npx expo start --clear)`     |
| `VictoryChart`/`VictoryBar`              | `CartesianChart`/`Bar` (victory-native v41) |
| `breakdown.subscriptionId`               | `breakdown.id`                              |
| `breakdown.subscriptionName`             | `breakdown.name`                            |
| Tokens en AsyncStorage                   | Tokens gestionados por `supabase.auth`      |
| PostHog con PII                          | PostHog solo con `userId` de Supabase       |
| Rangos `^`/`~` en deps de producción     | Versiones exactas `1.2.3`                   |
| `jest@30` con `jest-expo@55`             | `jest@29` (jest-expo@55 usa `@jest/*@^29`)  |
| `clerkUserId` en queries Drizzle         | `userId` (campo renombrado en migración)    |
