# AMAVET — Revisión Técnica Completa

> Generado el 2026-05-11 · Revisión abarca frontend (Next.js) + backend (NestJS) + base de datos (Prisma/PostgreSQL)  
> **Criterio:** No romper la lógica de negocio ni los controles de seguridad ya implementados. Mejorar todo lo demás.

---

## Índice

1. [Seguridad — Análisis completo](#1-seguridad--análisis-completo)
2. [Manejo de errores](#2-manejo-de-errores)
3. [Pruebas (Tests)](#3-pruebas-tests)
4. [Dependencias](#4-dependencias)
5. [Rendimiento](#5-rendimiento)
6. [Backend — NestJS por módulo](#6-backend--nestjs-por-módulo)
7. [Frontend — lib/api.ts](#7-frontend--libapits)
8. [Frontend — login/page.tsx](#8-frontend--loginpagetsx)
9. [Frontend — dashboard/page.tsx](#9-frontend--dashboardpagetsx)
10. [Frontend — dashboard/mascotas/[id]/page.tsx](#10-frontend--dashboardmascotasidpagetsx)
11. [Frontend — dashboard/agendar/page.tsx](#11-frontend--dashboardagendarpagetsx)
12. [Frontend — admin/page.tsx](#12-frontend--adminpagetsx)
13. [Base de datos — schema.prisma](#13-base-de-datos--schemaprisma)
14. [Arquitectura general y deuda técnica](#14-arquitectura-general-y-deuda-técnica)
15. [Plan de implementación priorizado](#15-plan-de-implementación-priorizado)

---

## 1. Seguridad — Análisis completo

### 1.1 Inyección SQL, comandos y path traversal

#### ✅ SQL Injection — Protegido
Todo acceso a la BD usa Prisma ORM con queries parametrizadas. No existe SQL dinámico construido con strings del usuario. Ningún `prisma.$queryRaw` con interpolación directa. **Sin riesgo de SQL injection.**

#### ✅ Command Injection — No aplica
No hay llamadas a `exec`, `spawn`, `child_process` ni `eval` en ningún módulo. **Sin riesgo de command injection.**

#### ⚠️ Path Traversal — Riesgo bajo presente

En `exams.service.ts:56`, la ruta del archivo en Supabase se construye como:
```typescript
const rutaArchivo = `${examen.id}/${randomUUID()}.pdf`;
```
`examen.id` proviene de la BD (UUID controlado), no de input del usuario. La ruta es segura. Sin embargo, en `supabase.service.ts:28`, el parámetro `nombreArchivo` se pasa directamente al SDK de Supabase sin sanitización explícita. Si en el futuro se agrega un endpoint que permita al usuario especificar la ruta, habría riesgo.

**Recomendación:** Agregar validación explícita del formato de `rutaArchivo`:
```typescript
if (!/^[a-f0-9-]+\/[a-f0-9-]+\.pdf$/.test(rutaArchivo)) {
  throw new BadRequestException('Ruta de archivo inválida');
}
```

#### ✅ Input Validation — Bien implementado
Todos los DTOs usan `class-validator` con restricciones explícitas. El `ValidationPipe` global tiene `whitelist: true` y `forbidNonWhitelisted: true`, lo que rechaza cualquier campo no declarado en el DTO.

Ejemplo de buena práctica en `registro.dto.ts`:
- `@Matches(/^\+?[0-9 ()-]+$/)` en teléfono
- `@MaxLength(72)` en password (límite bcrypt)
- `@Transform` con `.trim().toLowerCase()` en email

#### ⚠️ `mascotaId` y `examenId` no validados como UUID en todos los endpoints

En `exams.controller.ts`, los `@Param('id')` y `@Param('mascotaId')` no usan `ParseUUIDPipe`. Solo `users.controller.ts:45` lo usa correctamente. Si se envía un string malformado, Prisma lanza un error genérico de BD en lugar de un 400 controlado.

```typescript
// Aplicar en todos los controllers que reciben IDs:
@Param('id', new ParseUUIDPipe()) id: string
@Param('mascotaId', new ParseUUIDPipe()) mascotaId: string
```

Afecta: `exams.controller.ts`, `pets.controller.ts`, `citas.controller.ts`.

---

### 1.2 Autenticación y autorización

#### ✅ JWT con expiración configurada
`auth.module.ts:19` confirma: `expiresIn: process.env.JWT_EXPIRES_IN ?? '7d'`. Los tokens sí tienen expiración por defecto de 7 días. El issuer `'amavet-api'` está configurado.

#### ✅ Guards aplicados correctamente
- `JwtAuthGuard` en nivel de controller (`@UseGuards(JwtAuthGuard)`) en todos los controllers protegidos.
- `RolesGuard` en endpoints específicos que requieren ADMIN.
- La verificación de propiedad (TUTOR solo ve sus datos) está implementada en todos los controllers.

#### ⚠️ Verificación de rol ADMIN en el cliente es solo UX, no seguridad

En `admin/page.tsx` y en todas las páginas del dashboard, la verificación de sesión se hace leyendo `localStorage` en `useEffect`. Esto es correcto para UX, pero el HTML de la página se renderiza y envía al cliente antes de que se ejecute el `useEffect`. Un usuario sin sesión ve el skeleton de la UI durante ~200ms antes de ser redirigido.

**El backend sí valida el JWT en cada request** — la seguridad real está ahí. El problema es puramente de UX: agregar `middleware.ts` Next.js resuelve el flash de contenido protegido.

#### ⚠️ No hay mecanismo de revocación de tokens

Si un token de 7 días es robado, no hay forma de invalidarlo antes de que expire. No existe blacklist, ni rotación de tokens, ni endpoint de logout que invalide el token en el servidor.

**Recomendación mínima:** Implementar un endpoint `POST /auth/logout` que registre el `jti` (JWT ID) del token en una lista negra en Redis o en BD, y verificarlo en `JwtStrategy.validate()`.

#### ⚠️ Tokens almacenados en `localStorage` — XSS-vulnerable

`localStorage` es accesible desde JavaScript. Si algún script de tercero (npm package comprometido, XSS) se ejecuta en la página, puede leer `token` y `usuario`. 

**Recomendación:** Migrar a cookies `httpOnly; Secure; SameSite=Strict`. Ver sección 14.

---

### 1.3 Datos sensibles en respuestas y logs

#### ✅ Password hash nunca se retorna al cliente
`auth.service.ts` desestructura manualmente: `{ id, nombre, email, rol }` antes de retornar. La contraseña hasheada nunca llega al frontend.

#### ⚠️ `buscarPorId` en `users.service.ts` retorna el hash de contraseña

```typescript
// users.service.ts:40-42
async buscarPorId(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
  // ← retorna password hash incluido
}
```

Si en algún endpoint se usa `buscarPorId` y el resultado se serializa directamente a JSON, el hash se expone. Corregir con `select`:

```typescript
async buscarPorId(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true },
  });
}
```

#### ⚠️ `console.error(err)` en páginas del frontend puede loggear tokens

En `mascotas/[id]/page.tsx:106`:
```typescript
} catch (err) {
  console.error(err); // ← puede loggear el objeto Axios con headers incluyendo Authorization
```

El objeto de error de Axios incluye `config.headers.Authorization` con el Bearer token. Esto aparece en las DevTools de cualquier usuario. Cambiar a loggear solo el mensaje:

```typescript
} catch (err: unknown) {
  const msg = (err as { message?: string }).message ?? 'Error desconocido';
  console.error('[PerfilMascota] Error al cargar:', msg);
}
```

#### ✅ Archivos PDF protegidos con URLs firmadas de expiración 1h
Confirmado en `supabase.service.ts:4`: `SIGNED_URL_TTL_SECONDS = 3600`. Las rutas en BD no son URLs públicas.

---

### 1.4 Criptografía

#### ✅ bcrypt con cost factor 12 — correcto
`BCRYPT_ROUNDS = 12` en `users.service.ts:10`. Estándar adecuado para 2026.

#### ✅ UUID con `crypto.randomUUID()` — correcto
`exams.service.ts:6` usa `import { randomUUID } from 'crypto'` (módulo nativo de Node, criptográficamente seguro).

#### ✅ JWT con secret mínimo 32 caracteres validado en bootstrap
`main.ts:12-14` verifica la longitud antes de arrancar.

#### ⚠️ `ALLOWED_VERCEL_PATTERN` acepta regex arbitrario del entorno

```typescript
// main.ts:53-57
if (new RegExp(allowedVercelPattern).test(origin)) return callback(null, true);
```

Un regex como `.*` aceptaría cualquier origin. Si el `.env` se ve comprometido, un atacante puede abrir el CORS a todos. Considerar validar que el patrón no sea trivialmente permisivo:

```typescript
const pattern = new RegExp(allowedVercelPattern);
if (pattern.source === '.*' || pattern.source === '.+') {
  throw new Error('ALLOWED_VERCEL_PATTERN demasiado permisivo');
}
```

#### ⚠️ Email en `notificaciones.service.ts` construye HTML sin sanitizar

```typescript
html: `<p>El examen de <strong>${nombreMascota}</strong>...`
```

Si `nombreMascota` contiene `<script>alert(1)</script>`, el HTML del email incluye el script. Aunque la mayoría de clientes de email bloquean scripts, algunos renderizan HTML arbitrario.

```typescript
const safe = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
html: `<p>El examen de <strong>${safe(nombreMascota)}</strong>...`
```

---

## 2. Manejo de errores

### 2.1 Backend — Llamadas externas

#### ⚠️ `supabase.service.ts` — Error de subida no incluye contexto suficiente

```typescript
// supabase.service.ts:32
if (error) throw new InternalServerErrorException(`Error al subir archivo: ${error.message}`);
```

El mensaje de error de Supabase se expone directamente al cliente HTTP en producción. Puede revelar detalles internos del bucket o la configuración. Loggear el detalle internamente y retornar un mensaje genérico:

```typescript
if (error) {
  console.error('[SupabaseService] Error subida:', error.message, { nombreArchivo });
  throw new InternalServerErrorException('Error al procesar el archivo. Intenta nuevamente.');
}
```

#### ⚠️ `notificaciones.service.ts` — Transporter sin verificación en init

El transporter se instancia pero nunca se verifica con `transporter.verify()`. Si las credenciales SMTP son incorrectas, el error no se descubre hasta el primer intento de envío real (al subir un PDF):

```typescript
onModuleInit() {
  this.transporter = nodemailer.createTransport({ ... });
  // Verificar conexión en startup (no bloqueante):
  this.transporter.verify().catch(err =>
    console.warn('[NotificacionesService] SMTP no disponible:', err.message)
  );
}
```

#### ✅ `exams.service.ts:71-73` — Fallo de email/URL firmada no interrumpe la subida

El `try/catch` vacío es intencional y correcto: la subida del archivo es la operación principal. El email es secundario.

#### ⚠️ `citas.service.ts` — `crear()` no tiene manejo si `new Date(fecha)` produce `Invalid Date`

Aunque `@IsDateString()` en el DTO valida el formato ISO, si el string pasa la validación pero el `new Date()` falla por alguna razón de zona horaria o formato edge case:

```typescript
const fechaDate = new Date(fecha);
if (isNaN(fechaDate.getTime())) {
  throw new BadRequestException('La fecha proporcionada no es válida');
}
```

#### ✅ Limpieza de recursos — No aplica críticos

No hay manejo de streams de archivos que requieran `close()` explícito. Multer gestiona el buffer en memoria y lo libera automáticamente.

---

### 2.2 Frontend — Llamadas externas

#### ⚠️ `JSON.parse` sin try/catch en 4 páginas

Presente en: `dashboard/page.tsx:72`, `mascotas/[id]/page.tsx:79`, `agendar/page.tsx:69`, `admin/page.tsx:~165`.

Si `localStorage.getItem('usuario')` devuelve un string corrupto, `JSON.parse` lanza `SyntaxError` sin capturar → pantalla blanca completa con error en consola.

**Solución unificada — crear `lib/session.ts`:**

```typescript
// lib/session.ts
export interface SesionUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'TUTOR' | 'ADMIN';
}

export function getSesion(): SesionUsuario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!raw || !token) return null;
    return JSON.parse(raw) as SesionUsuario;
  } catch {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    return null;
  }
}

export function clearSesion() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
}
```

#### ⚠️ Errores de API sin logging estructurado en el frontend

En `agendar/page.tsx:79`: `console.error(err)` loggea el objeto Axios completo. En `dashboard/page.tsx`: los errores de `cargarMascotas` no se loggean en absoluto (solo `setErrorCarga(true)`). Estandarizar a un helper de logging que omita los headers sensibles.

#### ⚠️ `admin/page.tsx` — `cargarDatos` sin `catch` — errores de red silenciosos

```typescript
// Actual:
const cargarDatos = useCallback(async () => {
  try {
    const [mascRes, examRes, citasRes] = await Promise.all([...]);
    // ...
  } finally {            // ← sin catch
    setCargando(false);
  }
}, []);
```

Si `Promise.all` falla, `setCargando(false)` se ejecuta pero todos los arrays quedan vacíos. El panel muestra "0 mascotas, 0 exámenes" como si la BD estuviera vacía, sin ningún mensaje de error.

---

## 3. Pruebas (Tests)

### 3.1 Estado actual de la cobertura — Crítico

| Archivo de spec | Tipo | Contenido real |
|---|---|---|
| `auth.controller.spec.ts` | Unit | Solo `expect(controller).toBeDefined()` |
| `auth.service.spec.ts` | Unit | **Es una copia del archivo de producción**, no un test |
| `users.service.spec.ts` | Unit | Solo `expect(service).toBeDefined()` |
| `pets.service.spec.ts` | Unit | Solo `expect(service).toBeDefined()` |
| `exams.service.spec.ts` | Unit | **Es una versión desactualizada del service**, no un test |
| `exams.controller.spec.ts` | Unit | Solo `expect(controller).toBeDefined()` |
| `app.e2e-spec.ts` | E2E | Solo verifica `GET /` → "Hello World!" |

**Conclusión: el proyecto tiene 0% de cobertura real de comportamiento.** Los archivos `.spec.ts` existen pero no prueban ninguna lógica de negocio. El test E2E verifica únicamente que el servidor levanta.

### 3.2 Problema crítico en `auth.service.spec.ts`

El archivo contiene el código de producción de `AuthService` en lugar de tests. Esto es un copy-paste erróneo que no falla porque Jest simplemente no encuentra ningún `it()` o `describe()` dentro del `Injectable`. La suite "pasa" sin verificar nada.

### 3.3 Problema crítico en `exams.service.spec.ts`

Contiene una versión anterior del `ExamsService` (sin `NotificacionesService`, con ruta de archivo `${id}-${Date.now()}.pdf` en lugar del UUID seguro). Indica que los specs no se actualizan cuando cambia el código de producción.

### 3.4 Casos de borde sin cobertura — Alta prioridad

**Auth:**
- Login con email inexistente → `UnauthorizedException` (timing-attack defense)
- Login con hash corrupto en BD → `UnauthorizedException`
- Registro con email duplicado → `ConflictException`
- Registro con contraseña < 8 chars → `BadRequestException`
- JWT expirado → `UnauthorizedException` en endpoints protegidos

**Exámenes:**
- Subir PDF a examen inexistente → `NotFoundException`
- Subir archivo no-PDF → `BadRequestException`
- Tutor accediendo a examen de otro tutor → `ForbiddenException`
- `actualizarEstado` con ID inexistente → debe retornar 404, actualmente lanza error de BD

**Citas:**
- Crear cita con fecha en el pasado → debe retornar 400 (actualmente no hay validación)
- Tutor cancelando cita ajena → `ForbiddenException`
- Tutor intentando `CONFIRMAR` su cita → `ForbiddenException`

**Mascotas:**
- Tutor accediendo a mascota ajena → `ForbiddenException`
- Crear mascota con `tutorId` de otro usuario (siendo TUTOR) → `ForbiddenException`

### 3.5 Mocks no aislados

Los specs que sí crean el módulo (`auth.controller.spec.ts`) no mockean dependencias. `Test.createTestingModule({ controllers: [AuthController] })` falla silenciosamente porque `AuthService` no está provisto — Jest simplemente no ejecuta el código del controller en ese contexto.

### 3.6 Recomendación mínima de tests a implementar

```typescript
// auth.service.spec.ts — ejemplo de test real mínimo
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { buscarPorEmail: jest.fn(), crear: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
      ],
    }).compile();
    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('login con email inexistente lanza UnauthorizedException y hace bcrypt dummy', async () => {
    usersService.buscarPorEmail.mockResolvedValue(null);
    await expect(service.login('x@x.com', 'pass')).rejects.toThrow(UnauthorizedException);
  });

  it('login exitoso retorna token y datos sin password', async () => {
    const hash = await bcrypt.hash('password123', 10);
    usersService.buscarPorEmail.mockResolvedValue({
      id: 'uuid', email: 'u@u.com', nombre: 'Test', rol: 'TUTOR', password: hash,
    } as any);
    const result = await service.login('u@u.com', 'password123');
    expect(result.token).toBe('token');
    expect(result.usuario).not.toHaveProperty('password');
  });
});
```

---

## 4. Dependencias

### 4.1 Auditoría de paquetes — Backend (`apps/api`)

| Paquete | Versión | Observación |
|---|---|---|
| `@nestjs/common` | ^11.0.1 | ✅ Última major. NestJS 11 estable |
| `@nestjs/jwt` | ^11.0.2 | ✅ Alineado con NestJS 11 |
| `@nestjs/throttler` | ^6.5.0 | ✅ Versión reciente |
| `@prisma/client` | ^7.8.0 | ✅ Última versión disponible |
| `bcryptjs` | ^3.0.3 | ✅ Versión mayor reciente (3.x) |
| `helmet` | ^8.1.0 | ✅ Versión reciente |
| `passport-jwt` | ^4.0.1 | ✅ Sin actividad reciente — librería madura, estable |
| `nodemailer` | ^8.0.7 | ✅ Versión reciente |
| `multer` | ^2.1.1 | ✅ Versión reciente |
| `@supabase/supabase-js` | ^2.105.1 | ✅ Versión reciente |
| `class-validator` | ^0.15.1 | ⚠️ Sin actualizaciones desde 2023. Alternativa: `zod` con `nestjs-zod` |
| `class-transformer` | ^0.5.1 | ⚠️ Sin actualizaciones desde 2022. Mismo mantenedor que `class-validator` |
| `passport` | ^0.7.0 | ⚠️ Ecosistema en decadencia; NestJS lo está desacoplando gradualmente |
| `dotenv` | ^17.4.2 | ⚠️ NestJS 11 + Node 20+ tienen soporte nativo de `.env` con `--env-file`. Dependencia redundante |
| `rxjs` | ^7.8.1 | ✅ Requerido por NestJS internamente |

### 4.2 Auditoría de paquetes — Frontend (`apps/web`)

| Paquete | Versión | Observación |
|---|---|---|
| `next` | 16.2.4 | ✅ Versión reciente de Next.js 16 |
| `react` | 19.2.4 | ✅ React 19 estable |
| `axios` | ^1.15.2 | ✅ Versión reciente |
| `tailwindcss` | ^4 | ✅ Tailwind v4, reciente |

### 4.3 Problemas de licencia

| Paquete | Licencia | Riesgo |
|---|---|---|
| `prisma` (devDep) | Apache-2.0 | ✅ Sin restricciones para uso comercial |
| `helmet` | MIT | ✅ |
| `bcryptjs` | MIT | ✅ |
| `passport` | MIT | ✅ |
| `nodemailer` | MIT | ✅ |
| `class-validator` | MIT | ✅ |

No se detectan conflictos de licencia. El proyecto es `UNLICENSED` (privado), compatible con todas las dependencias MIT/Apache.

### 4.4 Dependencia faltante recomendada

```json
// apps/api — agregar para sanitización de HTML en emails:
"sanitize-html": "^2.13.0"

// apps/api — agregar para logging estructurado (opcional pero recomendado):
"pino": "^9.0.0",
"pino-http": "^10.0.0"
```

### 4.5 Versión de Node no declarada

Ningún `package.json` tiene el campo `engines`. En un monorepo de producción, esto permite que el proyecto se instale con Node 16 o 18, donde algunas APIs como `crypto.randomUUID()` o `structuredClone()` pueden no estar disponibles.

```json
// Agregar en package.json raíz:
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

---

## 5. Rendimiento

### 5.1 Patrón N+1 — Backend

#### ⚠️ `exams.controller.ts:44-56` — N+1 implícito en autorización de TUTOR

```typescript
// Para cada llamada a listarPorMascota como TUTOR:
const examenes = await this.examsService.listarPorMascota(mascotaId);  // Query 1
const ajeno = examenes.some((e) => e.mascota.tutorId !== req.user.userId); // usa datos del include
```

`listarPorMascota` hace `include: { mascota: true }` que trae la mascota de cada examen. Si hay 50 exámenes, Prisma hace 1 query con JOIN. Sin embargo, si se cambia a `select` sin el include, la verificación de autorización falla. La solución es verificar la propiedad de la mascota una sola vez antes de listar:

```typescript
@Get('mascota/:mascotaId')
async listarPorMascota(@Req() req, @Param('mascotaId', ParseUUIDPipe) mascotaId: string) {
  if (req.user.rol !== 'ADMIN') {
    // Una sola query de verificación
    const mascota = await this.petsService.buscarPorId(mascotaId);
    if (!mascota || mascota.tutorId !== req.user.userId) {
      throw new ForbiddenException('No tienes acceso a estos exámenes');
    }
  }
  return this.examsService.listarPorMascota(mascotaId); // sin include: { mascota }
}
```

#### ⚠️ `pets.service.ts:27-30` — `listarTodas()` carga todos los exámenes y citas de cada mascota

```typescript
async listarTodas() {
  return this.prisma.mascota.findMany({
    include: { tutor: true, examenes: true }, // ← todos los exámenes sin límite
  });
}
```

Con 100 mascotas × 20 exámenes = 2,000 objetos de examen en memoria, más los datos del tutor repetidos en cada mascota. Para el panel admin esto puede ser lento.

**Recomendación:** Usar `_count` para conteos y paginación server-side:

```typescript
async listarTodas(page = 1, limit = 50) {
  return this.prisma.mascota.findMany({
    skip: (page - 1) * limit,
    take: limit,
    include: {
      tutor: { select: { id: true, nombre: true, email: true, telefono: true } },
      _count: { select: { examenes: true, citas: true } },
    },
    orderBy: { creadoEn: 'desc' },
  });
}
```

#### ⚠️ `citas.service.ts:24-28` — `listarTodas()` sin paginación ni límite

```typescript
async listarTodas() {
  return this.prisma.cita.findMany({
    include: { mascota: { include: { tutor: true } } },
    orderBy: { fecha: 'asc' },
  });
}
```

Con 500 citas, cada una con mascota y tutor, esto puede retornar MBs de JSON. Sin `take` configurado, Prisma no tiene límite por defecto (retorna todo).

#### ⚠️ `exams.service.ts:30-34` — `listarTodos()` sin paginación

```typescript
async listarTodos() {
  return this.prisma.examen.findMany({
    include: { mascota: { include: { tutor: true } } },
    orderBy: { creadoEn: 'desc' },
  });
}
```

Mismo problema. Todos los exámenes con tutor anidado.

#### ⚠️ `citas.service.ts:55-60` — Query redundante en `esDuenoDeMascota`

Se hace una query completa con `findUnique` + `select: { tutorId }` que carga un objeto solo para comparar un string. Alternativa más eficiente:

```typescript
async esDuenoDeMascota(mascotaId: string, userId: string): Promise<boolean> {
  const count = await this.prisma.mascota.count({
    where: { id: mascotaId, tutorId: userId },
  });
  return count > 0;
}
```

---

### 5.2 Índices faltantes en la base de datos

PostgreSQL no crea índices automáticos en las foreign keys. Todas las queries con `WHERE tutorId = ?`, `WHERE mascotaId = ?` hacen full table scan cuando la tabla crece.

```prisma
model Mascota {
  @@index([tutorId])
  @@index([creadoEn])
}

model Examen {
  @@index([mascotaId])
  @@index([estado])
  @@index([creadoEn])
}

model Cita {
  @@index([mascotaId])
  @@index([fecha])
  @@index([estado])
}
```

Agregar vía migración:
```bash
npx prisma migrate dev --name add_performance_indexes
```

---

### 5.3 Frontend — Recálculos innecesarios en render

#### ⚠️ `mascotas/[id]/page.tsx` — Deduplicación de exámenes en cada render

La lógica de deduplicación (líneas 150-170) y los cálculos de `citasFuturas`/`citasPasadas` se ejecutan en cada render del componente. Mover a `useMemo`:

```tsx
const examenesDeduplicados = useMemo(() => {
  if (!mascota) return [];
  const ordenados = [...mascota.examenes].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );
  // ... lógica de deduplicación
  return result;
}, [mascota?.examenes]);

const ahora = useMemo(() => new Date(), []);
const citasFuturas = useMemo(
  () => citasOrdenadas.filter(c => new Date(c.fecha) >= ahora && c.estado !== 'CANCELADA'),
  [citasOrdenadas, ahora]
);
```

#### ⚠️ `dashboard/agendar/page.tsx` — `cargarMascotas` no está en `useCallback`

La función `cargarMascotas` se declara sin `useCallback`, lo que la recrea en cada render. Como se usa en el `useEffect`, eslint exhaustive-deps la marcará como dependencia no estable.

#### ⚠️ Tokens CSS duplicados en 4 páginas (`--d-bg`, `--d-green-deep`, etc.)

Cada página incluye un bloque `<style jsx>` con ~40 variables CSS idénticas. El browser reprocesa estos estilos en cada navegación client-side. Mover a `globals.css` reduce el tamaño del bundle y mejora el tiempo de primer paint.

---

### 5.4 Supabase — TTL de URL firmada

`SIGNED_URL_TTL_SECONDS = 3600` (1 hora). Si el usuario abre la página de una mascota, ve el botón de descarga y vuelve 2 horas después para descargar, la URL generada al cargar la página habrá expirado. El flujo correcto es generar la URL firmada **en el momento del click**, no al cargar la lista — lo cual ya es el diseño correcto (llamar a `GET /examenes/:id/descargar` en el click). Confirmar que el frontend implementa esto correctamente (ver bug A2 en sección 15).

---

## 6. Backend — NestJS por módulo

### 6.1 `auth.module.ts`

**✅ JWT con `expiresIn` y `issuer` configurados** — Confirmado. El token expira en `JWT_EXPIRES_IN` (por defecto `7d`) con issuer `'amavet-api'`.

**⚠️ `forwardRef(() => UsersModule)` puede indicar dependencia circular**

`forwardRef` es necesario solo cuando hay dependencia circular. Revisar si `UsersModule` también importa `AuthModule`. Si no hay circular dependency real, eliminar `forwardRef` simplifica el grafo de módulos.

### 6.2 `auth.service.ts`

**⚠️ `registro()` retorna el objeto User completo de `usersService.crear()`**

`crear()` en `users.service.ts` retorna el modelo Prisma completo (incluyendo `password`). Aunque `auth.service.ts` desestructura `{ id, nombre, email, rol }`, si se refactoriza descuidadamente, el hash podría escapar. Usar `select` en Prisma es más seguro.

### 6.3 `exams.controller.ts`

**⚠️ Verificación de propiedad en `listarPorMascota` es O(n) sobre la lista**

```typescript
const ajeno = examenes.some((e) => e.mascota.tutorId !== req.user.userId);
```

Itera todos los exámenes para verificar si alguno pertenece a otro tutor. Si hay 100 exámenes, hace 100 comparaciones. La verificación debería ser sobre la mascota directamente (1 query), no sobre sus exámenes.

**⚠️ `mascotaId` en `@Param` sin `ParseUUIDPipe`**

Afecta: `GET /examenes/mascota/:mascotaId` y `GET /examenes/:id` y `GET /examenes/:id/descargar`.

### 6.4 `pets.controller.ts`

**✅ Verificación de propiedad correcta** — `req.user.userId !== tutorId` en `listarPorTutor`. `req.user.userId !== mascota.tutorId` en `buscarPorId`.

**⚠️ `buscarPorId` retorna `null` en lugar de `404` cuando la mascota no existe**

```typescript
const mascota = await this.petsService.buscarPorId(id);
if (!mascota) return null;  // ← retorna HTTP 200 con body null
```

Debería ser `throw new NotFoundException('Mascota no encontrada')`.

### 6.5 `users.controller.ts`

**✅ `ParseUUIDPipe` correctamente aplicado** en `PATCH /:id`.

**✅ Verificación `userId !== id` correcta** en cambio de contraseña (solo el propio usuario).

**⚠️ `asegurarSelfOAdmin` es una función libre, no un guard reutilizable**

Funciona correctamente, pero si se agrega otro controller que necesite la misma verificación, se duplicará. Considerar convertirla en un guard o decorador.

---

## 7. Frontend — `lib/api.ts`

**[BUG] `localStorage` sin protección SSR**

```typescript
// Rompe en Server Components o getServerSideProps:
const token = localStorage.getItem('token');

// Corregido:
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
}
```

**[MEJORA] No hay interceptor de respuesta para 401**

Cuando el JWT expira, cada request falla con 401. El usuario ve errores genéricos en lugar de ser redirigido a login automáticamente.

```typescript
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

**[MEJORA] Sin timeout configurado** — requests pueden colgar indefinidamente:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});
```

---

## 8. Frontend — `login/page.tsx`

**[MEJORA] `handleChange` no limpia el error de login al escribir**

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (error) setError('');
  setForm({ ...form, [e.target.name]: e.target.value });
};
```

**[MEJORA] No existe flujo "Olvidé mi contraseña"** — gap de usabilidad para producción.

**[MEJORA] Sin `autocomplete="username"` en el campo de email** — los gestores de contraseñas usan este atributo para autocompletar. Cambiar `autoComplete="email"` → `autoComplete="username email"`.

---

## 9. Frontend — `dashboard/page.tsx`

**[BUG] `JSON.parse` sin try/catch** — ver solución en sección 2.2.

**[MEJORA] `crearMascota` no valida client-side antes de enviar**

```typescript
const crearMascota = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!nuevaMascota.nombre.trim()) {
    setErrorMascota('El nombre no puede estar vacío');
    return;
  }
  // ...
};
```

**[OPTIMIZACIÓN] `ANIMAL_ICON` duplicado** — extraer a `lib/utils/animals.ts`.

**[OPTIMIZACIÓN] Tokens CSS `--d-bg`, `--d-green-deep`, etc. duplicados** — mover a `globals.css`.

---

## 10. Frontend — `dashboard/mascotas/[id]/page.tsx`

**[BUG CRÍTICO] El enlace de descarga usa `ex.archivoUrl` directamente como `href`**

`archivoUrl` en la BD almacena la **ruta** en Supabase (`uuid/uuid.pdf`), no una URL pública. El link `<a href={ex.archivoUrl}>` apunta a una ruta relativa inválida. El botón de descarga no funciona.

**Solución correcta:**
```tsx
const descargarExamen = async (examenId: string) => {
  try {
    const res = await api.get(`/examenes/${examenId}/descargar`);
    window.open(res.data.url, '_blank', 'noopener,noreferrer');
  } catch {
    // mostrar toast o error en UI
  }
};

// En JSX — reemplazar el <a> por un <button>:
{ex.archivoUrl && (
  <button
    onClick={() => descargarExamen(ex.id)}
    className="exam-download"
    aria-label="Descargar resultado"
  >
    {/* SVG */}
  </button>
)}
```

**[BUG] `JSON.parse` sin try/catch** (línea 79).

**[BUG] `cargarDatos` con fallback que enmascara errores 403** — ver sección 2.2.

**[OPTIMIZACIÓN] Deduplicación de exámenes y cálculos de fechas en cada render** — mover a `useMemo`.

**[MEJORA] `console.error(err)` puede loggear el Bearer token** (línea 106) — ver sección 1.3.

---

## 11. Frontend — `dashboard/agendar/page.tsx`

**[BUG] `usuario` tipado como `any`** (línea 46) — usar `SesionUsuario` de `lib/session.ts`.

**[BUG] `JSON.parse` sin try/catch** (línea 69).

**[BUG] `err: any` en catch de `confirmar`** (línea 188) — usar `unknown`.

**[MEJORA] Sin validación de longitud mínima en dirección**

```typescript
if (direccion.trim().length < 10) {
  setError('Ingresa una dirección más completa');
  return;
}
```

**[MEJORA] `cargarMascotas` sin manejo visible de error** — el usuario ve pantalla vacía sin saber qué pasó.

**[MEJORA] `cargarMascotas` fuera de `useCallback`** — provoca warning de eslint exhaustive-deps.

**[MEJORA] Horas disponibles hardcodeadas en cliente** — en producción debe venir del backend.

---

## 12. Frontend — `admin/page.tsx`

### Auth y sesión
**[BUG] `JSON.parse` sin try/catch** (~línea 165).  
**[MEJORA] Email de soporte hardcodeado** → `process.env.NEXT_PUBLIC_SUPPORT_EMAIL`.

### Carga de datos
**[BUG] `cargarDatos` sin `catch`** — panel silencioso ante errores de red.  
**[BUG] `cargarDatos()` sin `await`** en 4 funciones async → race conditions.

### Constantes duplicadas
**[MANTENIMIENTO] `SERVICIOS_CON_PDF` / `SERVICIOS_EXAMEN` definido 3 veces** → consolidar en 1.

### Configuración ficticia
**[UX CRÍTICO] Formularios de perfil y contraseña usan `setTimeout` simulando éxito** — conectar a `PATCH /usuarios/:id` y `PATCH /usuarios/:id/password`.

### Datos ficticios en UI
**[UX] "Chrome · Windows 11" hardcodeado** — usar `navigator.userAgent`.  
**[UX] "Buenos días" a cualquier hora** — usar `new Date().getHours()`.

### Bugs menores
**[BUG] `SaveButton`: `type={submit ? 'submit' : 'submit'}`** — siempre es submit, prop sin efecto.  
**[BUG] `emojiMascota` no cubre conejos, aves, tortugas** — unificar con `ANIMAL_ICON` compartido.  
**[UX] `window.confirm()` nativo** — reemplazar por modal React.

### Estructura
**[MANTENIMIENTO] ~1,550 líneas en un solo archivo** — separar en `_components/admin/` por vista.

---

## 13. Base de datos — `schema.prisma`

**[RENDIMIENTO] Sin índices en foreign keys** — PostgreSQL no los crea automáticamente:

```prisma
model Mascota {
  @@index([tutorId])
  @@index([creadoEn])
}
model Examen {
  @@index([mascotaId])
  @@index([estado])
  @@index([creadoEn])
}
model Cita {
  @@index([mascotaId])
  @@index([fecha])
  @@index([estado])
}
```

**[MEJORA] Sin `updatedAt` en ningún modelo** — dificulta debugging y auditoría.

**[MEJORA] Sin política `onDelete` explícita** — si se elimina un `User`, el comportamiento de cascade es indefinido. Definir explícitamente:

```prisma
tutor User @relation(fields: [tutorId], references: [id], onDelete: Cascade)
```

**[CONFUSIÓN] `Examen.archivoUrl` no es una URL sino una ruta** — renombrar a `archivoClave` en futura migración.

**[MEJORA] Sin soft delete** — registros borrados permanentemente. Considerar `eliminadoEn DateTime?` para auditoría.

---

## 14. Arquitectura general y deuda técnica

### 14.1 Middleware de autenticación Next.js (ausente)

No existe `middleware.ts`. La protección de rutas es 100% client-side (`useEffect`). El HTML de páginas protegidas se renderiza y envía al cliente antes de verificar la sesión.

```typescript
// apps/web/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isProtected = /^\/(dashboard|admin)/.test(request.nextUrl.pathname);
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### 14.2 JWT en `localStorage` vs cookies `httpOnly`

**Riesgo actual:** `localStorage` es accesible por cualquier script. XSS = robo de token.  
**Solución:** cookies `httpOnly; Secure; SameSite=Strict` inaccesibles desde JavaScript.

Migración (sin romper lógica de negocio):
1. Backend: `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 3600 * 1000 })` además del JSON actual.
2. Frontend: Axios con `withCredentials: true`. El interceptor deja de leer `localStorage`.
3. Middleware Next.js: lee `request.cookies.get('token')`.
4. Backend `JwtStrategy`: leer también la cookie como fallback si no hay header `Authorization`.

### 14.3 Sin tipos compartidos frontend/backend

Los tipos `Mascota`, `Examen`, `Cita` se definen por separado en cada página. Un campo nuevo en Prisma requiere actualizar ~6 archivos TypeScript manualmente.

**Solución:** Paquete `packages/types` en el monorepo que exporte tipos derivados del schema Prisma.

### 14.4 `next.config.ts` vacío — headers de seguridad ausentes

```typescript
const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }],
};
```

### 14.5 Sin logging estructurado en el backend

`console.log` y `Logger` de NestJS son suficientes para desarrollo, pero en producción se necesita:
- Correlación de requests (request ID)
- Niveles de log diferenciados por ambiente
- Formato JSON para ingestión en Datadog / CloudWatch / Loki

Recomendación: `pino` + `pino-http` para NestJS.

### 14.6 Sin revocación de tokens JWT

Un token robado es válido hasta su expiración (7 días). Implementar:
- `jti` (JWT ID) en el payload al firmar
- Tabla `TokenRevocado` en BD o key en Redis al hacer logout
- Verificación en `JwtStrategy.validate()`

---

## 15. Plan de implementación priorizado

### 🔴 PRIORIDAD ALTA — Bugs que afectan funcionalidad real o seguridad

| # | Tarea | Archivo(s) | Complejidad |
|---|---|---|---|
| A1 | Crear `lib/session.ts` con `getSesion()` que hace `JSON.parse` seguro y usar en las 4 páginas | `dashboard/page.tsx`, `mascotas/[id]/page.tsx`, `agendar/page.tsx`, `admin/page.tsx` | Baja |
| A2 | **Corregir botón descarga de exámenes**: llamar a `GET /examenes/:id/descargar` y abrir la URL firmada | `mascotas/[id]/page.tsx` | Baja |
| A3 | Agregar interceptor 401 en Axios con redirección automática a login | `lib/api.ts` | Baja |
| A4 | Agregar `catch` a `cargarDatos` en admin con mensaje de error visible | `admin/page.tsx` | Baja |
| A5 | Agregar `await` a todas las llamadas de `cargarDatos()` en funciones async del admin | `admin/page.tsx` | Baja |
| A6 | Validar fecha en el pasado en `CitasService.crear()` | `citas.service.ts` | Baja |
| A7 | Corregir `buscarPorId` en `PetsController` — retornar 404 en lugar de 200+null | `pets.controller.ts` | Baja |
| A8 | Aplicar `ParseUUIDPipe` a todos los `@Param('id')` y `@Param('mascotaId')` | `exams.controller.ts`, `pets.controller.ts`, `citas.controller.ts` | Baja |
| A9 | Agregar `select` en `buscarPorId` de `users.service.ts` para no exponer password hash | `users.service.ts` | Baja |
| A10 | Escapar HTML en email de notificaciones | `notificaciones.service.ts` | Baja |

### 🟡 PRIORIDAD MEDIA — Optimizaciones, UX y calidad

| # | Tarea | Archivo(s) | Complejidad |
|---|---|---|---|
| B1 | Conectar formularios de Configuración en admin a la API real (`PATCH /usuarios/:id`) | `admin/page.tsx` | Media |
| B2 | Mover email de soporte a variable de entorno `NEXT_PUBLIC_SUPPORT_EMAIL` | `admin/page.tsx`, `.env.local` | Baja |
| B3 | Crear transporter de nodemailer en `onModuleInit` (no en cada llamada) | `notificaciones.service.ts` | Baja |
| B4 | Agregar `timeout: 15_000` a instancia Axios y protección SSR en interceptor | `lib/api.ts` | Baja |
| B5 | Agregar índices de rendimiento en schema Prisma y generar migración | `schema.prisma` | Baja |
| B6 | Usar `_count` y paginación en `listarTodas()` de mascotas, exámenes y citas | `pets.service.ts`, `exams.service.ts`, `citas.service.ts` | Media |
| B7 | Agregar `updatedAt` a modelos Prisma | `schema.prisma` | Baja |
| B8 | Eliminar `console.error(err)` con objeto Axios completo, reemplazar con logging seguro | `mascotas/[id]/page.tsx`, `agendar/page.tsx` | Baja |
| B9 | Agregar security headers en `next.config.ts` | `next.config.ts` | Baja |
| B10 | Corregir `SaveButton` prop `submit` sin efecto | `admin/page.tsx` | Baja |
| B11 | Validar existencia en `ExamsService.actualizarEstado()` antes de update | `exams.service.ts` | Baja |
| B12 | Verificar propiedad de mascota antes de listar exámenes (no sobre la lista) | `exams.controller.ts` | Baja |

### 🟢 PRIORIDAD BAJA — Refactoring, mantenibilidad y cobertura de tests

| # | Tarea | Archivo(s) | Complejidad |
|---|---|---|---|
| C1 | Centralizar tokens CSS `--d-*` en `globals.css`, eliminar bloques `<style jsx>` duplicados | Todas las páginas | Media |
| C2 | Extraer `ANIMAL_ICON` / `getAnimalIcon` a `lib/utils/animals.ts` | 3 archivos | Baja |
| C3 | Unificar `SERVICIOS_CON_PDF` en una constante en `admin/page.tsx` | `admin/page.tsx` | Baja |
| C4 | Separar vistas del admin en `_components/admin/` | `admin/page.tsx` + 6 archivos nuevos | Alta |
| C5 | Escribir tests unitarios reales para `AuthService` (mínimo 5 casos) | `auth.service.spec.ts` | Media |
| C6 | Escribir tests para `CitasService` y `ExamsService` (casos de autorización) | Specs de citas y exams | Media |
| C7 | Crear `middleware.ts` Next.js para protección server-side de rutas | `middleware.ts` nuevo | Baja |
| C8 | Mover deduplicación de exámenes a `useMemo` en página de mascota | `mascotas/[id]/page.tsx` | Baja |
| C9 | Saludo dinámico según hora en admin | `admin/page.tsx` | Baja |
| C10 | Reemplazar `window.confirm()` por modal React en admin | `admin/page.tsx` | Media |
| C11 | Agregar `engines` a `package.json` para fijar versión de Node | `package.json` raíz | Baja |
| C12 | Evaluar migración de cookies `httpOnly` para JWT | Backend + Frontend | Alta |
| C13 | Implementar revocación de tokens JWT con `jti` | Backend + BD | Alta |
| C14 | Agregar `onDelete: Cascade` explícito en relaciones Prisma | `schema.prisma` | Baja |

---

## Resumen ejecutivo

**El backend está bien construido.** Los controles de seguridad (JWT con expiración, RBAC server-side, bcrypt 12 rounds, rate limiting, URLs firmadas, validación DTOs) son sólidos. Las mejoras son de calidad de código, optimización de queries y un par de bugs de validación.

**El frontend tiene bugs funcionales confirmados:**
1. **El botón de descarga de exámenes no funciona** — `archivoUrl` es una ruta de Supabase, no una URL descargable.
2. **`JSON.parse` sin try/catch en 4 páginas** — un valor corrupto en `localStorage` causa pantalla blanca.
3. **Los formularios de Configuración en admin simulan éxito** — el usuario cree haber cambiado su contraseña.

**La cobertura de tests es 0% real** — todos los archivos `.spec.ts` contienen solo `expect(service).toBeDefined()` o código de producción incorrecto.

**La deuda técnica más urgente** es el interceptor 401 ausente en Axios y la falta de `catch` en `cargarDatos` del admin. Ambos se implementan en menos de 10 líneas cada uno.
