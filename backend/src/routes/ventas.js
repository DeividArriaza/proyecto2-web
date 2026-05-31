import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

export const ventasRouter = Router();

// Listado de ventas con JOIN a Cliente, Empleado, Sucursal y MetodoPago.
ventasRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id_venta,
        v.fecha,
        v.numero_factura,
        v.subtotal,
        v.impuesto,
        v.total,
        v.estado,
        COALESCE(c.nombres || ' ' || c.apellidos, 'Consumidor Final') AS cliente,
        e.nombres || ' ' || e.apellidos                                AS empleado,
        s.nombre                                                       AS sucursal,
        mp.nombre                                                      AS metodo_pago
      FROM Venta v
      LEFT JOIN Cliente    c  ON c.id_cliente      = v.id_cliente
      JOIN      Empleado   e  ON e.id_empleado     = v.id_empleado
      JOIN      Sucursal   s  ON s.id_sucursal     = v.id_sucursal
      JOIN      MetodoPago mp ON mp.id_metodo_pago = v.id_metodo_pago
      ORDER BY v.fecha DESC, v.id_venta DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

ventasRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: cab } = await pool.query(`
      SELECT v.*,
             COALESCE(c.nombres || ' ' || c.apellidos, 'Consumidor Final') AS cliente,
             e.nombres || ' ' || e.apellidos AS empleado,
             s.nombre AS sucursal,
             mp.nombre AS metodo_pago
      FROM Venta v
      LEFT JOIN Cliente    c  ON c.id_cliente      = v.id_cliente
      JOIN      Empleado   e  ON e.id_empleado     = v.id_empleado
      JOIN      Sucursal   s  ON s.id_sucursal     = v.id_sucursal
      JOIN      MetodoPago mp ON mp.id_metodo_pago = v.id_metodo_pago
      WHERE v.id_venta = $1
    `, [req.params.id]);
    if (!cab[0]) return res.status(404).json({ error: 'Venta no encontrada' });

    const { rows: items } = await pool.query(`
      SELECT dv.id_detalle_venta, dv.cantidad, dv.precio_unitario, dv.subtotal,
             p.id_producto, p.sku, p.nombre
      FROM DetalleVenta dv
      JOIN Producto p ON p.id_producto = dv.id_producto
      WHERE dv.id_venta = $1
      ORDER BY dv.id_detalle_venta
    `, [req.params.id]);

    res.json({ ...cab[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /ventas — registra una venta invocando el STORED PROCEDURE
// sp_registrar_venta (params IN + OUT, manejo de excepciones, transacción
// atómica con descuento de stock y MovimientoStock). Rúbrica Cat II.
// Roles permitidos: vendedor (POS) y admin.
// =============================================================================
ventasRouter.post('/', requireAuth, requireRole('admin', 'vendedor'), async (req, res) => {
  const { id_cliente, id_metodo_pago, items } = req.body ?? {};
  const id_empleado = req.session.user.id;
  const id_sucursal = req.session.user.id_sucursal;

  if (!id_metodo_pago) {
    return res.status(400).json({ error: 'id_metodo_pago es requerido' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto' });
  }
  for (const it of items) {
    if (!it.id_producto || !it.cantidad || Number(it.cantidad) <= 0) {
      return res.status(400).json({ error: 'Cada item necesita id_producto y cantidad > 0' });
    }
  }

  // Items normalizados que entiende el SP: [{id_producto, cantidad}, ...]
  const itemsSP = items.map((it) => ({
    id_producto: Number(it.id_producto),
    cantidad: Number(it.cantidad),
  }));

  try {
    const { rows } = await pool.query(
      `SELECT * FROM sp_registrar_venta($1, $2, $3, $4, $5::jsonb)`,
      [id_empleado, id_sucursal, Number(id_metodo_pago), id_cliente || null, JSON.stringify(itemsSP)]
    );
    const { o_id_venta, o_numero_factura, o_total } = rows[0];
    res.status(201).json({
      id_venta: o_id_venta,
      numero_factura: o_numero_factura,
      total: Number(o_total),
    });
  } catch (err) {
    // El SP lanza RAISE EXCEPTION con mensajes de negocio (stock insuficiente,
    // producto inexistente, etc.) → 400. Errores inesperados → 500.
    const negocio = /Stock insuficiente|no existe|inactivo|al menos un producto|Cantidad inválida/i;
    const status = negocio.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// =============================================================================
// POST /ventas/:id/anular — invoca el PROCEDURE sp_anular_venta, que demuestra
// control de transacción EXPLÍCITO (COMMIT / ROLLBACK) dentro del stored
// procedure. Roles permitidos: admin y gerente.
//
// Nota técnica: el PROCEDURE hace COMMIT/ROLLBACK, lo que exige el protocolo
// de consulta simple (sin parámetros bind). Por eso se interpola el id como
// entero ya validado (no hay riesgo de inyección).
// =============================================================================
ventasRouter.post('/:id/anular', requireAuth, requireRole('admin', 'gerente'), async (req, res) => {
  const idVenta = Number(req.params.id);
  const idEmpleado = Number(req.session.user.id);
  if (!Number.isInteger(idVenta) || idVenta <= 0) {
    return res.status(400).json({ error: 'id de venta inválido' });
  }
  try {
    await pool.query(`CALL sp_anular_venta(${idVenta}, ${idEmpleado})`);
    res.json({ ok: true, id_venta: idVenta, estado: 'ANULADA' });
  } catch (err) {
    const negocio = /no existe|ya estaba anulada/i;
    const status = negocio.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});
