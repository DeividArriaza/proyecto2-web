import { Router } from 'express';
import { pool } from '../db.js';

// Catálogos auxiliares (Categoria, Marca) que pueblan los selects de los
// formularios de creación/edición de Producto en la UI.
export const catalogosRouter = Router();

catalogosRouter.get('/categorias', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_categoria, nombre, descripcion FROM Categoria ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

catalogosRouter.get('/marcas', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_marca, nombre, descripcion FROM Marca ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

catalogosRouter.get('/metodos-pago', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_metodo_pago, nombre, activo FROM MetodoPago WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
