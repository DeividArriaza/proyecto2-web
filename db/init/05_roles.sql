-- =============================================================================
-- Proyecto 3 — Bases de Datos 1 (UVG cc3088)
-- Seguridad a nivel de DBMS: 5 roles con permisos granulares (GRANT / REVOKE).
--
-- Estos roles VIVEN en el motor PostgreSQL (no son lógica de aplicación). El
-- backend se conecta como `proy3` (superusuario del contenedor) y la
-- autorización de la UI se hace por el `grupo` del empleado; pero los permisos
-- de abajo son reales y se pueden demostrar con `SET ROLE` (ver docs/ROLES.md).
--
-- Los 5 roles se corresponden 1:1 con los valores de Rol.grupo:
--   tienda_admin · tienda_gerente · tienda_vendedor · tienda_bodeguero · tienda_consulta
--
-- Se ejecuta DESPUÉS de 01_schema / 04_views: las tablas y la vista ya existen.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Crear los 5 roles. Son roles de privilegios (NOLOGIN): agrupan permisos,
--    no se usan para iniciar sesión directamente.
-- -----------------------------------------------------------------------------
CREATE ROLE tienda_admin     NOLOGIN;
CREATE ROLE tienda_gerente   NOLOGIN;
CREATE ROLE tienda_vendedor  NOLOGIN;
CREATE ROLE tienda_bodeguero NOLOGIN;
CREATE ROLE tienda_consulta  NOLOGIN;

-- -----------------------------------------------------------------------------
-- 2) Punto de partida explícito: revocar TODO de cada rol y del pseudo-rol
--    PUBLIC, para que nada quede accesible por defecto. A partir de aquí solo
--    se concede lo estrictamente necesario.
-- -----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM tienda_admin, tienda_gerente, tienda_vendedor, tienda_bodeguero, tienda_consulta;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM tienda_admin, tienda_gerente, tienda_vendedor, tienda_bodeguero, tienda_consulta;

-- Todos necesitan poder "ver" el esquema para resolver nombres de tablas.
GRANT USAGE ON SCHEMA public TO tienda_admin, tienda_gerente, tienda_vendedor, tienda_bodeguero, tienda_consulta;

-- =============================================================================
-- tienda_admin — Administrador: control total (CRUD en todo).
-- =============================================================================
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO tienda_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tienda_admin;

-- =============================================================================
-- tienda_gerente — Gerente: ve todo el negocio, gestiona catálogo / clientes /
-- proveedores / compras. NO borra registros (integridad histórica) ni toca
-- credenciales de empleados (solo lectura).
-- =============================================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tienda_gerente;
GRANT INSERT, UPDATE ON
  Categoria, Marca, Producto, Cliente, Proveedor,
  CompraProveedor, DetalleCompra, MovimientoStock, MetodoPago
  TO tienda_gerente;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tienda_gerente;
-- REVOKE explícito: el gerente nunca elimina filas ni modifica empleados.
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM tienda_gerente;
REVOKE INSERT, UPDATE ON Empleado FROM tienda_gerente;

-- =============================================================================
-- tienda_vendedor — Vendedor / cajero (POS): registra ventas y clientes nuevos,
-- consulta catálogo. No gestiona inventario de fondo ni ve empleados.
-- =============================================================================
GRANT SELECT ON
  Producto, vw_producto_detalle, Categoria, Marca, Cliente, MetodoPago, Sucursal
  TO tienda_vendedor;
GRANT INSERT ON Venta, DetalleVenta, Cliente, MovimientoStock TO tienda_vendedor;
GRANT UPDATE (stock) ON Producto TO tienda_vendedor;  -- descuento de stock en la venta
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tienda_vendedor;
-- REVOKE explícito: sin visibilidad de credenciales ni de compras a proveedor.
REVOKE ALL ON Empleado, CompraProveedor, DetalleCompra FROM tienda_vendedor;

-- =============================================================================
-- tienda_bodeguero — Inventario: gestiona productos, compras a proveedor y
-- movimientos de stock. No registra ventas ni accede a clientes.
-- =============================================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tienda_bodeguero;
GRANT INSERT, UPDATE ON
  Producto, Categoria, Marca, Proveedor,
  CompraProveedor, DetalleCompra, MovimientoStock
  TO tienda_bodeguero;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tienda_bodeguero;
-- REVOKE explícito: el bodeguero no vende ni administra clientes/empleados.
REVOKE ALL ON Venta, DetalleVenta, Cliente, Empleado FROM tienda_bodeguero;

-- =============================================================================
-- tienda_consulta — Auditor / consulta: SOLO lectura para reportes. Ninguna
-- escritura en ninguna tabla.
-- =============================================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tienda_consulta;
-- REVOKE explícito (defensa en profundidad): jamás escribe.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM tienda_consulta;

-- -----------------------------------------------------------------------------
-- 3) Dar a proy3 (el login del backend) membresía en los 5 roles, para poder
--    demostrar las restricciones con `SET ROLE <rol>` desde psql.
--    (proy3 es superusuario, así que esto es por claridad/documentación.)
-- -----------------------------------------------------------------------------
GRANT tienda_admin, tienda_gerente, tienda_vendedor, tienda_bodeguero, tienda_consulta TO proy3;
