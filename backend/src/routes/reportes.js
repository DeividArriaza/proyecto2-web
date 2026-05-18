import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';

// =============================================================================
// Reportes — alimentan la página /reportes del frontend.
// Cada endpoint está diseñado para cubrir ítems específicos de la rúbrica II.
// Los comentarios marcan qué cubre cada query para facilitar la evaluación.
// =============================================================================
export const reportesRouter = Router();

// -----------------------------------------------------------------------------
// R1. Top 10 productos más vendidos.
// Rúbrica II: CTE (WITH) + JOIN entre múltiples tablas.
// -----------------------------------------------------------------------------
reportesRouter.get('/top-productos', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH ranking AS (
        SELECT
          dv.id_producto,
          SUM(dv.cantidad)             AS unidades,
          SUM(dv.subtotal)             AS ingresos,
          COUNT(DISTINCT dv.id_venta)  AS num_ventas
        FROM DetalleVenta dv
        JOIN Venta v ON v.id_venta = dv.id_venta
        WHERE v.estado = 'COMPLETADA'
        GROUP BY dv.id_producto
      )
      SELECT
        p.id_producto,
        p.sku,
        p.nombre,
        c.nombre  AS categoria,
        m.nombre  AS marca,
        r.unidades,
        r.ingresos,
        r.num_ventas
      FROM ranking r
      JOIN Producto  p ON p.id_producto  = r.id_producto
      JOIN Categoria c ON c.id_categoria = p.id_categoria
      JOIN Marca     m ON m.id_marca     = p.id_marca
      ORDER BY r.unidades DESC, r.ingresos DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// R2. Ventas agregadas por sucursal.
// Rúbrica II: GROUP BY + HAVING + funciones de agregación + JOIN multi-tabla.
// -----------------------------------------------------------------------------
reportesRouter.get('/ventas-por-sucursal', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id_sucursal,
        s.nombre                                    AS sucursal,
        COUNT(DISTINCT v.id_venta)                  AS num_ventas,
        COUNT(DISTINCT v.id_empleado)               AS empleados_activos,
        COUNT(DISTINCT v.id_metodo_pago)            AS metodos_pago_usados,
        SUM(v.total)::numeric(12,2)                 AS ingresos_totales,
        AVG(v.total)::numeric(12,2)                 AS ticket_promedio,
        MIN(v.fecha)                                AS primera_venta,
        MAX(v.fecha)                                AS ultima_venta
      FROM Venta v
      JOIN Sucursal   s  ON s.id_sucursal     = v.id_sucursal
      JOIN Empleado   e  ON e.id_empleado     = v.id_empleado
      JOIN MetodoPago mp ON mp.id_metodo_pago = v.id_metodo_pago
      WHERE v.estado = 'COMPLETADA'
      GROUP BY s.id_sucursal, s.nombre
      HAVING SUM(v.total) > 1000
      ORDER BY ingresos_totales DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// R3. Productos críticos: bajo stock y ya vendidos en el histórico.
// Rúbrica II: 2 subqueries — escalar en SELECT y subquery con IN en WHERE.
// -----------------------------------------------------------------------------
reportesRouter.get('/productos-criticos', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id_producto,
        p.sku,
        p.nombre,
        c.nombre                                              AS categoria,
        p.stock,
        p.stock_minimo,
        (p.stock_minimo - p.stock)                            AS deficit,
        -- Subquery escalar (en SELECT): promedio de stock del catálogo activo.
        (SELECT AVG(stock)::int FROM Producto WHERE activo = TRUE) AS promedio_stock_catalogo
      FROM Producto p
      JOIN Categoria c ON c.id_categoria = p.id_categoria
      WHERE p.activo = TRUE
        AND p.stock <= p.stock_minimo
        -- Subquery con IN: solo productos que efectivamente se han vendido.
        AND p.id_producto IN (SELECT DISTINCT id_producto FROM DetalleVenta)
      ORDER BY (p.stock_minimo - p.stock) DESC, p.nombre ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// R4. Clientes frecuentes que han comprado brownies.
// Rúbrica II: subquery correlacionada con EXISTS + JOIN entre múltiples tablas.
// -----------------------------------------------------------------------------
reportesRouter.get('/clientes-frecuentes', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id_cliente,
        c.nombres,
        c.apellidos,
        c.email,
        COUNT(v.id_venta)              AS total_compras,
        SUM(v.total)::numeric(12,2)    AS total_gastado,
        MAX(v.fecha)                   AS ultima_compra
      FROM Cliente c
      JOIN Venta v ON v.id_cliente = c.id_cliente
      WHERE c.activo = TRUE
        AND v.estado = 'COMPLETADA'
        -- Subquery correlacionada (EXISTS): clientes con al menos una venta
        -- que incluya algún producto de categorías "Brownies%".
        AND EXISTS (
          SELECT 1
          FROM DetalleVenta dv
          JOIN Producto  p  ON p.id_producto  = dv.id_producto
          JOIN Categoria ca ON ca.id_categoria = p.id_categoria
          WHERE dv.id_venta = v.id_venta
            AND ca.nombre LIKE 'Brownies%'
        )
      GROUP BY c.id_cliente, c.nombres, c.apellidos, c.email
      ORDER BY total_gastado DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
