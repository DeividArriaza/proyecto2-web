import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';

export const ventasRouter = Router();

const IVA = 0.12; // 12% IVA Guatemala

// Listado de ventas con JOIN a Cliente, Empleado, Sucursal y MetodoPago.
// (Otra consulta JOIN multi-tabla visible en la UI — rúbrica II.)
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
// POST /ventas — TRANSACCIÓN EXPLÍCITA con BEGIN/COMMIT/ROLLBACK.
// Rúbrica II: 1 transacción explícita con manejo de error y ROLLBACK (12 pts).
//
// La operación de venta es atómica:
//   1) BEGIN
//   2) SELECT ... FOR UPDATE de los productos involucrados (evita race con
//      otras ventas concurrentes que podrían dejar stock negativo)
//   3) Validar stock suficiente para cada item
//   4) INSERT en Venta (cabecera con totales calculados)
//   5) Por cada item: INSERT DetalleVenta + UPDATE Producto.stock +
//      INSERT MovimientoStock (tipo='SALIDA', referenciando la venta)
//   6) COMMIT
//
// Si cualquier paso falla (stock insuficiente, FK inválido, restricción CHECK,
// caída de conexión, etc.) → ROLLBACK y se devuelve el error al frontend.
// =============================================================================
ventasRouter.post('/', requireAuth, async (req, res) => {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ids = items.map((i) => Number(i.id_producto));
    const { rows: productos } = await client.query(
      `
      SELECT id_producto, nombre, precio, stock
      FROM Producto
      WHERE id_producto = ANY($1::int[]) AND activo = TRUE
      FOR UPDATE
      `,
      [ids]
    );
    if (productos.length !== new Set(ids).size) {
      throw new Error('Uno o más productos no existen o están inactivos');
    }
    const productoMap = Object.fromEntries(productos.map((p) => [p.id_producto, p]));

    const lineas = items.map((it) => {
      const p = productoMap[Number(it.id_producto)];
      const cantidad = Number(it.cantidad);
      if (p.stock < cantidad) {
        throw new Error(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock}, pedido: ${cantidad})`);
      }
      const precio_unitario = Number(p.precio);
      const subtotal = +(cantidad * precio_unitario).toFixed(2);
      return { id_producto: p.id_producto, nombre: p.nombre, cantidad, precio_unitario, subtotal };
    });

    const subtotal = +lineas.reduce((s, l) => s + l.subtotal, 0).toFixed(2);
    const impuesto = +(subtotal * IVA).toFixed(2);
    const total    = +(subtotal + impuesto).toFixed(2);

    const { rows: ventaRows } = await client.query(
      `
      INSERT INTO Venta
        (subtotal, impuesto, total, id_cliente, id_empleado, id_sucursal, id_metodo_pago)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_venta, fecha
      `,
      [subtotal, impuesto, total, id_cliente || null, id_empleado, id_sucursal, id_metodo_pago]
    );
    const id_venta = ventaRows[0].id_venta;
    const numero_factura = `FV-${String(id_venta).padStart(6, '0')}`;
    await client.query(
      `UPDATE Venta SET numero_factura = $1 WHERE id_venta = $2`,
      [numero_factura, id_venta]
    );

    for (const linea of lineas) {
      await client.query(
        `
        INSERT INTO DetalleVenta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [id_venta, linea.id_producto, linea.cantidad, linea.precio_unitario, linea.subtotal]
      );

      const { rows: stockRows } = await client.query(
        `UPDATE Producto SET stock = stock - $1 WHERE id_producto = $2 RETURNING stock`,
        [linea.cantidad, linea.id_producto]
      );
      const stock_resultante = stockRows[0].stock;

      await client.query(
        `
        INSERT INTO MovimientoStock
          (tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal, id_venta)
        VALUES ('SALIDA', $1, $2, $3, $4, $5, $6, $7)
        `,
        [linea.cantidad, stock_resultante, `Salida por venta ${numero_factura}`,
         linea.id_producto, id_empleado, id_sucursal, id_venta]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      id_venta,
      numero_factura,
      subtotal,
      impuesto,
      total,
      items: lineas,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});
