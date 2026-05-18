-- =============================================================================
-- Vistas (rúbrica II: ≥1 VIEW utilizado por el backend, 5 pts).
-- =============================================================================

-- vw_producto_detalle
-- Combina Producto con sus dimensiones de catálogo (Categoria, Marca) y
-- agrega el flag derivado `stock_bajo` (true cuando el stock actual cae al
-- nivel mínimo o por debajo). Esta vista la consume el endpoint
-- GET /productos del backend, que sólo hace SELECT * sin repetir el JOIN.
-- Reutilizable por el reporte de "productos en alerta de stock".
CREATE OR REPLACE VIEW vw_producto_detalle AS
SELECT
  p.id_producto,
  p.sku,
  p.nombre,
  p.descripcion,
  p.precio,
  p.stock,
  p.stock_minimo,
  p.activo,
  p.fecha_creacion,
  c.id_categoria,
  c.nombre        AS categoria,
  m.id_marca,
  m.nombre        AS marca,
  (p.stock <= p.stock_minimo) AS stock_bajo
FROM Producto p
JOIN Categoria c ON c.id_categoria = p.id_categoria
JOIN Marca     m ON m.id_marca     = p.id_marca;
