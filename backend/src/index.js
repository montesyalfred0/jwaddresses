import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import territoryRoutes from './routes/territories.js';
import addressRoutes from './routes/addresses.js';
import { globalRateLimit, apiRateLimit } from './middlewares/rateLimitMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use(globalRateLimit);
app.use('/api', apiRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/addresses', addressRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
