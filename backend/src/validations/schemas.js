import { z } from 'zod';

/** Schema de validación para login */
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

/** Schema de validación para crear/actualizar direcciones */
export const addressSchema = z.object({
  neighborhood_id: z.number().int().positive(),
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  family: z.string().optional(),
  address: z.string().min(1),
  location_string: z.string().min(1, 'GPS location is required'),
});
