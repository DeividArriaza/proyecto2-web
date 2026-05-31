import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

// =============================================================================
// Compras a proveedor. El registro invoca el STORED PROCEDURE
// sp_registrar_compra (cabecera + detalle + entrada de stock + MovimientoStock,
// atómico y con manejo de excepciones). Roles: admin, gerente, bodeguero.
// =============================================================================
export const comprasRouter = Router();

// Listado de compras con JOIN a Proveedor, Empleado y Sucursal.
comprasRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        cp.id_compra, cp.fecha, cp.numero_factura,
        cp.subtotal, cp.impuesto, cp.total, cp.estado,
        pr.nombre                         AS proveedor,
        e.nombres || ' ' || e.apellidos   AS empleado,
        s.nombre                          AS sucursal
      FROM CompraProveedor cp
      JOIN Proveedor pr ON pr.id_proveedor = cp.id_proveedor
      JOIN Empleado  e  ON e.id_empleado   = cp.id_empleado
      JOIN Sucursal  s  ON s.id_sucursal   = cp.id_sucursal
      ORDER BY cp.fecha DESC, cp.id_compra DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

comprasRouter.post('/', requireAuth, requireRole('admin', 'gerente', 'bodeguero'), async (req, res) => {
  const { id_proveedor, numero_factura, items } = req.body ?? {};
  const id_empleado = req.session.user.id;
  const id_sucursal = req.session.user.id_sucursal;

  if (!id_proveedor) {
    return res.status(400).json({ error: 'id_proveedor es requerido' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto' });
  }
  for (const it of items) {
    if (!it.id_producto || !it.cantidad || Number(it.cantidad) <= 0 || it.costo_unitario == null || Number(it.costo_unitario) < 0) {
      return res.status(400).json({ error: 'Cada item necesita id_producto, cantidad > 0 y costo_unitario >= 0' });
    }
  }

  const itemsSP = items.map((it) => ({
    id_producto: Number(it.id_producto),
    cantidad: Number(it.cantidad),
    costo_unitario: Number(it.costo_unitario),
  }));

  try {
    const { rows } = await pool.query(
      `SELECT * FROM sp_registrar_compra($1, $2, $3, $4, $5::jsonb)`,
      [Number(id_proveedor), id_empleado, id_sucursal, numero_factura?.trim() || null, JSON.stringify(itemsSP)]
    );
    const { o_id_compra, o_total } = rows[0];
    res.status(201).json({ id_compra: o_id_compra, total: Number(o_total) });
  } catch (err) {
    const negocio = /no existe|al menos un producto|Item inválido/i;
    const status = negocio.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});
