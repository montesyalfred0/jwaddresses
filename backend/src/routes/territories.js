import express from 'express';
import { getTerritories } from '../controllers/territoryController.js';
import {
  exportAllTerritoriesDocx,
  exportTerritoryByNeighborhoodDocx,
} from '../controllers/exportController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { exportRateLimit } from '../middlewares/rateLimitMiddleware.js';

/** Rutas de territorios: listar con barrios y exportación de direcciones (solo admin) */
const router = express.Router();

/** Valida que el ID de barrio sea un número positivo */
const validateNeighborhoodId = (req, res, next) => {
  const id = parseInt(req.params.neighborhoodId, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid neighborhood ID' });
  }
  next();
};

router.get('/', authMiddleware, getTerritories);

// Nota: las rutas estáticas van antes que las dinámicas
router.get('/export/docx', authMiddleware, adminMiddleware, exportRateLimit, exportAllTerritoriesDocx);
router.get(
  '/from-neighborhood/:neighborhoodId/export/docx',
  authMiddleware,
  adminMiddleware,
  validateNeighborhoodId,
  exportRateLimit,
  exportTerritoryByNeighborhoodDocx
);

export default router;
