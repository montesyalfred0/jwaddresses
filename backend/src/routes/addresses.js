import express from 'express';
import { getAddresses, createAddress } from '../controllers/addressController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { addressSchema } from '../validations/schemas.js';

/** Rutas de direcciones: listar y crear */
const router = express.Router();

/** Valida que el ID de barrio sea un número positivo */
const validateNeighborhoodId = (req, res, next) => {
  const id = parseInt(req.params.neighborhoodId, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid neighborhood ID' });
  }
  next();
};

router.get('/neighborhood/:neighborhoodId', authMiddleware, validateNeighborhoodId, getAddresses);
router.post('/', authMiddleware, validate(addressSchema), createAddress);

export default router;
