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

- **Email / contraseña:** el backend emite un JWT firmado (`HS256`, issuer `silvestra-api`) tras validar credenciales con `bcrypt` (12 rounds).
- **Google:** el frontend hace el OAuth con el SDK de Supabase; el backend recibe el access token de Supabase, lo verifica (`supabase.auth.getUser`), busca o crea al usuario con rol `TUTOR` y emite el mismo JWT propio. Así el resto del sistema (guards, rutas protegidas) no distingue el origen del login.
- Los usuarios creados por Google se guardan con un hash de contraseña aleatorio (no usable) y, si aún no tienen teléfono, se les pide completarlo en `/auth/completar-perfil` antes de entrar al panel.
- Roles: `TUTOR` (cliente) y `ADMIN` (equipo veterinario). El rol es la fuente de verdad en la base de datos, no en el token.

---

## 🧩 Funcionalidades

### Tutores (clientes)
- Registro / login con email-contraseña o con Google.
- Gestión de perfil (nombre, teléfono, cambio de contraseña).
- Registro de múltiples mascotas (especie, raza, edad).
- Agendar visitas a domicilio (fecha, dirección, servicios) — recibe email de confirmación.
- Ver el estado de sus citas y descargar resultados de exámenes en PDF.

### Panel de administración
- Agenda de consultas con vista de calendario; confirmar / cancelar / marcar como atendida.
- Gestión de tutores y mascotas.
- Registro de servicios y subida de exámenes (PDF) — el tutor es notificado por email.
- Configuración de cuenta del administrador.

### Notificaciones por email
Cada acción relevante dispara un email con plantilla HTML de la marca (header, tabla de detalles, footer):
- Cita agendada → al tutor.
- Cita confirmada / cancelada → al tutor.
- Examen disponible → al tutor (con enlace firmado de 24 h).

Los envíos son *fire-and-forget*: un fallo de email nunca bloquea ni demora la operación principal; se registra como `WARN` en los logs.

### Landing pública
- Información de servicios, cobertura y disponibilidad.
- CTA directo a WhatsApp.

---

## 🔐 Seguridad

- **Autenticación:** JWT con expiración configurable; contraseñas con `bcrypt` (12 rounds); defensa contra timing attacks en el login; rechazo de hashes corruptos.
- **Autorización:** guards de NestJS por rol; cada endpoint que modifica datos de un usuario valida que el solicitante sea el dueño o un admin.
- **Validación de entrada:** `class-validator` + `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`; `ParseUUIDPipe` en parámetros de ruta.
- **Inyección:** todo el acceso a datos pasa por Prisma (queries parametrizadas); las rutas de archivos en Storage usan nombres aleatorios (`randomUUID`), nunca input del usuario.
- **Almacenamiento de archivos:** el bucket de exámenes es privado; los PDF se sirven mediante URLs firmadas de corta duración, nunca URLs públicas.
- **Constraints a nivel de DB:** checks de integridad sobre `email`, `nombre`, `telefono` y `password` además de la validación de aplicación.
- **Headers HTTP:** `helmet` en el backend; CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` en el frontend.
- **CORS:** lista blanca de orígenes (localhost + `FRONTEND_URL`), con patrón regex opcional para previews de Vercel.
- **Rate limiting:** `@nestjs/throttler` global, con límites más estrictos en los endpoints de auth.
- **Escape de HTML** en el contenido dinámico de los emails.
- **Sin fuga de datos sensibles:** las respuestas nunca incluyen el hash de contraseña; los logs no incluyen tokens.

---

## 🗄️ Modelo de datos (Prisma)

| Modelo | Descripción |
|---|---|
| `User` | Tutores y administradores. Campos: nombre, email (único), teléfono, password (hash), rol. |
| `Mascota` | Pertenece a un `User` (tutor). Campos: nombre, tipo, raza, edad. |
| `Examen` | Pertenece a una `Mascota`. Estados: `PENDIENTE`, `EN_PROCESO`, `DISPONIBLE`. Guarda la ruta del PDF en Storage. |
| `Cita` | Pertenece a una `Mascota`. Estados: `PENDIENTE`, `CONFIRMADA`, `COMPLETADA`, `CANCELADA`. Fecha, dirección, servicios. |

Borrado en cascada de exámenes y citas al eliminar la mascota; índices en claves foráneas y campos de filtrado frecuente.

---

## 🌐 API REST (backend)

Base path por recurso:

| Recurso | Endpoints principales |
|---|---|
| `/auth` | `POST /registro`, `POST /login`, `POST /google` |
| `/usuarios` | `GET /tutores` (admin), `PATCH /:id` (perfil), `PATCH /:id/password` |
| `/mascotas` | `POST /`, `GET /`, `GET /:id`, `GET /tutor/:tutorId` |
| `/citas` | `POST /`, `GET /` (admin), `GET /mascota/:mascotaId`, `PATCH /:id/estado` |
| `/examenes` | `POST /`, `GET /`, `GET /:id`, `GET /:id/descargar`, `PATCH /:id/estado`, `POST /:id/subir` |

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
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<service role key>
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM=Silvestra Vet <notificaciones@tu-correo>
```

**`apps/web/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 3. Base de datos

```bash
cd apps/api
npx prisma migrate dev
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
        ├── auth/             # JWT, Google OAuth, guards, roles
        ├── users/            # Tutores y administradores
        ├── pets/             # Mascotas
        ├── exams/            # Exámenes clínicos
        ├── citas/            # Agenda de visitas
        ├── notificaciones.*  # Emails (SendGrid, plantillas HTML)
        ├── supabase.service.ts   # Storage + verificación de tokens de Google
        └── prisma.*          # Acceso a la base de datos

apps/api/prisma/              # Schema y migraciones
```
