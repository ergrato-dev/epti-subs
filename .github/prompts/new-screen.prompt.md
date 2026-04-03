---
mode: agent
description: Crea una nueva pantalla en la app móvil con navegación, i18n y tracking de PostHog
---

Crea la pantalla **${input:nombre}** en `mobile/app/${input:ruta}`.

Requisitos:

- Componente funcional TypeScript con `StyleSheet`
- Colors y tipografía desde `constants/Theme.ts` y `constants/Colors.ts`
- Textos vía `useTranslation()` de react-i18next (agregar keys en `locales/es.json` y `locales/en.json`)
- Llamadas a la API vía `useApiClient()` (hook tipado de `lib/useApiClient.ts`)
- `trackScreenView('${input:nombre}')` desde `lib/posthog.ts` en el `useEffect` de mount
- `SafeAreaView` como contenedor raíz
- Si lista datos: usar `FlatList` con estado loading/empty/error

Al terminar:

1. Agrega la ruta en `app/(app)/_layout.tsx` si es necesario
2. Ejecuta `(cd mobile && npx tsc --noEmit)` para validar tipos
