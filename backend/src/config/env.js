import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  
  // Database
  DB_USER: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_PORT: z.string().regex(/^\d+$/).default('5432'),
  DATABASE_URL: z.string().url().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // CORS
  CORS_ORIGINS: z.string().optional(),
  
  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Docker / SSL overrides
  DB_SSL: z.string().optional(),
  REDIS_TLS: z.string().optional(),
});

export const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
};
