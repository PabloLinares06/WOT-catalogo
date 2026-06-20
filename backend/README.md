# WOT Backend — API REST

Backend de WOT S.A.S. construido con **NestJS**, **Prisma ORM** y **PostgreSQL**. Soporta subida de imágenes a **DigitalOcean Spaces** (S3-compatible).

---

## Requisitos

- Node.js >= 20
- PostgreSQL >= 14
- npm >= 10

---

## Setup inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales reales
```

Variables requeridas:

| Variable              | Descripción                                      |
|-----------------------|--------------------------------------------------|
| `DATABASE_URL`        | URL de conexión PostgreSQL                       |
| `JWT_SECRET`          | Clave secreta para firmar tokens JWT             |
| `JWT_EXPIRES_IN`      | Expiración del token (ej: `7d`, `24h`)           |
| `DO_SPACES_KEY`       | Access Key de DigitalOcean Spaces                |
| `DO_SPACES_SECRET`    | Secret Key de DigitalOcean Spaces                |
| `DO_SPACES_ENDPOINT`  | Endpoint del Space (ej: `https://nyc3.digitaloceanspaces.com`) |
| `DO_SPACES_BUCKET`    | Nombre del bucket/Space                          |
| `DO_SPACES_CDN_URL`   | URL base del CDN para acceder a las imágenes     |
| `FRONTEND_URL`        | URL del frontend Angular (para CORS)             |
| `PORT`                | Puerto del servidor (default: `3000`)            |

### 3. Generar el cliente Prisma

```bash
npm run prisma:generate
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
```

### 5. Crear usuario administrador inicial

```bash
# Usando el CLI de Prisma Studio para insertar directamente, o
# ejecutar el script de seed (si existe), o usar el endpoint de auth
# temporalmente habilitado para crear el primer admin.
```

---

## Ejecutar en desarrollo

```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000/api`.

---

## Compilar para producción

```bash
npm run build
npm run start:prod
```

---

## Docker

```bash
# Construir imagen
docker build -t wot-backend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env wot-backend
```

---

## Endpoints principales

### Auth
| Método | Ruta              | Auth | Descripción            |
|--------|-------------------|------|------------------------|
| POST   | `/api/auth/login` | —    | Login → accessToken    |

### Categorías
| Método | Ruta                          | Auth  | Descripción            |
|--------|-------------------------------|-------|------------------------|
| GET    | `/api/categories`             | —     | Listar categorías      |
| POST   | `/api/categories`             | Admin | Crear categoría        |
| PATCH  | `/api/categories/:id`         | Admin | Actualizar categoría   |
| PATCH  | `/api/categories/:id/order`   | Admin | Cambiar orden          |
| DELETE | `/api/categories/:id`         | Admin | Eliminar categoría     |

### Productos
| Método | Ruta                                  | Auth  | Descripción                  |
|--------|---------------------------------------|-------|------------------------------|
| GET    | `/api/products`                       | —     | Listar (query: `?active=true`) |
| GET    | `/api/products/:id`                   | —     | Por ID                        |
| GET    | `/api/products/by-reference/:ref`     | —     | Por referencia                |
| POST   | `/api/products`                       | Admin | Crear                        |
| PATCH  | `/api/products/:id`                   | Admin | Actualizar                   |
| PATCH  | `/api/products/reorder`               | Admin | Reordenar en batch            |
| PATCH  | `/api/products/price-by-reference`    | Admin | Actualizar precio             |
| DELETE | `/api/products/:id`                   | Admin | Eliminar                     |

### Banners
| Método | Ruta               | Auth  | Descripción        |
|--------|--------------------|-------|--------------------|
| GET    | `/api/banners`     | —     | Listar banners     |
| POST   | `/api/banners`     | Admin | Crear banner       |
| PATCH  | `/api/banners/:id` | Admin | Actualizar banner  |
| DELETE | `/api/banners/:id` | Admin | Eliminar banner    |

### Upload
| Método | Ruta                | Auth | Body (form-data)                              |
|--------|---------------------|------|-----------------------------------------------|
| POST   | `/api/upload/image` | JWT  | `file`, `reference`, `isExtra?`, `index?`     |

### Stats
| Método | Ruta         | Auth  | Descripción                    |
|--------|--------------|-------|--------------------------------|
| GET    | `/api/stats` | Admin | Totales de productos, etc.     |

---

## Estructura del proyecto

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   ├── auth/
│   ├── categories/
│   ├── products/
│   ├── banners/
│   ├── upload/
│   └── stats/
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Notas de seguridad

- Todos los endpoints de escritura requieren JWT Bearer Token con rol `admin`.
- Las contraseñas se hashean con bcrypt (10 salt rounds).
- El token JWT expira según `JWT_EXPIRES_IN` (default: `7d`).
- Helmet está habilitado para cabeceras de seguridad HTTP.
