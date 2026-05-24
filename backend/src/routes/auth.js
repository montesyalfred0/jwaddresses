import express from 'express';
import { login, me, logout } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validations/schemas.js';
import { authRateLimit } from '../middlewares/rateLimitMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

/** Rutas de autenticación: login, logout, verificar sesión */
const router = express.Router();

router.post('/login', authRateLimit, validate(loginSchema), login);
router.get('/me', authMiddleware, me);
router.post('/logout', logout);

export default router;
