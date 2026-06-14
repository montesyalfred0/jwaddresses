import express from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { addressSchema } from '../validations/schemas.js';

/** Rutas de direcciones: listar, crear, actualizar y eliminar */
const router = express.Router();

/** Valida que el ID de barrio sea un número positivo */
const validateNeighborhoodId = (req, res, next) => {
  const id = parseInt(req.params.neighborhoodId, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid neighborhood ID' });
  }
  next();
};

/** Valida que el ID de dirección sea un número positivo */
const validateAddressId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid address ID' });
  }
  next();
};

router.get('/neighborhood/:neighborhoodId', authMiddleware, validateNeighborhoodId, getAddresses);
router.post('/', authMiddleware, adminMiddleware, validate(addressSchema), createAddress);
router.put('/:id', authMiddleware, adminMiddleware, validateAddressId, validate(addressSchema), updateAddress);
router.delete('/:id', authMiddleware, adminMiddleware, validateAddressId, deleteAddress);

export default router;
