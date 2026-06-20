# WOT S.A.S. — Catálogo de Productos y Software de Gestión

Este proyecto es una plataforma web completa desarrollada para **WOT S.A.S.** que integra:
1. **Frontend**: Catálogo público de productos con carrito de pedidos vía WhatsApp y un Panel de Administración privado para gestionar inventario, categorías, banners y orden de productos.
2. **Backend**: API REST robusta construida con NestJS, autenticación segura mediante JWT, base de datos PostgreSQL mediante Prisma ORM, y almacenamiento de archivos/imágenes optimizado en DigitalOcean Spaces (S3-compatible).
3. **Contenerización**: Infraestructura Docker lista para desarrollo local y producción.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: Angular v21, TailwindCSS, RxJS.
*   **Backend**: NestJS v10, Prisma ORM, TypeScript.
*   **Base de Datos**: PostgreSQL v16.
*   **Almacenamiento**: DigitalOcean Spaces (S3).
*   **Despliegue**: Docker, Docker Compose, Nginx.

---

## 📂 Estructura del Proyecto

*   `/src`: Código fuente de la aplicación Angular (Frontend).
*   `/backend`: Proyecto NestJS (API Backend).
*   `/nginx.conf`: Configuración del servidor Nginx para producción.
*   `/Dockerfile`: Dockerfile multi-stage para compilar y servir el Frontend.
*   `/docker-compose.yml`: Orquestador de contenedores para producción (DB + API + Frontend).
*   `/docker-compose.dev.yml`: Base de datos de desarrollo local.
*   `/DEPLOY.md`: Guía paso a paso para el despliegue en un VPS de DigitalOcean.

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos previos
*   Node.js v20+ / v24+
*   Docker y Docker Compose

### Paso 1: Base de Datos de Desarrollo
Levanta la base de datos PostgreSQL local en segundo plano:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Paso 2: Configurar y Ejecutar el Backend
1. Entra a la carpeta de backend y configura las variables de entorno:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Instala dependencias y prepara Prisma:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed  # Crea el administrador por defecto (admin@wot.com / Admin123!)
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```
   *La API estará corriendo en `http://localhost:3000/api`*

### Paso 3: Configurar y Ejecutar el Frontend
1. En la raíz del proyecto, instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```
   *La aplicación estará disponible en `http://localhost:4200`*

---

## 🚢 Despliegue en Producción

Para desplegar en producción mediante Docker, consulta la guía detallada en [DEPLOY.md](file:///home/pablo/Escritorio/WOT/DEPLOY.md).

## 🔒 Propiedad Intelectual
El código fuente y toda la arquitectura técnica son propiedad exclusiva de **WOT S.A.S.**
