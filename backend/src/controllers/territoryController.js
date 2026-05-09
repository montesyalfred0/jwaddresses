import pool from '../config/database.js';

/** Obtener todos los territorios con sus barrios anidados */
export const getTerritories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        COALESCE(
          json_agg(
            CASE WHEN n.id IS NOT NULL THEN json_build_object('id', n.id, 'name', n.name) END
          ) FILTER (WHERE n.id IS NOT NULL),
          '[]'
        ) as neighborhoods
      FROM territories t
      LEFT JOIN neighborhoods n ON t.id = n.territory_id
      GROUP BY t.id
      ORDER BY t.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get territories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
