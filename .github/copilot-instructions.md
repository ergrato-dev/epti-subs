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
- Auth: `@clerk/express@2.0.7` (pinado — tiene CVE en versiones anteriores)
- ESM nativo (`"type": "module"`)

### Schema DB (PostgreSQL)

```
subscriptions: id, clerkUserId, name, logoUrl, cost, currency(COP),
               billingCycle(enum), nextPaymentDate, categoryId,
               paymentLast4, planName, color, active, createdAt, updatedAt
categories: id, name, icon
```

### Convenciones API

- Rutas bajo `/api/`: `/api/subscriptions`, `/api/insights/monthly`
- Middleware `clerkAuth` en todas las rutas protegidas
- Filtrar SIEMPRE por `clerkUserId` del token — nunca confiar en params del body para identificar al usuario
- Respuestas: `{ data: T }` en éxito, `{ error: string }` en fallo

---

## Mobile (`mobile/`)

### Stack crítico

- Expo SDK 54 + React Native 0.81 + New Architecture **deshabilitada** para Expo Go
- Expo Router 6 — estructura de carpetas como rutas
- Clerk para auth, tokens en `expo-secure-store@15`
- i18next + react-i18next, idioma ES por defecto

### Versiones con override (pnpm.overrides en raíz)

Estas versiones están pinadas porque Expo Go SDK 54 incluye sus binarios nativos:

- `expo-crypto@15.0.8` — v55 introduce `ExpoCryptoAES` ausente en Expo Go
- `@shopify/react-native-skia@2.2.12` — v2.6 tiene módulos nativos incompatibles
- `react-native-svg@15.12.1`

### Estructura de rutas

```
app/
├── _layout.tsx          ClerkProvider + TokenSync + AppBootstrap
├── (auth)/              sin auth guard: onboarding, sign-in, sign-up
└── (app)/
    ├── _layout.tsx      auth guard (redirect si !isSignedIn)
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
- Solo identificar por `userId` opaco de Clerk — sin PII
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
| Tokens en AsyncStorage                   | Tokens en expo-secure-store                 |
| PostHog con PII                          | PostHog solo con `userId` de Clerk          |
| Rangos `^`/`~` en deps de producción     | Versiones exactas `1.2.3`                   |
