import { z } from 'zod';

/** Middleware factory que valida el body contra un schema Zod */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Validation failed' });
    }
    return res.status(400).json({ error: error.errors });
  }
};
