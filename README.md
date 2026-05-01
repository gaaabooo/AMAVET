# 🐾 AMAVET - Veterinary Home Service Platform

Plataforma web fullstack para la gestión de servicios de veterinaria a domicilio, enfocada en experiencia de usuario, eficiencia operativa y entrega segura de resultados clínicos.

---

## 🚀 Overview

AMAVET permite:

- Captar clientes mediante una landing optimizada
- Gestionar usuarios (tutores) y sus mascotas
- Administrar exámenes clínicos
- Entregar resultados de forma segura
- Operar un servicio veterinario a domicilio de forma profesional

---

## 🧱 Arquitectura

---

## 🛠️ Tecnologías

### Frontend
- Next.js
- React
- Tailwind CSS
- shadcn/ui

### Backend
- NestJS
- Node.js

### Base de datos
- PostgreSQL
- Prisma ORM

### Infraestructura
- Vercel (frontend)
- AWS S3 / Supabase (archivos)

---

## 📦 Requisitos

- Node.js >= 18
- npm / pnpm / yarn
- PostgreSQL

---

## ⚙️ Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/AMAVET.git
cd AMAVET
npm install
DATABASE_URL="postgresql://user:password@localhost:5432/vet_db"
JWT_SECRET="supersecretkey"
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
npx prisma migrate dev
npx prisma generate
cd apps/api
npm run start:dev
http://localhost:3000
npm run start:dev
npm run build
npm run start:prod
```

## 🧩 Funcionalidades

### 👤 Usuarios
- Registro e inicio de sesión
- Gestión de perfil

### 🐶 Mascotas
- Registro de múltiples mascotas
- Visualización de datos
  
### 🧪 Exámenes
- Estados:
  - Pendiente
  - En proceso
  - Disponible
- Descarga de resultados en PDF
  
### 👩‍⚕️ Panel Admin
- Gestión de mascotas
- Subida de exámenes
- Generación de acceso a resultados
  
### 📲 Landing
- CTA directo a WhatsApp
- Información de servicios
- Estado de disponibilidad
  
### 🔐 Seguridad
- Autenticación con JWT
- Control de roles (usuario / administrador)
- Validación de datos en frontend y backend
- Acceso protegido a resultados clínicos

## 📁 Estructura del proyecto
apps/
 ├── web/
 │    ├── components/
 │    ├── pages/
 │    └── styles/
 │
 └── api/
      ├── src/
      │    ├── auth/
      │    ├── users/
      │    ├── pets/
      │    └── exams/

packages/
 └── db/

 ## 👨‍💻 Autor
- Proyecto enfocado en la digitalización de servicios veterinarios a domicilio, utilizando arquitectura moderna y tecnologías escalables.
