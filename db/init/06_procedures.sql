-- =============================================================================
-- Proyecto 3 — Bases de Datos 1 (UVG cc3088)
-- Stored procedures: operaciones críticas del negocio implementadas en el DBMS
-- e invocadas desde el backend (no desde scripts sueltos).
--
-- Resumen (rúbrica Cat II):
--   1. sp_registrar_venta   FUNCTION  — params IN + OUT, manejo de EXCEPTIONS.
--   2. sp_anular_venta      PROCEDURE — transacción explícita con ROLLBACK/COMMIT.
--   3. sp_registrar_compra  FUNCTION  — entrada de inventario por compra.
--   4. sp_ajustar_stock     FUNCTION  — ajuste manual de stock con auditoría.
--   5. sp_total_ventas      FUNCTION  — agregación de ventas para reportes.
--
-- IVA Guatemala = 12%.
-- =============================================================================

-- =============================================================================
-- 1) sp_registrar_venta
--    Registra una venta completa de forma atómica: valida stock (con bloqueo
--    de fila), inserta cabecera + detalle, descuenta stock y deja el rastro en
--    MovimientoStock.
--
--    · Parámetros de ENTRADA: empleado, sucursal, método de pago, cliente
--      (NULL = consumidor final) y los items como JSONB.
--    · Parámetros de SALIDA (OUT): o_id_venta, o_numero_factura, o_total.
--    · Manejo de EXCEPCIONES: cualquier fallo revierte todos los cambios de la
--      función (subtransacción implícita del bloque) y propaga el error con
--      contexto al backend.
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_registrar_venta(
  p_id_empleado     INT,
  p_id_sucursal     INT,
  p_id_metodo_pago  INT,
  p_id_cliente      INT,        -- NULL admitido (venta de mostrador / CF)
  p_items           JSONB,      -- [{"id_producto":1,"cantidad":2}, ...]
  OUT o_id_venta        INT,
  OUT o_numero_factura  TEXT,
  OUT o_total           NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_iva       CONSTANT NUMERIC := 0.12;
  v_item      JSONB;
  v_pid       INT;
  v_cant      INT;
  v_precio    NUMERIC;
  v_stock     INT;
  v_nombre    TEXT;
  v_linesub   NUMERIC;
  v_subtotal  NUMERIC := 0;
  v_impuesto  NUMERIC;
  v_stock_res INT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta debe incluir al menos un producto'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Cabecera provisional: insertamos con totales en 0 para obtener el id_venta
  -- y poder construir el número de factura.
  INSERT INTO Venta (subtotal, impuesto, total, id_cliente, id_empleado, id_sucursal, id_metodo_pago)
  VALUES (0, 0, 0, p_id_cliente, p_id_empleado, p_id_sucursal, p_id_metodo_pago)
  RETURNING id_venta INTO o_id_venta;

  o_numero_factura := 'FV-' || lpad(o_id_venta::text, 6, '0');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid  := (v_item->>'id_producto')::INT;
    v_cant := (v_item->>'cantidad')::INT;

    IF v_cant IS NULL OR v_cant <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el producto %', v_pid
        USING ERRCODE = 'check_violation';
    END IF;

    -- FOR UPDATE: bloquea la fila del producto para evitar carreras de stock
    -- entre ventas concurrentes.
    SELECT precio, stock, nombre
      INTO v_precio, v_stock, v_nombre
    FROM Producto
    WHERE id_producto = v_pid AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe o está inactivo', v_pid
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_stock < v_cant THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, pedido %',
        v_nombre, v_stock, v_cant
        USING ERRCODE = 'check_violation';
    END IF;

    v_linesub  := round(v_precio * v_cant, 2);
    v_subtotal := v_subtotal + v_linesub;

    INSERT INTO DetalleVenta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (o_id_venta, v_pid, v_cant, v_precio, v_linesub);

    UPDATE Producto SET stock = stock - v_cant
    WHERE id_producto = v_pid
    RETURNING stock INTO v_stock_res;

    INSERT INTO MovimientoStock
      (tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal, id_venta)
    VALUES ('SALIDA', v_cant, v_stock_res, 'Salida por venta ' || o_numero_factura,
            v_pid, p_id_empleado, p_id_sucursal, o_id_venta);
  END LOOP;

  v_impuesto := round(v_subtotal * v_iva, 2);
  o_total    := v_subtotal + v_impuesto;

  UPDATE Venta
  SET subtotal = v_subtotal, impuesto = v_impuesto, total = o_total,
      numero_factura = o_numero_factura
  WHERE id_venta = o_id_venta;

EXCEPTION
  WHEN OTHERS THEN
    -- Manejo de excepciones: revierte inserts/updates de esta función y
    -- propaga el error (con su mensaje) hacia el backend.
    RAISE NOTICE 'sp_registrar_venta falló: %', SQLERRM;
    RAISE;
END;
$$;

-- =============================================================================
-- 2) sp_anular_venta  (PROCEDURE con control de transacción EXPLÍCITO)
--    Anula una venta: la marca 'ANULADA' y devuelve el stock de cada línea,
--    dejando movimientos de AJUSTE.
--
--    Demuestra ROLLBACK y COMMIT explícitos dentro de un stored procedure:
--    si la venta YA estaba anulada, el reverso de stock que se hizo es
--    incorrecto, así que se ejecuta ROLLBACK para deshacerlo; en caso normal
--    se confirma con COMMIT.
--
--    Nota: al ser PROCEDURE con control de transacción, se invoca con CALL y
--    SIN envolverlo en una transacción del lado del backend.
-- =============================================================================
CREATE OR REPLACE PROCEDURE sp_anular_venta(
  p_id_venta    INT,
  p_id_empleado INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado_previo TEXT;
  v_numero        TEXT;
  v_sucursal      INT;
  r               RECORD;
  v_stock_res     INT;
BEGIN
  SELECT estado, numero_factura, id_sucursal
    INTO v_estado_previo, v_numero, v_sucursal
  FROM Venta
  WHERE id_venta = p_id_venta;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La venta % no existe', p_id_venta;
  END IF;

  -- Reverso optimista: marcamos anulada y devolvemos stock.
  UPDATE Venta SET estado = 'ANULADA' WHERE id_venta = p_id_venta;

  FOR r IN SELECT id_producto, cantidad FROM DetalleVenta WHERE id_venta = p_id_venta
  LOOP
    UPDATE Producto SET stock = stock + r.cantidad
    WHERE id_producto = r.id_producto
    RETURNING stock INTO v_stock_res;

    INSERT INTO MovimientoStock
      (tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal)
    VALUES ('AJUSTE', r.cantidad, v_stock_res,
            'Reverso por anulación de venta ' || v_numero,
            r.id_producto, p_id_empleado, v_sucursal);
  END LOOP;

  IF v_estado_previo = 'ANULADA' THEN
    -- La venta ya estaba anulada: el reverso anterior fue indebido.
    ROLLBACK;   -- ← ROLLBACK EXPLÍCITO: deshace el reverso de stock.
    RAISE EXCEPTION 'La venta % ya estaba anulada', v_numero;
  END IF;

  COMMIT;       -- ← COMMIT EXPLÍCITO: anulación confirmada.
END;
$$;

-- =============================================================================
-- 3) sp_registrar_compra  (FUNCTION)
--    Registra una compra a proveedor de forma atómica: cabecera + detalle,
--    incrementa stock y deja movimientos de ENTRADA. Maneja excepciones.
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_registrar_compra(
  p_id_proveedor    INT,
  p_id_empleado     INT,
  p_id_sucursal     INT,
  p_numero_factura  TEXT,
  p_items           JSONB,   -- [{"id_producto":1,"cantidad":10,"costo_unitario":5.50}, ...]
  OUT o_id_compra   INT,
  OUT o_total       NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_iva      CONSTANT NUMERIC := 0.12;
  v_item     JSONB;
  v_pid      INT;
  v_cant     INT;
  v_costo    NUMERIC;
  v_linesub  NUMERIC;
  v_subtotal NUMERIC := 0;
  v_impuesto NUMERIC;
  v_stock_res INT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La compra debe incluir al menos un producto'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO CompraProveedor (numero_factura, subtotal, impuesto, total, id_proveedor, id_empleado, id_sucursal)
  VALUES (p_numero_factura, 0, 0, 0, p_id_proveedor, p_id_empleado, p_id_sucursal)
  RETURNING id_compra INTO o_id_compra;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid   := (v_item->>'id_producto')::INT;
    v_cant  := (v_item->>'cantidad')::INT;
    v_costo := (v_item->>'costo_unitario')::NUMERIC;

    IF v_cant IS NULL OR v_cant <= 0 OR v_costo IS NULL OR v_costo < 0 THEN
      RAISE EXCEPTION 'Item inválido en la compra (producto %)', v_pid
        USING ERRCODE = 'check_violation';
    END IF;

    v_linesub  := round(v_costo * v_cant, 2);
    v_subtotal := v_subtotal + v_linesub;

    INSERT INTO DetalleCompra (id_compra, id_producto, cantidad, costo_unitario, subtotal)
    VALUES (o_id_compra, v_pid, v_cant, v_costo, v_linesub);

    UPDATE Producto SET stock = stock + v_cant
    WHERE id_producto = v_pid
    RETURNING stock INTO v_stock_res;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe', v_pid
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    INSERT INTO MovimientoStock
      (tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal, id_compra)
    VALUES ('ENTRADA', v_cant, v_stock_res, 'Entrada por compra ' || COALESCE(p_numero_factura, o_id_compra::text),
            v_pid, p_id_empleado, p_id_sucursal, o_id_compra);
  END LOOP;

  v_impuesto := round(v_subtotal * v_iva, 2);
  o_total    := v_subtotal + v_impuesto;

  UPDATE CompraProveedor
  SET subtotal = v_subtotal, impuesto = v_impuesto, total = o_total
  WHERE id_compra = o_id_compra;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'sp_registrar_compra falló: %', SQLERRM;
    RAISE;
END;
$$;

-- =============================================================================
-- 4) sp_ajustar_stock  (FUNCTION)
--    Ajuste manual de stock (conteo físico, mermas, correcciones). Fija el
--    stock a un valor absoluto y registra el delta en MovimientoStock (AJUSTE).
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_ajustar_stock(
  p_id_producto  INT,
  p_id_empleado  INT,
  p_id_sucursal  INT,
  p_nuevo_stock  INT,
  p_motivo       TEXT,
  OUT o_stock_resultante INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_actual INT;
  v_delta  INT;
BEGIN
  IF p_nuevo_stock < 0 THEN
    RAISE EXCEPTION 'El nuevo stock no puede ser negativo'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT stock INTO v_actual FROM Producto WHERE id_producto = p_id_producto FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto % no existe', p_id_producto
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  v_delta := p_nuevo_stock - v_actual;
  IF v_delta = 0 THEN
    RAISE EXCEPTION 'El stock ya es %; no hay ajuste que registrar', p_nuevo_stock
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE Producto SET stock = p_nuevo_stock WHERE id_producto = p_id_producto;
  o_stock_resultante := p_nuevo_stock;

  INSERT INTO MovimientoStock
    (tipo, cantidad, stock_resultante, motivo, id_producto, id_empleado, id_sucursal)
  VALUES ('AJUSTE', v_delta, p_nuevo_stock,
          COALESCE(p_motivo, 'Ajuste manual de inventario'),
          p_id_producto, p_id_empleado, p_id_sucursal);

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'sp_ajustar_stock falló: %', SQLERRM;
    RAISE;
END;
$$;

-- =============================================================================
-- 5) sp_total_ventas  (FUNCTION de agregación para reportes)
--    Devuelve el número de ventas y el monto total facturado (solo ventas
--    COMPLETADAS) en un rango de fechas. Usado por el endpoint de reportes.
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_total_ventas(
  p_desde DATE,
  p_hasta DATE
)
RETURNS TABLE (
  num_ventas   BIGINT,
  monto_total  NUMERIC,
  ticket_promedio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(v.total), 0)::NUMERIC,
    COALESCE(ROUND(AVG(v.total), 2), 0)::NUMERIC
  FROM Venta v
  WHERE v.estado = 'COMPLETADA'
    AND v.fecha >= p_desde
    AND v.fecha <  (p_hasta + INTERVAL '1 day');
END;
$$;

-- =============================================================================
-- Permisos de ejecución (GRANT/REVOKE sobre los SPs).
-- Por defecto las funciones se conceden a PUBLIC: lo revocamos y concedemos
-- EXECUTE solo a los roles que correspondan a cada operación.
-- =============================================================================
REVOKE EXECUTE ON FUNCTION  sp_registrar_venta(INT,INT,INT,INT,JSONB)            FROM PUBLIC;
REVOKE EXECUTE ON PROCEDURE sp_anular_venta(INT,INT)                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION  sp_registrar_compra(INT,INT,INT,TEXT,JSONB)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION  sp_ajustar_stock(INT,INT,INT,INT,TEXT)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION  sp_total_ventas(DATE,DATE)                           FROM PUBLIC;

GRANT EXECUTE ON FUNCTION  sp_registrar_venta(INT,INT,INT,INT,JSONB)   TO tienda_admin, tienda_vendedor;
GRANT EXECUTE ON PROCEDURE sp_anular_venta(INT,INT)                    TO tienda_admin, tienda_gerente;
GRANT EXECUTE ON FUNCTION  sp_registrar_compra(INT,INT,INT,TEXT,JSONB) TO tienda_admin, tienda_gerente, tienda_bodeguero;
GRANT EXECUTE ON FUNCTION  sp_ajustar_stock(INT,INT,INT,INT,TEXT)      TO tienda_admin, tienda_bodeguero;
GRANT EXECUTE ON FUNCTION  sp_total_ventas(DATE,DATE)                  TO tienda_admin, tienda_gerente, tienda_consulta;
