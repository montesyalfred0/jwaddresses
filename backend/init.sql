-- Usuarios del sistema (autenticación JWT)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,    -- Nombre de usuario para login
    password VARCHAR(255) NOT NULL,           -- Hash bcrypt
    name VARCHAR(100) NOT NULL,              -- Nombre visible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Territorios (agrupación de barrios)
CREATE TABLE IF NOT EXISTS territories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL               -- Nombre del territorio
);

-- Barrios dentro de un territorio
CREATE TABLE IF NOT EXISTS neighborhoods (
    id SERIAL PRIMARY KEY,
    territory_id INTEGER REFERENCES territories(id) ON DELETE CASCADE,  -- FK al territorio
    name VARCHAR(100) NOT NULL               -- Nombre del barrio
);

-- Direcciones de cada barrio
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    neighborhood_id INTEGER REFERENCES neighborhoods(id) ON DELETE CASCADE,  -- FK al barrio
    name VARCHAR(100) NOT NULL,              -- Nombre de la persona
    age INTEGER,                             -- Edad (opcional)
    family VARCHAR(200),                     -- Datos de familia (opcional)
    address TEXT NOT NULL,                   -- Dirección física/texto
    location_string TEXT,                    -- Enlace a Google Maps (lat,long)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
