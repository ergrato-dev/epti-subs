# Documento de Requisitos Funcionales (RF)

## epti-subs — Gestor Personal de Suscripciones

| Campo | Valor |
|---|---|
| **Proyecto** | epti-subs |
| **Versión** | 1.0 |
| **Fecha** | 2026-06-06 |
| **Autor** | Equipo epti-subs |
| **Clasificación** | Privado — uso personal |

---

## Historial de revisiones

| Versión | Fecha | Autor | Cambios |
|---|---|---|---|
| 1.0 | 2026-06-06 | Equipo | Redacción inicial basada en código implementado (fases 0–5 completas) |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos funcionales del sistema **epti-subs**, un gestor personal de suscripciones compuesto por una API REST y una aplicación móvil Android. El sistema permite a un usuario registrar, consultar, actualizar y dar de baja suscripciones a servicios, visualizar métricas de gasto mensual y recibir notificaciones de próximos pagos.

### 1.2 Alcance

El sistema abarca:

- **API REST** (Express 5 + Drizzle ORM + PostgreSQL 17) con endpoints CRUD para suscripciones e insights.
- **Aplicación móvil** (Expo SDK 54, React Native 0.81, Expo Router 6) para Android.
- **Autenticación** vía Supabase Auth con JWT, registro en 2 pasos (email + OTP).
- **Notificaciones locales** programables por el usuario.
- **Analítica de producto** vía PostHog (deshabilitada en desarrollo).
- **Internacionalización** español/inglés con detección de locale del dispositivo.
- **CI/CD** con GitHub Actions, GHCR y despliegue en VPS.

### 1.3 Definiciones y acrónimos

| Término | Definición |
|---|---|
| **Suscripción** | Registro que representa un servicio recurrente con costo, ciclo de facturación y fecha de próximo pago |
| **Ciclo de facturación** | Periodicidad del cobro: diario, semanal, mensual, trimestral, anual |
| **Soft delete** | Borrado lógico: la suscripción se marca como inactiva (`active = false`) sin eliminar el registro |
| **Insight** | Métrica agregada de gastos para un mes/año determinado |
| **OTP** | One-Time Password — código de 6 dígitos enviado por correo para verificar la cuenta |
| **BFF** | Backend For Frontend — la API actúa como único punto de acceso para la app móvil |

### 1.4 Prioridades

| Nivel | Significado |
|---|---|
| **P0** | Crítico / MVP — el sistema no funciona sin este requisito |
| **P1** | Importante — valor central del producto |
| **P2** | Deseable — mejora la experiencia pero no bloquea |
| **P3** | Accesorio — nice-to-have futuro |

---

## 2. Requisitos Funcionales

### Módulo A: Autenticación y Gestión de Sesión

---

#### RF-A01 — Onboarding inicial

| Campo | Valor |
|---|---|
| **ID** | RF-A01 |
| **Nombre** | Pantalla de onboarding con llamada a la acción |
| **Prioridad** | P1 |
| **Descripción** | Al abrir la app por primera vez (usuario no autenticado), se muestra una pantalla de bienvenida con una ilustración geométrica animada, el nombre de la app, un eslogan y un botón "Comenzar" que redirige al inicio de sesión. |
| **Criterios de aceptación** | 1. La pantalla muestra una composición de formas geométricas decorativas (círculos, semicírculos, cuadrado). 2. El título y subtítulo se obtienen de i18n (español por defecto). 3. El texto y el botón aparecen con animación de fade-in + slide-up (700ms). 4. Al presionar "Comenzar", se navega a `/(auth)/sign-in`. 5. Si ya hay sesión activa, se redirige directamente a `/(app)/(tabs)/home`. |
| **Dependencias** | Ninguna |
| **Notas** | Usa `Animated.timing` con `useNativeDriver: true`. |

---

#### RF-A02 — Inicio de sesión

| Campo | Valor |
|---|---|
| **ID** | RF-A02 |
| **Nombre** | Inicio de sesión con email y contraseña |
| **Prioridad** | P0 |
| **Descripción** | El usuario ingresa su email y contraseña. Al autenticarse exitosamente contra Supabase Auth, la sesión se sincroniza (token JWT en memoria) y se redirige a la pantalla principal de la app. |
| **Criterios de aceptación** | 1. Formulario con campos: email (`keyboardType="email-address"`, sin autocapitalize) y contraseña (`secureTextEntry`). 2. Validación: ambos campos requeridos. 3. Botón "Iniciar sesión" deshabilitado durante la petición, muestra spinner. 4. Error de Supabase se muestra en un `Alert`. 5. Éxito → `router.replace("/(app)/(tabs)/home")`. 6. Enlace "Crear cuenta" navega a `/(auth)/sign-up`. 7. Teclado se ajusta vía `KeyboardAvoidingView` (padding en iOS, height en Android). |
| **Dependencias** | RF-A01 (ruta), Supabase Auth configurado |
| **Notas** | La sesión es gestionada por `supabase.auth.onAuthStateChange` en `_layout.tsx`. El token JWT se inyecta en el header `Authorization` de axios. |

---

#### RF-A03 — Registro de cuenta en 2 pasos

| Campo | Valor |
|---|---|
| **ID** | RF-A03 |
| **Nombre** | Registro con verificación de email vía OTP |
| **Prioridad** | P0 |
| **Descripción** | **Paso 1:** El usuario ingresa nombre, email y contraseña. Supabase Auth crea la cuenta y envía un código OTP de 6 dígitos al correo. **Paso 2:** El usuario ingresa el código recibido. Al verificarlo, se crea la sesión y se redirige al home. |
| **Criterios de aceptación** | 1. Paso 1 — formulario con: nombre (`autoCapitalize="words"`), email, contraseña. 2. Al enviar, se llama a `supabase.auth.signUp()` con `data: { first_name }`. 3. Si no hay error, se transiciona al paso 2 (`setStep("verify")`). 4. Paso 2 — input para código de 6 dígitos (`keyboardType="number-pad"`, `maxLength={6}`, centrado con `letterSpacing: 8`). 5. Se llama a `supabase.auth.verifyOtp()` con `type: "signup"`. 6. Éxito → redirección a home. Error → `Alert`. 7. Enlace "Iniciar sesión" para cuentas existentes. |
| **Dependencias** | RF-A02, Supabase Auth con email OTP habilitado |
| **Notas** | `emailRedirectTo: undefined` fuerza el flujo OTP en lugar de magic link. |

---

#### RF-A04 — Cierre de sesión

| Campo | Valor |
|---|---|
| **ID** | RF-A04 |
| **Nombre** | Cierre de sesión con limpieza de estado |
| **Prioridad** | P1 |
| **Descripción** | Desde la pantalla de configuración, el usuario puede cerrar sesión. Se muestra una confirmación. Al confirmar, se cancelan todas las notificaciones programadas, se invalida la sesión en Supabase y se redirige al onboarding. |
| **Criterios de aceptación** | 1. El botón "Cerrar sesión" se encuentra en la pantalla Settings al final del scroll. 2. Al presionarlo, se muestra `Alert` con opciones "Cancelar" y "Cerrar sesión" (destructiva). 3. Al confirmar: se ejecuta `cancelAllReminders()`, `signOut()` de Clerk/Supabase, y `router.replace("/(auth)/onboarding")`. 4. La sesión se limpia del almacenamiento seguro. |
| **Dependencias** | RF-A02, RF-A03, RF-E01 (settings) |
| **Notas** | El `onAuthStateChange` en `_layout.tsx` detecta el cambio de sesión y redirige automáticamente al grupo `(auth)`. |

---

#### RF-A05 — Guard de autenticación

| Campo | Valor |
|---|---|
| **ID** | RF-A05 |
| **Nombre** | Protección de rutas autenticadas |
| **Prioridad** | P0 |
| **Descripción** | Las pantallas del grupo `(app)` solo son accesibles si existe una sesión activa. Si no hay sesión, el sistema redirige automáticamente al onboarding. Si hay sesión pero se accede a rutas `(auth)`, se redirige al home. |
| **Criterios de aceptación** | 1. `(app)/_layout.tsx` verifica `user` de `useUser()` / `supabase.auth.getSession()`. 2. Si `user` es `null`/`undefined`, se muestra pantalla de carga y se redirige a onboarding. 3. `(auth)/_layout.tsx` redirige a home si ya hay sesión. 4. La verificación ocurre antes de renderizar cualquier pantalla protegida. |
| **Dependencias** | RF-A02, RF-A03 |
| **Notas** | Implementado en `_layout.tsx` de cada grupo de rutas con Expo Router. |

---

### Módulo M: Gestión de Suscripciones (API)

---

#### RF-M01 — Listar suscripciones activas del usuario

| Campo | Valor |
|---|---|
| **ID** | RF-M01 |
| **Nombre** | GET /subscriptions — listar suscripciones activas |
| **Prioridad** | P0 |
| **Descripción** | Endpoint autenticado que devuelve todas las suscripciones activas (`active = true`) del usuario autenticado. |
| **Criterios de aceptación** | 1. `GET /api/subscriptions`. 2. Requiere header `Authorization: Bearer <jwt>`. 3. El middleware `supabaseAuth` extrae `userId` del claim `sub` del JWT. 4. La query filtra por `user_id` y `active = true`. 5. Respuesta: array JSON de suscripciones con todos los campos. 6. Sin token → 401. Token inválido/expirado → 401. |
| **Dependencias** | Supabase Auth configurado en API (`SUPABASE_JWT_SECRET`) |
| **Notas** | Usa Drizzle ORM con `eq(subscriptions.userId, userId)` y `eq(subscriptions.active, true)`. |

---

#### RF-M02 — Listar próximos pagos (ventana de 30 días)

| Campo | Valor |
|---|---|
| **ID** | RF-M02 |
| **Nombre** | GET /subscriptions/upcoming — próximos pagos |
| **Prioridad** | P1 |
| **Descripción** | Endpoint que devuelve suscripciones activas cuya fecha de próximo pago está entre hoy y 30 días en el futuro. |
| **Criterios de aceptación** | 1. `GET /api/subscriptions/upcoming`. 2. Requiere autenticación. 3. Filtra `nextPaymentDate >= today AND nextPaymentDate <= today+30d`. 4. Respuesta: array de suscripciones ordenadas por fecha de pago. 5. La ruta `/upcoming` se define antes de `/:id` para evitar shadowing. |
| **Dependencias** | RF-M01 |
| **Notas** | Las fechas se calculan en el servidor con `new Date()`. |

---

#### RF-M03 — Obtener suscripción por ID

| Campo | Valor |
|---|---|
| **ID** | RF-M03 |
| **Nombre** | GET /subscriptions/:id — detalle de suscripción |
| **Prioridad** | P0 |
| **Descripción** | Devuelve una suscripción específica por ID, validando pertenencia al usuario autenticado. |
| **Criterios de aceptación** | 1. `GET /api/subscriptions/:id`. 2. Si `id` no es numérico → 400. 3. Si no existe o no pertenece al usuario → 404. 4. Respuesta: objeto JSON de la suscripción. |
| **Dependencias** | RF-M01 |
| **Notas** | La query incluye tanto `subscriptions.id = id` como `subscriptions.userId = userId`. |

---

#### RF-M04 — Crear suscripción

| Campo | Valor |
|---|---|
| **ID** | RF-M04 |
| **Nombre** | POST /subscriptions — crear suscripción |
| **Prioridad** | P0 |
| **Descripción** | Crea una nueva suscripción asociada al usuario autenticado. |
| **Criterios de aceptación** | 1. `POST /api/subscriptions`. 2. Campos requeridos: `name`, `cost`, `nextPaymentDate`. 3. Campos opcionales: `logoUrl`, `currency` (default "COP"), `billingCycle` (default "monthly"), `categoryId`, `paymentLast4`, `planName`, `color`. 4. Si falta un campo requerido → 400. 5. Respuesta 201 con el objeto creado (incluye `id`, timestamps). 6. `userId` se toma del token, no del body. |
| **Dependencias** | RF-M01, tabla `subscriptions` en BD |
| **Notas** | `cost` se almacena como `numeric(12,2)`. Las fechas en modo `"string"`. |

---

#### RF-M05 — Actualizar suscripción

| Campo | Valor |
|---|---|
| **ID** | RF-M05 |
| **Nombre** | PUT /subscriptions/:id — actualizar suscripción |
| **Prioridad** | P0 |
| **Descripción** | Actualiza parcialmente una suscripción existente. Solo los campos enviados en el body se modifican. |
| **Criterios de aceptación** | 1. `PUT /api/subscriptions/:id`. 2. Si `id` no es numérico → 400. 3. Si no existe o no pertenece → 404. 4. Campos actualizables: todos los de creación más `active`. 5. Se actualiza `updatedAt` al timestamp actual. 6. `userId` no se puede modificar. 7. Respuesta: objeto actualizado. |
| **Dependencias** | RF-M04 |
| **Notas** | Usa spread condicional para solo hacer `SET` de los campos definidos. |

---

#### RF-M06 — Soft delete de suscripción

| Campo | Valor |
|---|---|
| **ID** | RF-M06 |
| **Nombre** | DELETE /subscriptions/:id — soft delete |
| **Prioridad** | P0 |
| **Descripción** | Marca una suscripción como inactiva (`active = false`) sin eliminar el registro de la base de datos. |
| **Criterios de aceptación** | 1. `DELETE /api/subscriptions/:id`. 2. Si `id` no es numérico → 400. 3. Si no existe o no pertenece → 404. 4. Ejecuta `UPDATE subscriptions SET active = false, updated_at = now()`. 5. Respuesta 204 sin body. 6. Las suscripciones inactivas no aparecen en GET /subscriptions. |
| **Dependencias** | RF-M01, RF-M05 |
| **Notas** | Soft delete permite recuperación futura y preserva datos para analytics. |

---

#### RF-M07 — Insights mensuales

| Campo | Valor |
|---|---|
| **ID** | RF-M07 |
| **Nombre** | GET /insights/monthly — resumen de gastos mensuales |
| **Prioridad** | P1 |
| **Descripción** | Devuelve el total de gastos y el desglose por suscripción para un mes y año específicos, basado en la fecha de próximo pago. |
| **Criterios de aceptación** | 1. `GET /api/insights/monthly?year=YYYY&month=MM`. 2. Si no se envían `year`/`month`, se usan los valores actuales. 3. Filtra suscripciones activas con `nextPaymentDate` dentro del mes. 4. Respuesta: `{ year, month, totalCOP, count, breakdown: [...] }`. 5. `totalCOP` solo suma suscripciones en COP. 6. `breakdown` incluye: `id`, `name`, `cost`, `currency`, `nextPaymentDate`, `color`. |
| **Dependencias** | RF-M01 |
| **Notas** | El cálculo multi-moneda se delega al frontend móvil por ahora. |

---

### Módulo V: Aplicación Móvil — Pantallas

---

#### RF-V01 — Pantalla Home (dashboard)

| Campo | Valor |
|---|---|
| **ID** | RF-V01 |
| **Nombre** | Dashboard principal con resumen y accesos rápidos |
| **Prioridad** | P0 |
| **Descripción** | Pantalla inicial post-login que muestra: saludo personalizado, balance total en la moneda preferida del usuario, lista horizontal de próximos pagos (hasta 5), y lista vertical de todas las suscripciones (hasta 4) con enlace "Ver todos". |
| **Criterios de aceptación** | 1. Saludo: "Hola, {firstName}" (usa `user.firstName` del contexto, fallback al email). 2. Botón "+" (FAB) en la esquina superior derecha que navega a `subscription-form`. 3. Tarjeta de balance: fondo accent, monto formateado con `Intl.NumberFormat`, moneda según preferencia del usuario, fecha actual (MM/YY). 4. Sección "Próximos pagos": `ScrollView` horizontal con `SubscriptionCard` compacto. Si no hay → texto "Sin pagos próximos". 5. Sección "Todas las suscripciones": lista vertical. Si no hay → "Sin suscripciones aún". 6. Pull-to-refresh recarga ambos endpoints. 7. Spinner de carga mientras se obtienen los datos. 8. Tracking de pantalla vía PostHog (`trackScreenView("home")`). |
| **Dependencias** | RF-M01, RF-M02, RF-V05 (SubscriptionCard), RF-V07 (preferencias de usuario) |
| **Notas** | Las suscripciones se filtran por `currency === prefs.currency` para el total. Se usan `Promise.all` para cargar upcoming + all en paralelo. |

---

#### RF-V02 — Pantalla de Suscripciones (lista completa)

| Campo | Valor |
|---|---|
| **ID** | RF-V02 |
| **Nombre** | Lista maestra de suscripciones con panel expandible |
| **Prioridad** | P0 |
| **Descripción** | `FlatList` con todas las suscripciones activas. Cada item es una `SubscriptionCard`. Al presionar una card, se expande un panel inferior con información adicional (plan, últimos 4 dígitos) y botones de acción (editar, cancelar). |
| **Criterios de aceptación** | 1. Título "Mis suscripciones" + botón "+" en header. 2. `FlatList` con `keyExtractor` por `id`. 3. Pull-to-refresh. 4. Al presionar una card → `LayoutAnimation.easeInEaseOut` + toggle del panel. 5. Panel expandido muestra: nombre del plan (si existe), `•••• {last4}` (si existe), botón "Editar" (navega a detail), botón "Cancelar suscripción" (rojo, con `Alert` de confirmación). 6. Solo una card expandida a la vez. 7. Recarga automática al ganar foco (`useFocusEffect`). 8. Estado vacío: "Sin suscripciones aún". |
| **Dependencias** | RF-M01, RF-M06, RF-V05 (SubscriptionCard) |
| **Notas** | La cancelación llama a `DELETE /subscriptions/:id` y recarga la lista. El panel usa `marginTop: -Radius.lg` para quedar pegado a la card. |

---

#### RF-V03 — Pantalla de Insights

| Campo | Valor |
|---|---|
| **ID** | RF-V03 |
| **Nombre** | Resumen mensual con gráfica de barras |
| **Prioridad** | P1 |
| **Descripción** | Muestra los gastos totales del mes seleccionado, un gráfico de barras con el desglose por suscripción (victory-native v41 `CartesianChart` + `Bar`) y una lista detallada debajo. |
| **Criterios de aceptación** | 1. Navegador de mes: botones "<" y ">" para cambiar de mes. 2. No se puede avanzar más allá del mes actual (botón ">" deshabilitado). 3. Etiqueta del mes en formato localizado (ej. "04 2026"). 4. Tarjeta con total de gastos en COP formateado. 5. Gráfica de barras: cada barra representa una suscripción, color `Colors.accent`, esquinas redondeadas superiores, altura proporcional al costo. 6. Eje Y con formato compacto (k, M). 7. Lista de desglose: nombre + costo formateado. 8. Estado vacío si no hay suscripciones. 9. Recarga al ganar foco con los parámetros actuales de mes/año. |
| **Dependencias** | RF-M07, victory-native 41 |
| **Notas** | Usa `CartesianChart` con `domainPadding`, `xKey="index"`, `yKeys={["value"]}`. `formatYLabel` compacta valores >1M y >1k. |

---

#### RF-V04 — Pantalla de Configuración

| Campo | Valor |
|---|---|
| **ID** | RF-V04 |
| **Nombre** | Configuración de perfil, moneda, notificaciones, idioma y sesión |
| **Prioridad** | P1 |
| **Descripción** | Pantalla con: perfil del usuario (avatar con inicial + nombre/email), selector de moneda por defecto (chips), toggle de notificaciones + selector de días de antelación (chips), toggle de idioma (ES/EN), y botón de cerrar sesión. |
| **Criterios de aceptación** | 1. Avatar circular con la inicial del nombre (o "U" como fallback). 2. Nombre completo o email debajo. 3. Selector de moneda: chips `COP`, `USD`, `EUR`, `MXN`, `BRL`. Chip activo con borde accent. 4. Toggle de notificaciones: `Switch`. Al activar → solicita permisos. Si se deniegan → revierte el toggle + muestra alerta. 5. Al desactivar → `cancelAllReminders()`. 6. Si notificaciones activas: chips `1, 3, 5, 7` días antes. Al cambiar → reprograma recordatorios. 7. Toggle de idioma: botón "Switch to EN" / "Cambiar a ES". Cambia `i18n.changeLanguage()`. 8. Botón de cerrar sesión: rojo con borde danger. 9. Spinner mientras se cargan las preferencias desde AsyncStorage. |
| **Dependencias** | RF-A04, RF-V06 (notificaciones), RF-V07 (preferencias), RF-M01 |
| **Notas** | Las preferencias se persisten en AsyncStorage con keys `epti_currency`, `epti_notify_enabled`, `epti_notify_days`. |

---

#### RF-V05 — Detalle de suscripción

| Campo | Valor |
|---|---|
| **ID** | RF-V05 |
| **Nombre** | Pantalla de detalle de suscripción |
| **Prioridad** | P1 |
| **Descripción** | Muestra todos los detalles de una suscripción: hero card con color personalizado, badge de días restantes, información estructurada (plan, último pago, próxima fecha, moneda), y botón para cancelar. |
| **Criterios de aceptación** | 1. Navbar: botón volver "‹", nombre de la suscripción, enlace "Editar". 2. Hero card: fondo `sub.color` (fallback accent), nombre en grande, costo formateado, ciclo de facturación. 3. Badge: "Hoy" (0 días), "Vencido" (<0), o "X días" (>0). 4. Info rows con separadores: plan (si existe), últimos 4 dígitos (si existen, con `••••`), próxima fecha de pago (formato local), moneda. 5. Botón "Cancelar suscripción" con confirmación `Alert`. 6. Al cancelar → tracking PostHog → `router.back()`. 7. Spinner mientras carga. Si no encuentra la suscripción → "Ocurrió un error". |
| **Dependencias** | RF-M03, RF-M06, RF-V08 (SubscriptionCard) |
| **Notas** | `daysUntil()` calcula `Math.ceil(diff / (1000*60*60*24))`. El enlace "Editar" navega al formulario con el param `id`. |

---

#### RF-V06 — Formulario de suscripción (crear/editar)

| Campo | Valor |
|---|---|
| **ID** | RF-V06 |
| **Nombre** | Formulario completo para crear o editar una suscripción |
| **Prioridad** | P0 |
| **Descripción** | Pantalla con formulario para crear una nueva suscripción o editar una existente (según el parámetro `id`). Incluye campos de texto, selectores tipo chip para moneda y ciclo, y un picker horizontal de colores. |
| **Criterios de aceptación** | 1. Si `id` está en params → modo edición: carga datos con `GET /subscriptions/:id` al ganar foco. 2. Si no → modo creación con valores iniciales (COP, monthly, fecha hoy, primer color de la paleta). 3. Navbar: volver "‹", título ("Editar" o "Nueva suscripción"), botón "Guardar". 4. Campos: nombre (texto), costo (decimal-pad, validación numérica), moneda (chips COP/USD/EUR/MXN/BRL), ciclo (chips: mensual/anual/trimestral/semanal/diario), fecha próximo pago (YYYY-MM-DD), plan (texto), últimos 4 dígitos (numérico, maxLength 4, solo dígitos), color (scroll horizontal con 20 colores, indicador de selección con borde blanco + scale). 5. Validación: nombre y costo requeridos. Costo debe ser número > 0. 6. Al guardar: POST (crear) o PUT (editar). 7. En creación → tracking PostHog. 8. Spinner mientras guarda. Error → Alert. 9. Éxito → `router.back()`. |
| **Dependencias** | RF-M04, RF-M05, paleta de colores (`Colors.subscriptionColors`) |
| **Notas** | El picker de colores muestra flechas de overflow cuando hay más colores de los visibles. La moneda y ciclo usan el mismo patrón de chips. |

---

### Módulo C: Componentes Compartidos

---

#### RF-C01 — SubscriptionCard

| Campo | Valor |
|---|---|
| **ID** | RF-C01 |
| **Nombre** | Componente reutilizable de tarjeta de suscripción |
| **Prioridad** | P1 |
| **Descripción** | Componente que renderiza una suscripción como una tarjeta con color de fondo personalizado, nombre, costo, ciclo y días restantes. Soporta modo compacto (horizontal) y modo completo (vertical). |
| **Criterios de aceptación** | 1. Fondo: `subscription.color` con fallback a `Colors.accent`. 2. Muestra: nombre, costo formateado, ciclo de facturación, badge de días restantes. 3. Modo compacto (`compact` prop): ancho fijo ~160, orientación vertical reducida. 4. Modo completo: ancho completo, layout más espacioso. 5. Recibe `onPress` callback. 6. Los textos usan color blanco para contraste sobre fondo de color. |
| **Dependencias** | Tipos `Subscription` |
| **Notas** | Usado en Home (compacto, horizontal), lista de suscripciones (completo, expandible), y potencialmente en otros lugares. |

---

### Módulo N: Notificaciones

---

#### RF-N01 — Solicitud de permisos de notificación

| Campo | Valor |
|---|---|
| **ID** | RF-N01 |
| **Nombre** | Solicitar permisos de notificación en el dispositivo |
| **Prioridad** | P1 |
| **Descripción** | Al activar el toggle de notificaciones en Settings, se solicitan permisos al sistema operativo (Android 13+). Si se deniegan, se revierte el toggle y se informa al usuario. |
| **Criterios de aceptación** | 1. `requestNotificationPermission()` llama a `Notifications.requestPermissionsAsync()`. 2. Retorna `true` si `status === "granted"`. 3. En Settings, si retorna `false`, se muestra `Alert` con instrucciones para activar en Ajustes. 4. El toggle se revierte a `false` en AsyncStorage. |
| **Dependencias** | expo-notifications |
| **Notas** | Configuración del handler: `shouldShowAlert: true`, `shouldPlaySound: true`, `shouldShowBanner: true`. |

---

#### RF-N02 — Programar recordatorios de pago

| Campo | Valor |
|---|---|
| **ID** | RF-N02 |
| **Nombre** | Programación automática de notificaciones locales |
| **Prioridad** | P1 |
| **Descripción** | Dado un array de suscripciones y un número de días de antelación, se cancelan todas las notificaciones existentes y se programan nuevas notificaciones para cada suscripción a las 9:00 AM del día `(nextPaymentDate - daysBefore)`. |
| **Criterios de aceptación** | 1. `schedulePaymentReminders(subscriptions, daysBefore)`. 2. Primero llama a `cancelAllScheduledNotificationsAsync()`. 3. Para cada suscripción: calcula `triggerDate = paymentDate - daysBefore` a las 9:00 AM. 4. Si `triggerDate <= now`, se salta (ya pasó). 5. Identificador: `subs-{id}`. 6. Contenido: título "💳 {name}", body "Pago en {n} día(s)". 7. `data: { subscriptionId: id }` para deep linking futuro. 8. Trigger tipo `DATE`. |
| **Dependencias** | RF-N01, expo-notifications |
| **Notas** | Se llama desde Settings al cambiar los días de antelación, y al activar notificaciones. También desde el sign-out se cancelan todas. |

---

#### RF-N03 — Cancelar todos los recordatorios

| Campo | Valor |
|---|---|
| **ID** | RF-N03 |
| **Nombre** | Cancelación masiva de notificaciones programadas |
| **Prioridad** | P1 |
| **Descripción** | Elimina todas las notificaciones locales pendientes del dispositivo. Se invoca al desactivar notificaciones o al cerrar sesión. |
| **Criterios de aceptación** | 1. `cancelAllReminders()` llama a `Notifications.cancelAllScheduledNotificationsAsync()`. 2. No lanza error si no hay notificaciones. |
| **Dependencias** | expo-notifications |



---

### Módulo P: Preferencias de Usuario

---

#### RF-P01 — Moneda por defecto persistente

| Campo | Valor |
|---|---|
| **ID** | RF-P01 |
| **Nombre** | Selección y persistencia de moneda preferida |
| **Prioridad** | P1 |
| **Descripción** | El usuario selecciona una moneda (COP, USD, EUR, MXN, BRL). Esta preferencia se persiste en AsyncStorage y se usa en Home para calcular el balance total filtrado por esa moneda. |
| **Criterios de aceptación** | 1. Valor por defecto: "COP". 2. Se almacena en AsyncStorage con key `epti_currency`. 3. El hook `useUserPrefs` expone `prefs.currency` y `setCurrency()`. 4. Home recalcula el total cuando cambia la moneda (`useEffect` depende de `prefs.currency`). 5. El formulario de suscripción usa la moneda preferida como valor inicial. |
| **Dependencias** | AsyncStorage |
| **Notas** | Las suscripciones guardan su propia moneda independiente. El filtro es solo para el dashboard. |

---

#### RF-P02 — Preferencias de notificación persistentes

| Campo | Valor |
|---|---|
| **ID** | RF-P02 |
| **Nombre** | Persistencia de toggle de notificaciones y días de antelación |
| **Prioridad** | P2 |
| **Descripción** | El estado del toggle de notificaciones (`true`/`false`) y los días de antelación (`1`, `3`, `5`, `7`) se persisten en AsyncStorage y se restauran al iniciar la app. |
| **Criterios de aceptación** | 1. Keys: `epti_notify_enabled` (boolean), `epti_notify_days` (number). 2. Valores por defecto: `true` y `3`. 3. El hook `useUserPrefs` expone getters y setters. 4. Al activar notificaciones, se solicita permiso y se reprograman recordatorios. 5. Al cambiar días, se reprograman recordatorios inmediatamente. |
| **Dependencias** | RF-N01, RF-N02, AsyncStorage |
| **Notas** | El hook `useUserPrefs` carga todas las preferencias en un solo `Promise.all`. |

---

### Módulo I: Internacionalización (i18n)

---

#### RF-I01 — Soporte bilingüe español/inglés

| Campo | Valor |
|---|---|
| **ID** | RF-I01 |
| **Nombre** | Traducción completa de la interfaz en español e inglés |
| **Prioridad** | P2 |
| **Descripción** | La app detecta el idioma del dispositivo al iniciar y carga las traducciones correspondientes. El usuario puede cambiar manualmente entre español e inglés desde Settings. El español es el idioma por defecto. |
| **Criterios de aceptación** | 1. Archivos de traducción: `es.json` y `en.json` en `locales/`. 2. Configuración de i18next con `expo-localization` para detección inicial. 3. Namespace único (default). 4. Secciones de traducción: `common`, `auth`, `home`, `subscription`, `insights`, `settings`. 5. Interpolación de variables con sintaxis `{{name}}`. 6. Plurals con `{{count}}`. 7. Toggle en Settings muestra "Switch to EN" / "Cambiar a ES". 8. El cambio es instantáneo vía `i18n.changeLanguage()`. |
| **Dependencias** | i18next, react-i18next, expo-localization |
| **Notas** | La detección del idioma inicial usa `expo-localization`. Si el locale empieza con "en", usa inglés; de lo contrario, español. |

---

### Módulo T: Tracking y Analítica

---

#### RF-T01 — Identificación y eventos en PostHog

| Campo | Valor |
|---|---|
| **ID** | RF-T01 |
| **Nombre** | Tracking de eventos clave con PostHog |
| **Prioridad** | P3 |
| **Descripción** | La app captura eventos de creación de suscripción, eliminación de suscripción y vistas de pantalla. En entorno de desarrollo (`__DEV__`), el SDK no se inicializa para evitar tráfico con API key placeholder. |
| **Criterios de aceptación** | 1. En producción, `PostHog` se inicializa con `EXPO_PUBLIC_POSTHOG_API_KEY`. 2. Eventos tipados: `subscription_created` (name, billing_cycle), `subscription_deleted` (name), `$screen` (screen_name). 3. En desarrollo, el cliente es `null` y los helpers hacen early-return. 4. No se envía email, nombre ni PII — solo `userId` opaco de Clerk. 5. Configuración: `flushAt: 20`, `flushInterval: 30000`. |
| **Dependencias** | posthog-react-native |
| **Notas** | La API key en desarrollo es `"phc_placeholder"` — no se debe exponer la key real en el código. |

---

### Módulo S: Seguridad

---

#### RF-S01 — Autenticación JWT en API

| Campo | Valor |
|---|---|
| **ID** | RF-S01 |
| **Nombre** | Verificación local de JWT de Supabase |
| **Prioridad** | P0 |
| **Descripción** | La API verifica el JWT de Supabase localmente usando `SUPABASE_JWT_SECRET` (HS256) sin llamadas de red al proveedor de auth. El middleware extrae `userId` del claim `sub` y rechaza requests sin token o con token inválido/expirado. |
| **Criterios de aceptación** | 1. Middleware `supabaseAuth` extrae token del header `Authorization: Bearer <token>`. 2. Verifica con `jwt.verify(token, SUPABASE_JWT_SECRET)`. 3. Expone `req.userId = payload.sub`. 4. Sin token → 401. Token inválido/expirado → 401. 5. `SUPABASE_JWT_SECRET` no configurado → error del servidor. 6. No se loguean tokens ni datos sensibles. |
| **Dependencias** | Supabase project settings, jsonwebtoken |
| **Notas** | La revocación de tokens se maneja en Supabase. `exp` se valida automáticamente por `jsonwebtoken`. |

---

#### RF-S02 — Almacenamiento seguro en dispositivo

| Campo | Valor |
|---|---|
| **ID** | RF-S02 |
| **Nombre** | Tokens JWT almacenados en Android Keystore |
| **Prioridad** | P0 |
| **Descripción** | Los tokens JWT de sesión y refresh se almacenan en el Keystore de Android vía `expo-secure-store`, no en AsyncStorage ni en texto plano. |
| **Criterios de aceptación** | 1. Supabase client se configura con `storage: SecureStoreAdapter` de `expo-secure-store`. 2. Los tokens no son accesibles desde otras apps. 3. Al cerrar sesión, los tokens se eliminan del almacenamiento seguro. |
| **Dependencias** | expo-secure-store, @supabase/supabase-js |
| **Notas** | Implementado en `lib/supabase.ts` en la configuración del cliente Supabase. |

---

#### RF-S03 — Soft delete de datos

| Campo | Valor |
|---|---|
| **ID** | RF-S03 |
| **Nombre** | Eliminación lógica sin pérdida de datos |
| **Prioridad** | P1 |
| **Descripción** | Las suscripciones no se eliminan físicamente. Se marcan como inactivas (`active = false`) para preservar el historial y permitir recuperación. |
| **Criterios de aceptación** | 1. `DELETE /subscriptions/:id` ejecuta `UPDATE` en lugar de `DELETE`. 2. Las suscripciones inactivas se excluyen de todas las queries de lectura. 3. El campo `updatedAt` se actualiza al momento del soft delete. |
| **Dependencias** | RF-M06 |
| **Notas** | Facilita auditoría y potencial funcionalidad de "reactivar suscripción" en el futuro. |

---

### Módulo D: Infraestructura y DevOps

---

#### RF-D01 — Entorno de desarrollo con Docker Compose

| Campo | Valor |
|---|---|
| **ID** | RF-D01 |
| **Nombre** | Stack local con PostgreSQL y API en contenedores |
| **Prioridad** | P1 |
| **Descripción** | `docker compose up -d` levanta PostgreSQL 17 Alpine y la API Express con hot-reload. La API espera a que PostgreSQL esté healthy antes de iniciar. |
| **Criterios de aceptación** | 1. Servicio `db`: PostgreSQL 17 Alpine, puerto 5432, volumen persistente, healthcheck `pg_isready`. 2. Servicio `api`: build desde `api/Dockerfile` con target builder, hot-reload vía `tsx watch`, puerto 3000. 3. `depends_on` con `condition: service_healthy`. 4. Variables de entorno desde `api/.env` + docker-compose. 5. El código fuente se monta como volumen para hot-reload. |
| **Dependencias** | Docker, Docker Compose |
| **Notas** | Usa `pnpm dev` como comando. El contexto de build es la raíz del monorepo para acceder a `pnpm-lock.yaml`. |

---

#### RF-D02 — CI/CD con GitHub Actions

| Campo | Valor |
|---|---|
| **ID** | RF-D02 |
| **Nombre** | Build y push de imagen Docker en push a main |
| **Prioridad** | P1 |
| **Descripción** | Al hacer push a `main` con cambios en `api/**`, GitHub Actions construye la imagen Docker, la etiqueta con `latest` y el SHA del commit, y la publica en GitHub Container Registry (GHCR). |
| **Criterios de aceptación** | 1. Workflow: `.github/workflows/api-docker.yml`. 2. Se dispara en push a `main` con cambios en `api/**`. 3. Construye con `target: production`. 4. Publica en `ghcr.io/ergrato-dev/epti-subs-api:latest` y `:{sha}`. 5. Usa secrets para autenticación en GHCR. |
| **Dependencias** | Dockerfile de producción en `api/` |
| **Notas** | El deploy en VPS está pendiente (fase 8). |

---

#### RF-D03 — Build de APK con EAS

| Campo | Valor |
|---|---|
| **ID** | RF-D03 |
| **Nombre** | Build de APK preview y AAB producción vía EAS |
| **Prioridad** | P2 |
| **Descripción** | La app móvil se construye con Expo Application Services (EAS). El perfil `preview` genera un APK para pruebas en dispositivo. El perfil `production` genera un AAB para Google Play. |
| **Criterios de aceptación** | 1. Comando `pnpm build:preview` desde `mobile/`. 2. Perfil `preview`: APK firmado, canal `preview`, sin publicación automática. 3. Perfil `production`: AAB firmado para release. 4. Configuración en `eas.json`. |
| **Dependencias** | EAS CLI configurado, Expo account |
| **Notas** | Funcionalidad planificada para fases 7-8. |

---

## 3. Matriz de trazabilidad

| RF | Módulo | Depende de | Estado actual |
|---|---|---|---|
| RF-A01 | Auth — Onboarding | Ninguna | ✅ Implementado |
| RF-A02 | Auth — Sign-in | RF-A01 | ✅ Implementado |
| RF-A03 | Auth — Sign-up (2 pasos) | RF-A02 | ✅ Implementado |
| RF-A04 | Auth — Sign-out | RF-A02, RF-A03, RF-V04, RF-N03 | ✅ Implementado |
| RF-A05 | Auth — Guard | RF-A02, RF-A03 | ✅ Implementado |
| RF-M01 | API — Listar suscripciones | RF-S01 | ✅ Implementado |
| RF-M02 | API — Próximos pagos | RF-M01 | ✅ Implementado |
| RF-M03 | API — Obtener por ID | RF-M01 | ✅ Implementado |
| RF-M04 | API — Crear | RF-M01 | ✅ Implementado |
| RF-M05 | API — Actualizar | RF-M04 | ✅ Implementado |
| RF-M06 | API — Soft delete | RF-M01, RF-M05 | ✅ Implementado |
| RF-M07 | API — Insights | RF-M01 | ✅ Implementado |
| RF-V01 | App — Home | RF-M01, RF-M02, RF-C01, RF-P01, RF-T01 | ✅ Implementado |
| RF-V02 | App — Subscriptions list | RF-M01, RF-M06, RF-C01 | ✅ Implementado |
| RF-V03 | App — Insights | RF-M07 | ✅ Implementado |
| RF-V04 | App — Settings | RF-A04, RF-N01, RF-N02, RF-P01, RF-P02, RF-I01 | ✅ Implementado |
| RF-V05 | App — Detail | RF-M03, RF-M06 | ✅ Implementado |
| RF-V06 | App — Form | RF-M04, RF-M05, RF-T01 | ✅ Implementado |
| RF-C01 | Component — SubscriptionCard | Tipos Subscription | ✅ Implementado |
| RF-N01 | Notif — Permisos | expo-notifications | ✅ Implementado |
| RF-N02 | Notif — Programar | RF-N01, RF-M01 | ✅ Implementado |
| RF-N03 | Notif — Cancelar | expo-notifications | ✅ Implementado |
| RF-P01 | Prefs — Moneda | AsyncStorage | ✅ Implementado |
| RF-P02 | Prefs — Notificaciones | RF-N01, RF-N02, AsyncStorage | ✅ Implementado |
| RF-I01 | i18n — ES/EN | i18next, expo-localization | ✅ Implementado |
| RF-T01 | Tracking — PostHog | posthog-react-native | ✅ Implementado |
| RF-S01 | Seguridad — JWT API | Supabase project settings | ✅ Implementado |
| RF-S02 | Seguridad — Keystore | expo-secure-store | ✅ Implementado |
| RF-S03 | Seguridad — Soft delete | RF-M06 | ✅ Implementado |
| RF-D01 | DevOps — Docker Compose | Docker | ✅ Implementado |
| RF-D02 | DevOps — CI/CD | Dockerfile, GH Actions | ✅ Implementado |
| RF-D03 | DevOps — EAS Build | EAS CLI | ⬜ Pendiente (fase 7) |

---

## 4. Anexos

### 4.1 Modelo de datos — `subscriptions`

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `serial` | PK | Identificador único |
| `user_id` | `varchar(255)` | NOT NULL | ID del usuario (Supabase `auth.uid()`) |
| `name` | `varchar(255)` | NOT NULL | Nombre del servicio (ej. "Netflix") |
| `logo_url` | `text` | NULL | URL del logo del servicio |
| `cost` | `numeric(12,2)` | NOT NULL | Costo por ciclo de facturación |
| `currency` | `varchar(10)` | NOT NULL, DEFAULT 'COP' | Código de moneda ISO 4217 |
| `billing_cycle` | `enum` | NOT NULL, DEFAULT 'monthly' | daily, weekly, monthly, quarterly, yearly |
| `next_payment_date` | `date` | NOT NULL | Fecha del próximo cobro (YYYY-MM-DD) |
| `category_id` | `integer` | FK → categories.id | Categoría opcional |
| `payment_last4` | `varchar(4)` | NULL | Últimos 4 dígitos del método de pago |
| `plan_name` | `varchar(100)` | NULL | Nombre del plan (ej. "Premium") |
| `color` | `varchar(7)` | NULL | Color hexadecimal (ej. "#FF5733") |
| `active` | `boolean` | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de última modificación |

### 4.2 Endpoints API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/subscriptions` | Sí | Listar suscripciones activas |
| `GET` | `/api/subscriptions/upcoming` | Sí | Próximos pagos (30 días) |
| `GET` | `/api/subscriptions/:id` | Sí | Obtener suscripción por ID |
| `POST` | `/api/subscriptions` | Sí | Crear suscripción |
| `PUT` | `/api/subscriptions/:id` | Sí | Actualizar suscripción |
| `DELETE` | `/api/subscriptions/:id` | Sí | Soft delete |
| `GET` | `/api/insights/monthly` | Sí | Resumen mensual (?year=&month=) |

### 4.3 Pantallas de la app

| Ruta | Pantalla | Auth requerida |
|---|---|---|
| `(auth)/onboarding` | Onboarding | No |
| `(auth)/sign-in` | Inicio de sesión | No |
| `(auth)/sign-up` | Registro (2 pasos) | No |
| `(app)/(tabs)/home` | Dashboard principal | Sí |
| `(app)/(tabs)/subscriptions` | Lista de suscripciones | Sí |
| `(app)/(tabs)/insights` | Resumen mensual | Sí |
| `(app)/(tabs)/settings` | Configuración | Sí |
| `(app)/subscription-detail` | Detalle de suscripción | Sí |
| `(app)/subscription-form` | Formulario crear/editar | Sí |
