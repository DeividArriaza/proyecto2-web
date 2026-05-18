import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';

export const clientesRouter = Router();

// Lista clientes activos. Soft delete vía Cliente.activo.
clientesRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id_cliente, nombres, apellidos, nit, telefono, email, direccion,
             fecha_registro, activo
      FROM Cliente
      WHERE activo = TRUE
      ORDER BY id_cliente DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

clientesRouter.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM Cliente WHERE id_cliente = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

clientesRouter.post('/', requireAuth, async (req, res) => {
  const { nombres, apellidos, nit, telefono, email, direccion } = req.body ?? {};
  if (!nombres?.trim() || !apellidos?.trim()) {
    return res.status(400).json({ error: 'nombres y apellidos son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO Cliente (nombres, apellidos, nit, telefono, email, direccion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [nombres.trim(), apellidos.trim(), nit || null, telefono || null, email || null, direccion || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIT' });
    }
    res.status(500).json({ error: err.message });
  }
});

clientesRouter.put('/:id', requireAuth, async (req, res) => {
  const { nombres, apellidos, nit, telefono, email, direccion } = req.body ?? {};
  if (!nombres?.trim() || !apellidos?.trim()) {
    return res.status(400).json({ error: 'nombres y apellidos son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `
      UPDATE Cliente SET
        nombres   = $1,
        apellidos = $2,
        nit       = $3,
        telefono  = $4,
        email     = $5,
        direccion = $6
      WHERE id_cliente = $7
      RETURNING *
      `,
      [nombres.trim(), apellidos.trim(), nit || null, telefono || null, email || null, direccion || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIT' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Soft delete: marca activo=FALSE en lugar de borrar (preserva FKs de Venta).
clientesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE Cliente SET activo = FALSE WHERE id_cliente = $1 RETURNING id_cliente`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
