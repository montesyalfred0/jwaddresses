import pool from '../config/database.js';
import { z } from 'zod';
import { addressSchema } from '../validations/schemas.js';

/** Obtener todas las direcciones de un barrio */
export const getAddresses = async (req, res) => {
  const { neighborhoodId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE neighborhood_id = $1 ORDER BY created_at DESC',
      [neighborhoodId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Crear una nueva dirección */
export const createAddress = async (req, res) => {
  try {
    const validated = addressSchema.parse(req.body);
    const { neighborhood_id, name, age, family, address, location_string } = validated;

    const result = await pool.query(
      `INSERT INTO addresses (neighborhood_id, name, age, family, address, location_string)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [neighborhood_id, name, age, family, address, location_string]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Actualizar una dirección existente */
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const validated = addressSchema.parse(req.body);
    const { neighborhood_id, name, age, family, address, location_string } = validated;

    const result = await pool.query(
      `UPDATE addresses SET neighborhood_id = $1, name = $2, age = $3, family = $4, address = $5, location_string = $6
       WHERE id = $7 RETURNING *`,
      [neighborhood_id, name, age, family, address, location_string, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Eliminar una dirección */
export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
