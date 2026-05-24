import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import territoryRoutes from './routes/territories.js';
import addressRoutes from './routes/addresses.js';
import { globalRateLimit, apiRateLimit } from './middlewares/rateLimitMiddleware.js';
import { validateEnv } from './config/env.js';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Necesario para CORS con cookies
}));

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [];
    if (!origin) {
      return callback(null, true);
    }
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use(globalRateLimit);
app.use('/api', apiRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/addresses', addressRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
