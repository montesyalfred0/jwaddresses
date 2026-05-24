import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

const getStore = (prefix) => {
  try {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: prefix || 'rl:',
    });
  } catch {
    console.warn(`Rate limiting: Redis unavailable, using memory store for ${prefix}`);
    return undefined;
  }
};

const createRateLimit = (options) => {
  const store = getStore(options.prefix);

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: options.max,
    message: { error: options.message || 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    ...(store ? { store } : {}),
  });
};

/** Límite global: 200 requests por IP cada 15 minutos */
export const globalRateLimit = createRateLimit({
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  prefix: 'rl:global:'
});

/** Límite para rutas /api: 100 requests por IP cada 15 minutos */
export const apiRateLimit = createRateLimit({
  max: 100,
  message: 'API rate limit exceeded. Please try again later.',
  prefix: 'rl:api:'
});

/** Límite para login: 5 intentos por IP cada 15 minutos */
export const authRateLimit = createRateLimit({
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  prefix: 'rl:auth:'
});
