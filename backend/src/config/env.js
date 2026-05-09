import { z } from 'zod';

/** Schema de validación para todas las variables de entorno requeridas */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),

  DB_USER: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_PORT: z.string().regex(/^\d+$/).default('5432'),
  DATABASE_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  CORS_ORIGINS: z.string().optional(),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  DB_SSL: z.string().optional(),
  REDIS_TLS: z.string().optional(),
});

/** Validar variables de entorno al iniciar la app. Sale con código 1 si falla */
export const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    console.log('Environment variables validated successfully');
  } catch (error) {
    console.error('Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
};
