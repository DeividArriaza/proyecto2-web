-- =============================================================================
-- Índices explícitos (rúbrica I: ≥2 CREATE INDEX justificados, 5 pts).
--
-- Nota: Postgres ya genera índices automáticos para PRIMARY KEY y UNIQUE
-- (Empleado.username, Producto.sku, Cliente.nit, Proveedor.nit, etc.), así
-- que aquí solo creamos los que NO son automáticos y aceleran consultas
-- reales que ejecuta la app. Cada uno justifica su existencia.
-- =============================================================================

-- (1) Venta.fecha
-- Justificación: los reportes de ventas se filtran y agrupan por rango de
-- fechas ("ventas de la última semana", "comparativo mensual"). Sin índice,
-- cualquier filtro por fecha hace seq scan completo de Venta.
CREATE INDEX idx_venta_fecha
  ON Venta (fecha);

-- (2) DetalleVenta.id_producto
-- Justificación: el reporte "top productos vendidos" agrega DetalleVenta
-- agrupado por id_producto (GROUP BY id_producto, SUM(cantidad)). También
-- las queries que arrancan desde un producto y buscan "¿en qué ventas
-- apareció?" hacen lookup por id_producto. La FK por sí sola no genera
-- índice automático en Postgres.
CREATE INDEX idx_detalle_venta_producto
  ON DetalleVenta (id_producto);

-- (3) MovimientoStock(id_producto, fecha) — índice compuesto
-- Justificación: el historial de stock por producto se consulta como
-- "WHERE id_producto = X ORDER BY fecha DESC". Un índice compuesto
-- en (id_producto, fecha) cubre ambas operaciones de un solo lookup
-- y evita un sort posterior.
CREATE INDEX idx_movimiento_producto_fecha
  ON MovimientoStock (id_producto, fecha DESC);

-- (4) Producto.id_categoria
-- Justificación: el frontend filtra el catálogo por categoría
-- ("ver solo brownies veganos"), y los reportes agrupan ventas por
-- categoría haciendo JOIN Producto→Categoria. Las FKs no generan
-- índice automático en Postgres, así que sin esto el JOIN por
-- id_categoria fuerza seq scan.
CREATE INDEX idx_producto_categoria
  ON Producto (id_categoria);
