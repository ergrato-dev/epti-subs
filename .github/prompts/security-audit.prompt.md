---
mode: agent
description: Auditoría de seguridad del código que toca criptografía, tokens o almacenamiento
---

Realiza una auditoría de seguridad del archivo o componente **${input:archivo}**.

Checklist obligatorio:

- [ ] Tokens JWT: almacenados solo en `expo-secure-store`, nunca en `AsyncStorage`
- [ ] Identificación de usuario: siempre desde `req.auth.userId` (API) o `useAuth().userId` (mobile)
- [ ] Logging: ningún token, hash o dato sensible se imprime en consola
- [ ] PII en PostHog: solo `userId` opaco — sin email, nombre, teléfono
- [ ] Dependencias crypto: verificar que no haya native modules ausentes en Expo Go (`ExpoCryptoAES`, etc.)
- [ ] OWASP Top 10: injection, broken auth, exposure, etc.

Al terminar agrega o actualiza el bloque de comentario de auditoría en el archivo:

```typescript
// ── [NombreComponente] security audit ─────────────────────────────────────
// [x] Verificación 1
// [x] Verificación 2
// ──────────────────────────────────────────────────────────────────────────
```
