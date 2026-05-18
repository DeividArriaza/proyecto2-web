import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';

export const productosRouter = Router();

// Listado activo: lee de vw_producto_detalle (CREATE VIEW en 04_views.sql).
// La vista encapsula JOIN Producto + Categoria + Marca + flag stock_bajo.
productosRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM vw_producto_detalle
      WHERE activo = TRUE
      ORDER BY id_producto
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productosRouter.get('/bajo-stock', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM vw_producto_detalle
      WHERE activo = TRUE AND stock_bajo = TRUE
      ORDER BY (stock - stock_minimo) ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productosRouter.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vw_producto_detalle WHERE id_producto = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productosRouter.post('/', requireAuth, async (req, res) => {
  const { sku, nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_marca } = req.body ?? {};
  if (!sku?.trim() || !nombre?.trim()) {
    return res.status(400).json({ error: 'sku y nombre son requeridos' });
  }
  if (precio == null || Number(precio) < 0) {
    return res.status(400).json({ error: 'precio debe ser un número >= 0' });
  }
  if (!id_categoria || !id_marca) {
    return res.status(400).json({ error: 'id_categoria e id_marca son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO Producto
        (sku, nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_marca)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_producto
      `,
      [
        sku.trim(),
        nombre.trim(),
        descripcion || null,
        Number(precio),
        Number(stock ?? 0),
        Number(stock_minimo ?? 0),
        Number(id_categoria),
        Number(id_marca),
      ]
    );
    const fresh = await pool.query(
      `SELECT * FROM vw_producto_detalle WHERE id_producto = $1`,
      [rows[0].id_producto]
    );
    res.status(201).json(fresh.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un producto con ese SKU' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Categoría o marca no existen' });
    }
    res.status(500).json({ error: err.message });
  }
});

productosRouter.put('/:id', requireAuth, async (req, res) => {
  const { sku, nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_marca } = req.body ?? {};
  if (!sku?.trim() || !nombre?.trim()) {
    return res.status(400).json({ error: 'sku y nombre son requeridos' });
  }
  if (precio == null || Number(precio) < 0) {
    return res.status(400).json({ error: 'precio debe ser un número >= 0' });
  }
  try {
    const { rowCount } = await pool.query(
      `
      UPDATE Producto SET
        sku           = $1,
        nombre        = $2,
        descripcion   = $3,
        precio        = $4,
        stock         = $5,
        stock_minimo  = $6,
        id_categoria  = $7,
        id_marca      = $8
      WHERE id_producto = $9
      `,
      [
        sku.trim(),
        nombre.trim(),
        descripcion || null,
        Number(precio),
        Number(stock ?? 0),
        Number(stock_minimo ?? 0),
        Number(id_categoria),
        Number(id_marca),
        req.params.id,
      ]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const fresh = await pool.query(
      `SELECT * FROM vw_producto_detalle WHERE id_producto = $1`,
      [req.params.id]
    );
    res.json(fresh.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un producto con ese SKU' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Categoría o marca no existen' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Soft delete: marca activo=FALSE para preservar FKs de DetalleVenta/DetalleCompra.
productosRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE Producto SET activo = FALSE WHERE id_producto = $1`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
