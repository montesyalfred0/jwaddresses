import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isLocalDB = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';

const enableSSL = process.env.DB_SSL !== undefined
  ? process.env.DB_SSL === 'true'
  : process.env.NODE_ENV === 'production' && !isLocalDB;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: enableSSL ? { rejectUnauthorized: true } : false
});

export default pool;
