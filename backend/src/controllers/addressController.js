import pool from '../config/database.js';
import { z } from 'zod';
import { addressSchema } from '../validations/schemas.js';

export const getAddresses = async (req, res) => {
  const { neighborhoodId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE neighborhood_id = $1 ORDER BY created_at DESC',
      [neighborhoodId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

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
    res.status(500).json({ error: 'Server error' });
  }
};
