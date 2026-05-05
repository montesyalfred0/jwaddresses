import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Habilitar TLS solo si Redis NO es localhost (producción con Redis remoto)
const isLocalRedis = ['localhost', '127.0.0.1', '::1'].includes(redisConfig.host);
if (process.env.NODE_ENV === 'production' && !isLocalRedis) {
  redisConfig.tls = {};
}

const redisClient = new Redis(redisConfig);

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export default redisClient;
