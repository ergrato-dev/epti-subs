---
mode: agent
description: Crea una nueva ruta de API (handler + schema) siguiendo las convenciones del proyecto
---

Crea una nueva ruta en `api/src/routes/` para el recurso **${input:recurso}**.

Requisitos:

- Archivo: `api/src/routes/${input:recurso}.ts`
- Express 5 Router con async handlers (sin try/catch — Express 5 los captura)
- Middleware `clerkAuth` en todas las rutas
- Filtrar por `req.auth.userId` — nunca por body params para identificar al usuario
- Respuestas: `res.json({ data: T })` en éxito, `res.status(N).json({ error: string })` en fallo
- Drizzle ORM para todas las queries (importar `db` desde `../db/index.ts`)
- Registrar el router en `api/src/index.ts`

Verbos mínimos: GET (lista), GET /:id, POST, PUT /:id, DELETE /:id

Al terminar: ejecuta `(cd api && npx tsc --noEmit)` para validar tipos.
