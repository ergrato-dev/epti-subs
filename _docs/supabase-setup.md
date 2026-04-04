# Guía de configuración — Supabase

Pasos para conectar epti-subs a un proyecto Supabase real.
El proyecto usa Supabase Auth (JWT) + PostgreSQL gestionado.

---

## 1. Crear el proyecto en Supabase

1. Ir a [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Elegir organización, nombre (ej. `epti-subs`), contraseña de BD y región
3. Esperar ~2 minutos a que el proyecto quede activo

---

## 2. Obtener las claves

**Dashboard → Settings → API**

| Variable                        | Dónde está                | Para qué                            |
| ------------------------------- | ------------------------- | ----------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Project URL               | Cliente Supabase en mobile          |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public`           | Cliente Supabase en mobile          |
| `SUPABASE_JWT_SECRET`           | JWT Settings → JWT Secret | Verificación local de tokens en API |

> ⚠️ Nunca usar la `service_role` key en el cliente mobile — solo la `anon` key.

---

## 3. Configurar variables de entorno

**`api/.env`**

```env
PORT=3000
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=<JWT Secret del paso 2>
CORS_ORIGIN=http://localhost:8081,http://192.168.x.x:8081
```

**`mobile/.env`**

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key del paso 2>
```

> La `DATABASE_URL` completa está en **Settings → Database → Connection string → URI** (modo `Transaction` o `Session`).

---

## 4. Aplicar las migraciones de esquema

Las migraciones están en `api/drizzle/migrations/`. Hay dos opciones:

### Opción A — Drizzle migrate (recomendado)

```bash
pnpm --filter api db:migrate
```

Esto aplica `0000_open_tigra.sql` (schema inicial) y `0001_absurd_landau.sql` (rename `clerk_user_id` → `user_id`) en el orden del journal.

### Opción B — SQL Editor de Supabase

Si es una BD nueva (sin datos), ejecutar el contenido de las migraciones directamente:

1. **Dashboard → SQL Editor → New query**
2. Pegar y ejecutar `api/drizzle/migrations/0000_open_tigra.sql`
3. Pegar y ejecutar `api/drizzle/migrations/0001_absurd_landau.sql`

---

## 5. Configurar Row Level Security (RLS)

Supabase activa RLS por defecto en tablas nuevas. Hay que agregar políticas para que los usuarios solo accedan a sus propios datos.

**Dashboard → Table Editor → subscriptions → RLS → Add policy**, o ejecutar en SQL Editor:

```sql
-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven/modifican sus propias suscripciones
CREATE POLICY "select_own" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "insert_own" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "update_own" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "delete_own" ON subscriptions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Las categorías son de solo lectura para todos los usuarios autenticados
CREATE POLICY "read_categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');
```

> **Nota:** La API de Express verifica el JWT localmente y filtra por `userId` en las queries de Drizzle. RLS es una segunda capa de defensa en caso de bug en la capa de aplicación.

---

## 6. Configurar Auth en Supabase

**Dashboard → Authentication → Settings**

| Opción              | Valor recomendado                                 |
| ------------------- | ------------------------------------------------- |
| Site URL            | `http://localhost:8081` (dev) / URL de producción |
| Confirm email       | Habilitar (activa el flow de OTP en sign-up)      |
| Secure email change | Habilitar                                         |
| JWT expiry          | `3600` (1 hora, default)                          |

> El flow de sign-up usa `supabase.auth.verifyOtp({ type: 'signup' })`, lo que requiere que **Confirm email** esté habilitado.

---

## 7. Verificar la conexión

### API

```bash
pnpm --filter api dev
```

Debe arrancar sin errores. Verificar:

```bash
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer <token_de_supabase>"
```

Respuesta esperada sin token: `{"error":"Unauthorized"}` (401).

### Mobile

```bash
(cd mobile && npx expo start --clear)
```

Abrir en Expo Go → pantalla de onboarding → registrar una cuenta → verificar el OTP recibido por email → debe redirigir al home.

---

## 8. Producción (VPS)

1. Actualizar `docker-compose.prod.yml` con las variables de Supabase en producción:
   - `DATABASE_URL` apuntando al pooler de Supabase (`Transaction mode`, puerto `6543`)
   - `SUPABASE_JWT_SECRET` del proyecto de producción
2. Push a `main` → CI/CD construye la imagen → deploy en `subs-api.ergrato.dev`

> Usar el pooler (`Transaction mode`) en producción para limitar conexiones simultáneas. Para migraciones usar `Session mode` (puerto `5432`).
