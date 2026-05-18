-- =============================================================================
-- Proyecto 2 — Bases de Datos 1 (UVG cc3088)
-- Schema DDL: tienda de inventario y ventas.
-- 14 entidades en 6 bloques, todas las relaciones 1:N.
-- Los N:M Producto<->Compra y Producto<->Venta están resueltos con tablas de
-- detalle. MovimientoStock usa exclusive arc (id_compra XOR id_venta XOR NULL).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bloque 1: Catálogo
-- -----------------------------------------------------------------------------

CREATE TABLE Categoria (
  id_categoria  SERIAL       PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL UNIQUE,
  descripcion   TEXT
);

CREATE TABLE Marca (
  id_marca      SERIAL       PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL UNIQUE,
  descripcion   TEXT
);

CREATE TABLE Producto (
  id_producto     SERIAL         PRIMARY KEY,
  sku             VARCHAR(40)    NOT NULL UNIQUE,
  nombre          VARCHAR(120)   NOT NULL,
  descripcion     TEXT,
  precio          NUMERIC(10,2)  NOT NULL CHECK (precio >= 0),
  stock           INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo    INT            NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo          BOOLEAN        NOT NULL DEFAULT TRUE,
  fecha_creacion  TIMESTAMP      NOT NULL DEFAULT NOW(),
  id_categoria    INT            NOT NULL REFERENCES Categoria(id_categoria),
  id_marca        INT            NOT NULL REFERENCES Marca(id_marca)
);

-- -----------------------------------------------------------------------------
-- Bloque 2: Personas
-- -----------------------------------------------------------------------------

CREATE TABLE Rol (
  id_rol        SERIAL       PRIMARY KEY,
  nombre        VARCHAR(40)  NOT NULL UNIQUE,
  descripcion   TEXT
);

CREATE TABLE Sucursal (
  id_sucursal   SERIAL       PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL UNIQUE,
  direccion     TEXT         NOT NULL,
  telefono      VARCHAR(30),
  activa        BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Credenciales de login viven aquí (no hay tabla Usuario separada).
CREATE TABLE Empleado (
  id_empleado     SERIAL         PRIMARY KEY,
  nombres         VARCHAR(80)    NOT NULL,
  apellidos       VARCHAR(80)    NOT NULL,
  email           VARCHAR(120)   NOT NULL UNIQUE,
  telefono        VARCHAR(30),
  username        VARCHAR(40)    NOT NULL UNIQUE,
  password_hash   VARCHAR(200)   NOT NULL,
  activo          BOOLEAN        NOT NULL DEFAULT TRUE,
  fecha_ingreso   DATE           NOT NULL DEFAULT CURRENT_DATE,
  id_rol          INT            NOT NULL REFERENCES Rol(id_rol),
  id_sucursal     INT            NOT NULL REFERENCES Sucursal(id_sucursal)
);

CREATE TABLE Proveedor (
  id_proveedor  SERIAL        PRIMARY KEY,
  nombre        VARCHAR(120)  NOT NULL,
  nit           VARCHAR(40)   UNIQUE,
  telefono      VARCHAR(30),
  email         VARCHAR(120),
  direccion     TEXT,
  activo        BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE Cliente (
  id_cliente      SERIAL        PRIMARY KEY,
  nombres         VARCHAR(80)   NOT NULL,
  apellidos       VARCHAR(80)   NOT NULL,
  nit             VARCHAR(40)   UNIQUE,
  telefono        VARCHAR(30),
  email           VARCHAR(120),
  direccion       TEXT,
  fecha_registro  TIMESTAMP     NOT NULL DEFAULT NOW(),
  activo          BOOLEAN       NOT NULL DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- Bloque 3: Infraestructura
-- -----------------------------------------------------------------------------

CREATE TABLE MetodoPago (
  id_metodo_pago  SERIAL       PRIMARY KEY,
  nombre          VARCHAR(40)  NOT NULL UNIQUE,
  activo          BOOLEAN      NOT NULL DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- Bloque 4: Compras a proveedor
-- -----------------------------------------------------------------------------

CREATE TABLE CompraProveedor (
  id_compra        SERIAL         PRIMARY KEY,
  fecha            TIMESTAMP      NOT NULL DEFAULT NOW(),
  numero_factura   VARCHAR(60),
  subtotal         NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
  impuesto         NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total            NUMERIC(12,2)  NOT NULL CHECK (total >= 0),
  estado           VARCHAR(20)    NOT NULL DEFAULT 'COMPLETADA'
                     CHECK (estado IN ('COMPLETADA','ANULADA')),
  id_proveedor     INT            NOT NULL REFERENCES Proveedor(id_proveedor),
  id_empleado      INT            NOT NULL REFERENCES Empleado(id_empleado),
  id_sucursal      INT            NOT NULL REFERENCES Sucursal(id_sucursal)
);

CREATE TABLE DetalleCompra (
  id_detalle_compra  SERIAL         PRIMARY KEY,
  id_compra          INT            NOT NULL REFERENCES CompraProveedor(id_compra) ON DELETE CASCADE,
  id_producto        INT            NOT NULL REFERENCES Producto(id_producto),
  cantidad           INT            NOT NULL CHECK (cantidad > 0),
  costo_unitario     NUMERIC(10,2)  NOT NULL CHECK (costo_unitario >= 0),
  subtotal           NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
  UNIQUE (id_compra, id_producto)
);

-- -----------------------------------------------------------------------------
-- Bloque 5: Ventas a cliente
-- -----------------------------------------------------------------------------

CREATE TABLE Venta (
  id_venta         SERIAL         PRIMARY KEY,
  fecha            TIMESTAMP      NOT NULL DEFAULT NOW(),
  numero_factura   VARCHAR(60)    UNIQUE,
  subtotal         NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
  impuesto         NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total            NUMERIC(12,2)  NOT NULL CHECK (total >= 0),
  estado           VARCHAR(20)    NOT NULL DEFAULT 'COMPLETADA'
                     CHECK (estado IN ('COMPLETADA','ANULADA')),
  -- id_cliente es NULLABLE a propósito: soporta ventas de mostrador (CF).
  id_cliente       INT            REFERENCES Cliente(id_cliente),
  id_empleado      INT            NOT NULL REFERENCES Empleado(id_empleado),
  id_sucursal      INT            NOT NULL REFERENCES Sucursal(id_sucursal),
  id_metodo_pago   INT            NOT NULL REFERENCES MetodoPago(id_metodo_pago)
);

CREATE TABLE DetalleVenta (
  id_detalle_venta  SERIAL         PRIMARY KEY,
  id_venta          INT            NOT NULL REFERENCES Venta(id_venta) ON DELETE CASCADE,
  id_producto       INT            NOT NULL REFERENCES Producto(id_producto),
  cantidad          INT            NOT NULL CHECK (cantidad > 0),
  -- Snapshot del precio al momento de la venta: el histórico no se corrompe
  -- si el precio del producto cambia después.
  precio_unitario   NUMERIC(10,2)  NOT NULL CHECK (precio_unitario >= 0),
  subtotal          NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
  UNIQUE (id_venta, id_producto)
);

-- -----------------------------------------------------------------------------
-- Bloque 6: Trazabilidad (audit trail)
-- -----------------------------------------------------------------------------

-- Exclusive arc: id_compra e id_venta son FKs mutuamente excluyentes.
-- ENTRADA exige id_compra, SALIDA exige id_venta, AJUSTE no referencia ninguna.
CREATE TABLE MovimientoStock (
  id_movimiento     SERIAL       PRIMARY KEY,
  fecha             TIMESTAMP    NOT NULL DEFAULT NOW(),
  tipo              VARCHAR(10)  NOT NULL
                      CHECK (tipo IN ('ENTRADA','SALIDA','AJUSTE')),
  cantidad          INT          NOT NULL CHECK (cantidad <> 0),
  stock_resultante  INT          NOT NULL CHECK (stock_resultante >= 0),
  motivo            TEXT,
  id_producto       INT          NOT NULL REFERENCES Producto(id_producto),
  id_empleado       INT          NOT NULL REFERENCES Empleado(id_empleado),
  id_sucursal       INT          NOT NULL REFERENCES Sucursal(id_sucursal),
  id_compra         INT          REFERENCES CompraProveedor(id_compra),
  id_venta          INT          REFERENCES Venta(id_venta),
  CONSTRAINT chk_movimiento_arc CHECK (
    (tipo = 'ENTRADA' AND id_compra IS NOT NULL AND id_venta IS NULL     AND cantidad > 0) OR
    (tipo = 'SALIDA'  AND id_venta  IS NOT NULL AND id_compra IS NULL    AND cantidad > 0) OR
    (tipo = 'AJUSTE'  AND id_compra IS NULL     AND id_venta  IS NULL)
  )
);
