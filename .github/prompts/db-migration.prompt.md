---
mode: agent
description: Agrega una columna o tabla nueva al schema de Drizzle y genera la migración
---

Modifica el schema de Drizzle para agregar **${input:cambio}**.

Pasos:

1. Edita `api/src/db/schema.ts` con el cambio
2. Ejecuta `pnpm api:generate` para generar el archivo de migración SQL
3. Verifica que el SQL generado en `api/drizzle/` sea correcto
4. Actualiza los tipos en `mobile/types/subscription.ts` si el cambio afecta las respuestas de la API
5. Actualiza los handlers en `api/src/routes/` que usen la tabla modificada
6. Ejecuta `(cd api && npx tsc --noEmit)` y `(cd mobile && npx tsc --noEmit)`

⚠️ No ejecutar `pnpm api:migrate` automáticamente — el usuario lo aplica manualmente.
