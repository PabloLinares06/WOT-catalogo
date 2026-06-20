# Guía de Despliegue — WOT S.A.S.

## Requisitos del VPS
- Ubuntu 22.04 LTS
- Docker + Docker Compose v2
- Mínimo 1 GB RAM (recomendado 2 GB)
- Puerto 80 y 443 abiertos

## Despliegue inicial

### 1. Clonar el repositorio
```bash
git clone <repo-url> /opt/wot
cd /opt/wot
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Completar con las credenciales reales
```

### 3. Configurar variables del backend
```bash
cp backend/.env.example backend/.env
nano backend/.env  # Completar con las mismas credenciales
```

### 4. Primer despliegue
```bash
docker compose up -d --build
```

### 5. Crear las tablas y el primer usuario admin
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run seed
```

> Credenciales por defecto del seed: `admin@wot.com` / `Admin123!`
> **Cambiar la contraseña en el primer login.**

## Actualizaciones (Continuous Deploy)

```bash
git pull origin main
docker compose up -d --build
```

## Backup manual de la base de datos

```bash
docker compose exec db pg_dump -U wot_user wot_db > backup_$(date +%Y%m%d).sql
```

## Ver logs

```bash
docker compose logs -f api      # Logs del backend
docker compose logs -f frontend # Logs del Nginx
docker compose logs -f db       # Logs de PostgreSQL
```

## Desarrollo local

### Solo levantar la base de datos:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Backend:
```bash
cd backend
cp .env.example .env
# Editar .env con: DATABASE_URL=postgresql://wot_user:wot_dev_password@localhost:5432/wot_db
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run start:dev
```

### Frontend:
```bash
npm install
npm start  # ng serve en http://localhost:4200
```
