# 🐾 Silvestra Vet — Plataforma de veterinaria a domicilio

Aplicación web fullstack para gestionar un servicio veterinario a domicilio: capta clientes desde una landing, permite a los tutores registrar a sus mascotas y agendar visitas, y le da al equipo veterinario un panel para administrar citas y entregar resultados clínicos de forma segura.

> El repositorio se llama `AMAVET` por razones históricas; el producto desplegado es **Silvestra Vet**.

---

## 📐 Arquitectura

Monorepo con dos aplicaciones independientes:

```
apps/
├── web/   → Frontend (Next.js App Router)
└── api/   → Backend (NestJS REST API)
```

| Capa | Tecnología | Hosting |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · Tailwind CSS 4 | Vercel |
| **Backend** | NestJS 11 · Node.js 20+ · TypeScript | Render |
| **Base de datos** | PostgreSQL · Prisma 7 (ORM, adapter `@prisma/adapter-pg`) | Supabase (Postgres gestionado) |
| **Almacenamiento de archivos** | Supabase Storage (bucket privado, URLs firmadas) | Supabase |
| **Autenticación** | JWT propio (email/password) + Google OAuth vía Supabase Auth | — |
| **Email transaccional** | SendGrid (API HTTP) | — |

### Flujo de autenticación

- **Email / contraseña:** el backend emite un JWT firmado (`HS256`, issuer `amavet-api`) tras validar credenciales. Las contraseñas se hashean con **Argon2id**; las cuentas con hash `bcrypt` heredado se migran a Argon2id de forma transparente al iniciar sesión.
- **Google:** el frontend hace el OAuth con el SDK de Supabase; el backend recibe el access token de Supabase, lo verifica (`supabase.auth.getUser`), busca o crea al usuario con rol `TUTOR` y emite el mismo JWT propio. Así el resto del sistema (guards, rutas protegidas) no distingue el origen del login.
- Los usuarios creados por Google se guardan con un hash de contraseña aleatorio (no usable), marcados con `proveedor = GOOGLE`, y si aún no tienen teléfono se les pide completarlo en `/auth/completar-perfil` antes de entrar al panel.
- El JWT lleva un claim `tv` (`tokenVersion`): un cambio de contraseña lo incrementa e invalida todas las sesiones previas. Las cuentas eliminadas tienen su token rechazado.
- Roles: `TUTOR` (cliente) y `ADMIN` (equipo veterinario). El rol es la fuente de verdad en la base de datos, no en el token.

---

## 🧩 Funcionalidades

### Tutores (clientes)
- Registro / login con email-contraseña o con Google (registro protegido con captcha).
- Recuperación de contraseña por email (enlace de un solo uso, caduca en 15 min).
- Gestión de perfil (nombre, teléfono, cambio de contraseña).
- Registro de mascotas (especie, raza, edad), hasta un máximo por tutor.
- Agendar visitas a domicilio (fecha, dirección, servicios) — recibe email de confirmación.
- Ver el estado de sus citas y descargar resultados de exámenes en PDF.
- Eliminar la cuenta (soft-delete con 30 días de gracia para recuperarla).

### Panel de administración
- Agenda de consultas con vista de calendario; confirmar / cancelar / marcar como atendida.
- Gestión de tutores y mascotas.
- Registro de servicios y subida de exámenes (PDF) — el tutor es notificado por email.
- Configuración de cuenta del administrador.

### Notificaciones por email
Cada acción relevante dispara un email con plantilla HTML de la marca (header, tabla de detalles, footer):
- Cita agendada / confirmada / cancelada → al tutor.
- Examen disponible → al tutor (con enlace firmado de 24 h).
- Recuperación de contraseña → enlace de reset al tutor.
- Eventos de seguridad → al usuario: cambio de contraseña, inicio de sesión desde una IP nueva, cuenta eliminada o reactivada.
- Alertas de seguridad → al administrador: fuerza bruta, login admin desde IP nueva, registro masivo, cambios de contraseña en ráfaga.

Los envíos son *fire-and-forget*: un fallo de email nunca bloquea ni demora la operación principal; se registra como `WARN` en los logs. Los emails se enmascaran al loguearlos (sin PII cruda).

### Landing pública
- Información de servicios, cobertura y disponibilidad.
- CTA directo a WhatsApp.

---

## 🔐 Seguridad

El proyecto fue auditado contra el **OWASP Top 10 2025** (las 10 categorías) más un roadmap de endurecimiento. Resumen de los controles:

### Autenticación y sesiones
- **Hashing:** contraseñas con **Argon2id** (parámetros OWASP); migración gradual y transparente desde `bcrypt`.
- **JWT:** firmado `HS256`, issuer e algoritmo validados, expiración configurable. Claim `tv` (`tokenVersion`): un cambio de contraseña invalida todas las sesiones previas.
- **Anti fuerza bruta:** `@nestjs/throttler` global + **lockout escalonado** por `email+IP` tras N intentos fallidos (bloqueo de 30 min → 1 h → 3 h).
- **Anti enumeración de cuentas:** registro y recuperación de contraseña responden siempre un mensaje neutro, exista o no el email.
- **Defensa contra timing attacks** en el login (verificación señuelo para usuarios inexistentes).
- **Captcha** (Cloudflare Turnstile) en registro y recuperación de contraseña.

### Autorización y datos
- **Autorización:** guards de NestJS por rol; cada endpoint que toca datos de un usuario valida ownership (dueño o admin). Los IDs se derivan del JWT, no del body.
- **RLS en la base de datos:** las 8 tablas tienen Row Level Security forzado — defensa en profundidad sobre el acceso de la API con `service_role`.
- **Validación de entrada:** `class-validator` + `ValidationPipe` global con `whitelist`/`forbidNonWhitelisted`; `ParseUUIDPipe` en parámetros de ruta.
- **Inyección:** todo el acceso a datos pasa por Prisma (queries parametrizadas). Las subidas de PDF validan el *magic number* (`%PDF-`), no solo el `Content-Type`.
- **Almacenamiento:** bucket de exámenes privado; los PDF se sirven con URLs firmadas de corta duración. Las rutas usan nombres aleatorios (`randomUUID`).
- **Lógica de negocio defensiva:** transiciones de estado validadas (citas y exámenes), control de doble-booking, límites de mascotas y citas por tutor.

### Infraestructura y operación
- **Headers HTTP:** `helmet` + HSTS en el backend; CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` en el frontend. `Cache-Control: no-store` global en la API.
- **CORS:** lista blanca de orígenes con patrón regex opcional para previews de Vercel. `trust proxy` configurado para que el rate-limiting use la IP real del cliente.
- **Audit trail:** los eventos de seguridad se persisten en BD (`AuditLog`, retención 90 días, consultable por admin) y se evalúan contra patrones de alerta.
- **Borrado de cuenta:** soft-delete con 30 días de gracia y purga definitiva (cumple el derecho de cancelación, Ley 19.628).
- **Manejo de errores:** filtro de excepciones de Prisma (códigos HTTP correctos, sin filtrar detalle interno); errores genéricos al cliente, detalle solo en logs.
- **CI:** GitHub Actions corre lint, tests, build y `npm audit` en cada push y PR. Dependabot monitorea las dependencias.
- **Sin fuga de datos sensibles:** las respuestas nunca incluyen el hash de contraseña; los logs no incluyen contraseñas, tokens ni JWT, y los emails van enmascarados.

---

## 🗄️ Modelo de datos (Prisma)

| Modelo | Descripción |
|---|---|
| `User` | Tutores y administradores. Campos: nombre, email (único), teléfono, password (hash Argon2id), rol, `proveedor` (LOCAL/GOOGLE), `tokenVersion`, `eliminadoEn` (soft-delete). |
| `Mascota` | Pertenece a un `User` (tutor). Campos: nombre, tipo, raza, edad. |
| `Examen` | Pertenece a una `Mascota`. Estados: `PENDIENTE`, `EN_PROCESO`, `DISPONIBLE`. Guarda la ruta del PDF en Storage. |
| `Cita` | Pertenece a una `Mascota`. Estados: `PENDIENTE`, `CONFIRMADA`, `COMPLETADA`, `CANCELADA`. Fecha, dirección, servicios. |
| `PasswordResetToken` | Tokens de recuperación de contraseña (hash SHA-256, un solo uso, caducan a 15 min). |
| `LoginIntento` | Registro de intentos de login para el lockout escalonado. |
| `AuditLog` | Bitácora de seguridad persistente (retención 90 días). |

Borrado en cascada de exámenes y citas al eliminar la mascota; índices en claves foráneas y campos de filtrado frecuente. Las 8 tablas tienen Row Level Security forzado.

---

## 🌐 API REST (backend)

Base path por recurso:

| Recurso | Endpoints principales |
|---|---|
| `/auth` | `POST /registro`, `POST /login`, `POST /google`, `POST /olvide-password`, `POST /restablecer-password` |
| `/usuarios` | `GET /tutores` (admin), `PATCH /:id` (perfil), `PATCH /:id/password` |
| `/cuenta` | `DELETE /` (eliminar cuenta propia), `DELETE /:id` (admin), `POST /purgar` (cron, protegido por secreto) |
| `/mascotas` | `POST /`, `GET /`, `GET /:id`, `GET /tutor/:tutorId` |
| `/citas` | `POST /`, `GET /` (admin), `GET /mascota/:mascotaId`, `PATCH /:id/estado` |
| `/examenes` | `POST /`, `GET /`, `GET /:id`, `GET /:id/descargar`, `PATCH /:id/estado`, `POST /:id/subir` |
| `/admin` | `GET /auditoria` (admin — consulta del audit trail con filtros) |

---

## ⚙️ Puesta en marcha local

### Requisitos
- Node.js ≥ 20, npm ≥ 10
- Una base de datos PostgreSQL (puede ser la de Supabase)
- Cuentas en Supabase (Storage + Auth para Google) y SendGrid (emails)

### 1. Clonar e instalar

```bash
git clone https://github.com/<usuario>/AMAVET.git
cd AMAVET
npm install
```

### 2. Variables de entorno

**`apps/api/.env`** (ver `apps/api/.env.example`):

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
JWT_SECRET="<mínimo 32 caracteres aleatorios>"
JWT_EXPIRES_IN=24h
PORT=3001
TRUST_PROXY=0                       # 1 en producción (detrás del proxy de Render)
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<service role key>
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM=Silvestra Vet <notificaciones@tu-correo>
ADMIN_ALERT_EMAIL=                  # correo que recibe las alertas de seguridad
TURNSTILE_SECRET_KEY=               # captcha; vacío = desactivado (dev)
PURGE_SECRET=                       # secreto del endpoint de purga de cuentas
```

Ver `apps/api/.env.example` para la lista completa y comentada.

**`apps/web/.env.local`** (ver `apps/web/.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=     # captcha; vacío = desactivado (dev)
```

### 3. Base de datos

```bash
cd apps/api
npx prisma migrate deploy   # aplica las migraciones existentes
npx prisma generate
```

### 4. Levantar los servicios

```bash
# Terminal 1 — backend
cd apps/api && npm run start:dev      # http://localhost:3001

# Terminal 2 — frontend
cd apps/web && npm run dev            # http://localhost:3000
```

### Tests (backend)

```bash
cd apps/api && npm test
```

---

## 🚢 Despliegue

| Componente | Plataforma | Notas |
|---|---|---|
| Frontend | **Vercel** | Build automático desde `main`. Requiere las `NEXT_PUBLIC_*` en el dashboard. |
| Backend | **Render** | Plan free (se duerme con inactividad; ~50 s para despertar). Requiere todas las vars de `apps/api/.env`. El SMTP saliente está bloqueado en este plan, por eso los emails usan la API HTTP de SendGrid. |
| Base de datos + Storage | **Supabase** | Postgres + bucket privado para PDFs. |

Para Google OAuth: registrar el redirect URI de Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`) en Google Cloud Console, y agregar la URL de la app a las Redirect URLs en Supabase → Authentication → URL Configuration.

---

## 📁 Estructura

```
apps/
├── web/                      # Frontend — Next.js App Router
│   ├── app/
│   │   ├── (landing, login, registro, dashboard, admin, auth/callback, ...)
│   ├── components/           # Componentes compartidos
│   └── lib/                  # api (axios), session, supabase, utils
│
└── api/                      # Backend — NestJS
    └── src/
        ├── auth/             # JWT, Google OAuth, guards, roles, lockout, reset
        ├── users/            # Tutores y administradores
        ├── account/          # Borrado de cuenta (soft-delete + purga)
        ├── admin/            # Panel admin (consulta del audit trail)
        ├── pets/             # Mascotas
        ├── exams/            # Exámenes clínicos
        ├── citas/            # Agenda de visitas
        ├── common/           # Auditoría, captcha, hashing de contraseñas, helpers
        ├── notificaciones.*  # Emails (SendGrid, plantillas HTML)
        ├── supabase.service.ts   # Storage + verificación de tokens de Google
        └── prisma.*          # Acceso a la base de datos

.github/workflows/            # CI (lint, tests, build, npm audit)
apps/api/prisma/              # Schema y migraciones
```
