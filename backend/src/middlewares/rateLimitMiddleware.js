import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

const createRateLimit = (options) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: options.max,
    message: { error: options.message || 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: options.prefix || 'rl:'
    })
  });
};

export const globalRateLimit = createRateLimit({
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  prefix: 'rl:global:'
});

export const apiRateLimit = createRateLimit({
  max: 100,
  message: 'API rate limit exceeded. Please try again later.',
  prefix: 'rl:api:'
});

export const authRateLimit = createRateLimit({
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  prefix: 'rl:auth:'
});
