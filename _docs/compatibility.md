# Tabla de Compatibilidad de Dependencias

> **Regla:** antes de actualizar cualquier dependencia, consultar esta tabla.
> Antes de agregar una nueva dependencia, verificar si tira de algún paquete
> con restricción listada aquí.
>
> Actualizar esta tabla cada vez que se resuelva un conflicto de versiones.

---

## Contexto base (no cambiar sin revisar toda la tabla)

| Pieza            | Versión fija | Por qué no tocar                                      |
| ---------------- | ------------ | ----------------------------------------------------- |
| Expo SDK         | `54.0.33`    | Ancla de todo el árbol de deps nativas                |
| Expo Go (device) | `54.0.7`     | Los binarios nativos bundleados corresponden a SDK 54 |
| React Native     | `0.81.5`     | Dictado por Expo SDK 54                               |
| React            | `19.1.0`     | Dictado por Expo SDK 54                               |
| Node             | `≥ 20`       | Requerido por ESM nativo en `api/`                    |
| pnpm             | `≥ 9`        | Workspaces + `save-exact`                             |

---

## Paquetes nativos — versiones forzadas por Expo Go SDK 54

Expo Go incluye binarios nativos compilados. Si el JS de un paquete no coincide
con el binario bundleado en Expo Go, la app crashea silenciosamente o lanza
`Cannot find native module 'XYZ'`.

Fuente de verdad: `node_modules/expo/bundledNativeModules.json`

| Paquete                          | Versión en uso    | Rango SDK 54 | Override en `package.json`                  | Problema si se usa otra versión                                         |
| -------------------------------- | ----------------- | ------------ | ------------------------------------------- | ----------------------------------------------------------------------- |
| `expo-crypto`                    | `15.0.8`          | `~15.0.8`    | ✅ `"expo-crypto": "15.0.8"`                | v55 introduce `ExpoCryptoAES` native module ausente en Expo Go → crash  |
| `expo-secure-store`              | `15.0.8`          | `~15.0.8`    | ❌ (directo en `mobile/package.json`)       | v13 JS + binario nativo v15 → crash silencioso por firmas incompatibles |
| `@shopify/react-native-skia`     | `2.2.12`          | `2.2.12`     | ✅ `"@shopify/react-native-skia": "2.2.12"` | v2.6 tiene native modules ausentes en Expo Go SDK 54                    |
| `react-native-svg`               | `15.12.1`         | `15.12.1`    | ✅ `"react-native-svg": "15.12.1"`          | v15.15 causa warnings y posibles incompatibilidades                     |
| `expo-auth-session`              | `7.x` (via Clerk) | `~7.0.10`    | ❌ (transitiva de clerk)                    | v55 tira `expo-crypto@~55` → `ExpoCryptoAES`                            |
| `expo-notifications`             | `0.32.16`         | `~0.32.16`   | ❌ (directo)                                | —                                                                       |
| `expo-localization`              | `17.0.8`          | `~17.0.8`    | ❌ (directo)                                | —                                                                       |
| `expo-status-bar`                | `3.0.9`           | `~3.0.9`     | ❌ (directo)                                | —                                                                       |
| `react-native-gesture-handler`   | `~2.28.0`         | `~2.28.0`    | ❌ (directo)                                | —                                                                       |
| `react-native-reanimated`        | `~4.1.7`          | `~4.1.1`     | ❌ (directo, minor compatible)              | —                                                                       |
| `react-native-safe-area-context` | `~5.6.2`          | `~5.6.0`     | ❌ (directo, minor compatible)              | —                                                                       |
| `react-native-screens`           | `~4.16.0`         | `~4.16.0`    | ❌ (directo)                                | —                                                                       |

---

## Árbol de dependencias conflictivas conocidas

```
@clerk/clerk-expo@2.19.31
  └── expo-auth-session          → pnpm resuelve v55 si no hay override
        └── expo-crypto@~55      → contiene ExpoCryptoAES (ausente en Expo Go 54)
              └── ❌ CRASH: Cannot find native module 'ExpoCryptoAES'

Fix: pnpm.overrides { "expo-crypto": "15.0.8" }
     expo-auth-session@55 solo usa getRandomValues/digestStringAsync (sin AES)
     → downgrade transparente para PKCE de Clerk
```

---

## Web (react-native-web)

| Paquete               | Versión requerida | Notas                                                                                             |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `react-native-web`    | `0.21.0`          | Soporte web en Expo                                                                               |
| `react-dom`           | `19.1.0`          | **Debe coincidir exactamente con `react`** — versión distinta lanza `Incompatible React versions` |
| `@expo/metro-runtime` | `6.1.2`           | SDK 54 espera `~6.1.2`; v55 causa `Unable to resolve NativeEventEmitter` en web bundling          |

---

## Seguridad — pines por CVE

| Paquete          | Versión pinada | Motivo                                                   |
| ---------------- | -------------- | -------------------------------------------------------- |
| `@clerk/express` | `2.0.7`        | CVE en versiones anteriores; no actualizar sin auditoría |

---

## Configuración de `app.json` para Expo Go

```json
{
  "newArchEnabled": false,
  "android": {
    "edgeToEdgeEnabled": false
  }
}
```

`newArchEnabled: true` y `edgeToEdgeEnabled: true` causan crash nativo silencioso
en Expo Go sobre algunos dispositivos Samsung (SM-A256E confirmado).
Reactivar solo en builds EAS (`preview`/`production`), no en desarrollo con Expo Go.

---

## Gráficas — victory-native v41

API completamente distinta a v4. Usar siempre la v41:

```tsx
// ✅ v41
import { CartesianChart, Bar } from "victory-native";

// ❌ v4 (no importar)
import { VictoryChart, VictoryBar } from "victory-native";
```

---

## Procedimiento para actualizar una dependencia

1. Consultar `node_modules/expo/bundledNativeModules.json` — si el paquete está listado, no superar ese rango
2. Ejecutar `pnpm --filter mobile why <paquete>` — trazar el árbol de dependencias
3. Si hay override en `package.json` raíz, verificar que el nuevo rango sea compatible
4. `pnpm install` → `(cd mobile && npx tsc --noEmit)` → probar en Expo Go
5. Actualizar esta tabla

---

## Cómo verificar versiones bundleadas de SDK 54

```bash
# Ver todas las versiones que Expo Go SDK 54 espera
cat node_modules/expo/bundledNativeModules.json | python3 -m json.tool

# Comparar instalado vs esperado
pnpm --filter mobile why <paquete>
```
