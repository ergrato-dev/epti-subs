# Guía de configuración — Supabase

> **Para qué sirve esta guía:** conectar epti-subs a un proyecto Supabase real.
> Si nunca usaste Supabase, empieza aquí.

## ¿Qué es Supabase y por qué lo usamos?

Supabase es un servicio en la nube que te da tres cosas en uno:

- **Base de datos PostgreSQL** — la misma BD que corres local con Docker, pero en la nube, sin que tengas que administrar un servidor
- **Auth** — registro, login y sesiones de usuarios (reemplaza a Clerk en este proyecto)
- **API automática** — expone tu BD via REST/GraphQL, aunque en este proyecto no la usamos directamente (usamos Express)

La arquitectura resultante es:

```
App mobile  →  Express API  →  PostgreSQL (Supabase)
    ↕ auth
Supabase Auth (emite JWTs)
```

El mobile se loguea con Supabase Auth y recibe un token JWT. Ese token se manda en cada request a la API de Express. La API verifica que el token sea válido **localmente** (sin llamar a Supabase en cada request) y extrae el ID del usuario para filtrar los datos.

---

## 1. Crear la cuenta y el proyecto

1. Ir a [https://supabase.com](https://supabase.com) → **Start your project** → crear cuenta (GitHub o email)
2. Una vez dentro del dashboard → **New project**
3. Completar:
   - **Organization:** la que se creó sola al registrarte (o crear una nueva)
   - **Name:** `epti-subs` (o el nombre que quieras — es solo para identificarlo)
   - **Database Password:** inventar una contraseña fuerte — **guardarla**, la vas a necesitar para `DATABASE_URL`
   - **Region:** el más cercano geográficamente (ej. `South America (São Paulo)`)
4. Clic en **Create new project** y esperar ~2 minutos

Cuando termine verás el dashboard del proyecto con métricas, tablas, etc.

---

## 2. Obtener las claves

Ir a **Settings** (ícono de engranaje en el sidebar izquierdo) → **API**

Ahí vas a ver varias claves. Las que necesitas son estas tres:

### Project URL
```
https://abcdefghijklmnop.supabase.co
```
→ va a `EXPO_PUBLIC_SUPABASE_URL` en `mobile/.env`

### anon / public key
Es la clave larga que empieza con `eyJ...` bajo el título **Project API keys → anon public**.
→ va a `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `mobile/.env`

> Esta clave es pública — es seguro incluirla en la app mobile. Lo que la hace segura no es que sea secreta, sino que Supabase la usa para identificar tu proyecto y aplicar las reglas de acceso (RLS).

### JWT Secret
Bajar en la misma página hasta **JWT Settings** → copiar el valor de **JWT Secret**.
→ va a `SUPABASE_JWT_SECRET` en `api/.env`

> Esta clave **sí es secreta** — solo vive en el servidor (Express), nunca en el mobile. La API la usa para verificar que los tokens de los usuarios son legítimos.

---

## 3. Configurar variables de entorno

Copiar los archivos de ejemplo y completar los valores del paso anterior:

```bash
cp api/.env.example api/.env
cp mobile/.env.example mobile/.env
```

**`api/.env`** — servidor Express

```env
PORT=3000

# Supabase → Settings → Database → Connection string → URI (Session mode, puerto 5432)
DATABASE_URL=postgresql://postgres:<tu-password>@db.<project-ref>.supabase.co:5432/postgres

# Supabase → Settings → API → JWT Settings → JWT Secret
SUPABASE_JWT_SECRET=<tu-jwt-secret>

CORS_ORIGIN=http://localhost:8081
```

**`mobile/.env`** — app Expo

```env
EXPO_PUBLIC_API_URL=http://localhost:3000

# Supabase → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

> La `DATABASE_URL` completa la encuentras en **Settings → Database → Connection string**, eligiendo el modo **Session** (puerto 5432). Para producción se usa **Transaction** (puerto 6543), pero para desarrollo y migraciones usar Session.

---

## 4. Crear las tablas (migraciones)

La BD de Supabase está vacía. Hay que crear las tablas que usa el proyecto.

### Opción A — Drizzle migrate (recomendado, desde terminal)

Con `api/.env` ya configurado:

```bash
pnpm --filter api db:migrate
```

Esto lee las migraciones de `api/drizzle/migrations/` y las aplica en orden:
- `0000_open_tigra.sql` — crea las tablas `subscriptions` y `categories`
- `0001_absurd_landau.sql` — renombra una columna interna (no visible para el usuario)

### Opción B — SQL Editor de Supabase (sin tocar la terminal)

1. En el dashboard → **SQL Editor** (ícono de consola en el sidebar)
2. Clic en **New query**
3. Abrir `api/drizzle/migrations/0000_open_tigra.sql`, copiar todo el contenido, pegarlo y clic en **Run**
4. Repetir con `api/drizzle/migrations/0001_absurd_landau.sql`

Para verificar que las tablas se crearon: ir a **Table Editor** en el sidebar — deberías ver `subscriptions` y `categories`.

---

## 5. Configurar Row Level Security (RLS)

**¿Qué es RLS?** Es un mecanismo de PostgreSQL que permite definir reglas a nivel de base de datos sobre qué filas puede leer o modificar cada usuario. Supabase lo activa por defecto en todas las tablas.

Sin políticas RLS, **nadie puede leer nada** (ni siquiera usuarios autenticados). Hay que decirle explícitamente qué está permitido.

Ir a **SQL Editor → New query** y ejecutar:

```sql
-- Habilitar RLS en ambas tablas
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo puede ver/crear/editar/borrar SUS suscripciones
-- auth.uid() es la función de Supabase que devuelve el ID del usuario logueado
CREATE POLICY "select_own" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "insert_own" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "update_own" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "delete_own" ON subscriptions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Las categorías las puede leer cualquier usuario autenticado (son globales)
CREATE POLICY "read_categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');
```

> En este proyecto la API de Express ya filtra por `userId` en cada query — RLS es una segunda capa de defensa. Si por algún bug en el código la API olvidara filtrar, la BD igual no devolvería datos de otros usuarios.

---

## 6. Configurar Auth

Ir a **Authentication** (ícono de usuario en el sidebar) → **Settings**:

| Campo | Valor | Por qué |
|---|---|---|
| **Site URL** | `http://localhost:8081` | Para que los emails de verificación redirijan al lugar correcto en desarrollo |
| **Confirm email** | ✅ Habilitado | El sign-up manda un código OTP al email — la app lo pide y lo verifica |
| **Secure email change** | ✅ Habilitado | Protección extra si el usuario cambia su email |
| **JWT expiry** | `3600` (default) | El token expira en 1 hora; se renueva automáticamente en background |

> **¿Qué es el OTP del sign-up?** Cuando el usuario se registra, Supabase manda un email con un código de 6 dígitos. La app de sign-up tiene una pantalla que pide ese código y llama a `supabase.auth.verifyOtp()` para confirmar la cuenta. Si **Confirm email** está deshabilitado, el usuario entra directo sin verificar — no recomendado en producción.

---

## 7. Probar que todo funciona

### Levantar la API

```bash
pnpm --filter api dev
```

Debe mostrar algo como `Server running on port 3000` sin errores.

Probar que el middleware de auth rechaza requests sin token:

```bash
curl http://localhost:3000/api/subscriptions
# Respuesta esperada: {"error":"Unauthorized"}  (status 401)
```

### Levantar la app mobile

```bash
(cd mobile && npx expo start --clear)
```

Abrir en Expo Go → tocar **Crear cuenta** → ingresar email y contraseña → revisar el email → ingresar el código de 6 dígitos → la app debe redirigir al home con la lista de suscripciones vacía.

---

## 8. Producción (VPS)

Una vez que el proyecto funciona en desarrollo, para subir a producción:

1. En Supabase, ir a **Settings → Database → Connection string** y copiar la URL en modo **Transaction** (puerto `6543`) — este modo es más eficiente cuando hay muchas conexiones simultáneas
2. Actualizar las variables de entorno en el VPS (o en el `docker-compose.prod.yml`):
   - `DATABASE_URL` con el string de Transaction pooler
   - `SUPABASE_JWT_SECRET` del proyecto de producción
3. Push a `main` → GitHub Actions construye la imagen Docker → deploy automático en `subs-api.ergrato.dev`

> Para correr migraciones en producción usar la URL de **Session mode** (puerto `5432`), no el pooler — el pooler no soporta las sentencias de DDL que usan las migraciones.

