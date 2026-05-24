# JW Addresses

Sistema de gestión de direcciones para territorios de predicación. Permite organizar territorios, barrios y direcciones con ubicación GPS, diseñado para dispositivos móviles.

## Stack

```
Frontend     React 18 + Vite + Tailwind CSS + React Router + Leaflet
Backend      Node.js + Express + JWT + Zod
Base datos   PostgreSQL 16
Cache        Redis 7
Proxy SSL    Nginx + Let's Encrypt (Certbot) vía proxy externo
Despliegue   Docker Compose
```

## Arquitectura

```
                         ┌─────────────────┐
                         │   Internet      │
                         │  :80 / :443     │
                         └────────┬────────┘
                                  │
                          ┌───────┴───────┐
                          │  proxy-nginx  │
                          │  (SSL + ACL)  │
                          └───┬───────┬───┘
                              │       │
                     ┌────────┘       └────────┐
                     ▼                          ▼
              ┌──────────────┐          ┌──────────────┐
              │   Frontend   │          │   Backend    │
              │  nginx :80   │          │  express :3000│
              │  (SPA React)  │          │  (API REST)  │
              └──────────────┘          └──────┬───────┘
                                                │
                                       ┌────────┴─────────┐
                                       ▼                   ▼
                               ┌────────────┐     ┌────────────┐
                               │ PostgreSQL │     │   Redis    │
                               │  :5432     │     │  :6379     │
                               └────────────┘     └────────────┘
```

## Requisitos

- Docker y Docker Compose
- Node.js 24 (solo para desarrollo local)
- Dominio con DNS apuntando al servidor (para SSL)

## Instalación

### Local (desarrollo)

```bash
# Clonar
git clone https://github.com/montesyalfred0/jwaddresses.git
cd jwaddresses

# Opción A: Todo con Docker (recomendado)
# Primero crear .env raíz con las credenciales (o copiar de .env.example)
cat > .env << EOF
DB_USER=jwapp
DB_NAME=jwaddresses
DB_PASSWORD=mi_password_segura
REDIS_PASSWORD=mi_redis_password
EOF

# Luego levantar todo
docker compose -f docker-compose.local.yml up -d --build

# Opción B: Solo backend + frontend con Node
cd backend && npm install && cd ../frontend && npm install && cd ..
npm run dev
```

### Producción (Docker)

```bash
# 1. Crear la red externa para el reverse proxy (una sola vez)
docker network create proxy-network

# 2. Configurar reverse proxy (nginx + Let's Encrypt) en la red proxy-network

# 3. Clonar en el servidor
git clone https://github.com/montesyalfred0/jwaddresses.git
cd jwaddresses

# 4. Crear .env (variables para docker-compose)
cat > .env << EOF
DB_USER=jwapp
DB_NAME=jwaddresses
DB_PASSWORD=tu_password_segura
REDIS_PASSWORD=tu_redis_password
EOF

# 5. Crear backend/.env
cp backend/.env.example backend/.env
# Editar JWT_SECRET, DB_PASSWORD y demás variables

# 6. Iniciar todo
docker compose up -d --build
```

La app estará disponible en `https://tu-dominio.com` (requiere reverse proxy con SSL configurado).

### Crear primer usuario

```bash
# 1. Generar el hash de la contraseña (requiere Node.js 24)
node backend/create-user.js usuario contraseña "Nombre Completo"

# 2. Copiar el SQL que imprime el script y ejecutarlo:
docker compose exec postgres psql -U jwapp -d jwaddresses -c "INSERT INTO users (username, password, name) VALUES ('usuario', 'HASH_GENERADO', 'Nombre Completo');"
```

## Variables de entorno

### Root `.env` (para docker-compose)

| Variable | Descripción |
|----------|-------------|
| `DB_USER` | Usuario de PostgreSQL |
| `DB_NAME` | Nombre de la base de datos |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `REDIS_PASSWORD` | Contraseña de Redis |

### `backend/.env`

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `development` |
| `PORT` | Puerto del backend | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de BD | |
| `DB_NAME` | Nombre de BD | |
| `DB_PASSWORD` | Contraseña de BD | |
| `DB_SSL` | Usar SSL para BD | `true` en producción si no es local |
| `JWT_SECRET` | Secreto para firmar tokens (mín 32 chars) | |
| `CORS_ORIGINS` | Orígenes CORS permitidos (separados por coma) | |
| `REDIS_HOST` | Host de Redis | `localhost` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `REDIS_PASSWORD` | Contraseña de Redis | |
| `REDIS_TLS` | Usar TLS para Redis | `true` en producción si no es local |

## API Endpoints

### Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Iniciar sesión |
| GET | `/api/auth/me` | Cookie | Obtener usuario actual |
| POST | `/api/auth/logout` | Cookie | Cerrar sesión |

### Territories

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/territories` | Sí | Listar territorios con barrios |

### Addresses

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/addresses/neighborhood/:id` | Sí | Listar direcciones de un barrio |
| POST | `/api/addresses` | Sí | Crear dirección |

## Estructura del proyecto

```
jwaddresses/
├── .env.example              # Variables de entorno para Docker
├── docker-compose.yml        # Orquestación de servicios (producción)
├── docker-compose.local.yml  # Orquestación local (desarrollo)
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point Express
│   │   ├── config/
│   │   │   ├── database.js   # Pool de PostgreSQL
│   │   │   ├── env.js        # Validación de entorno con Zod
│   │   │   └── redis.js      # Cliente Redis (ioredis)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── addressController.js
│   │   │   └── territoryController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js     # JWT verification
│   │   │   ├── rateLimitMiddleware.js # Rate limiting con Redis
│   │   │   └── validate.js           # Validación Zod
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── addresses.js
│   │   │   └── territories.js
│   │   └── validations/
│   │       └── schemas.js    # Schemas Zod
│   ├── init.sql              # Esquema de base de datos
│   ├── Dockerfile
│   └── create-user.js        # Script local para crear usuarios (no incluido en build Docker)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Router principal
│   │   ├── main.jsx          # Entry point React
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── TerritoryList.jsx
│   │   │   ├── TerritoryDetail.jsx
│   │   │   └── MapPicker.jsx # Selector de ubicación en mapa (Leaflet)
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── services/
│   │       └── api.js        # Axios + interceptors
│   ├── nginx.conf
│   ├── nginx.local.conf
│   └── Dockerfile
└── deploy/
    ├── setup-vps.sh          # Script de aprovisionamiento VPS
    └── nginx-jwaddresses.conf # Config nginx para host (alternativa sin Docker)
```

## Seguridad

- Autenticación con JWT en cookie httpOnly (no accesible desde JS)
- SameSite según entorno (`none` en producción, `lax` en desarrollo)
- Cookie segura solo en producción (HTTPS)
- Helmet para headers de seguridad en API
- Nginx con headers de seguridad (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- CORS whitelist configurable (requiere `Origin` en producción)
- Rate limiting con Redis (200 global / 100 API / 5 login por IP cada 15 min)
- Fallback a memoria si Redis no está disponible
- Validación de datos con Zod en backend y frontend (errores ocultos en producción)
- Validación de variables de entorno al iniciar
- Contraseñas hasheadas con bcrypt (mínimo 8 caracteres)
- SSL/TLS automático con Let's Encrypt vía Traefik
- Redis y PostgreSQL con autenticación
- Mapa con OpenStreetMap y Leaflet (sin API key, sin tracking externo)
- Express actualizado a v4.21+ (CVE-2024-29041 parcheado)

## Licencia

MIT
