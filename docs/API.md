# API REST — Bubu's Bakery

Base URL: `http://localhost:58082` (cambiar en `.env` mediante `BACKEND_PORT`).

Todas las respuestas son **JSON**. Los endpoints marcados con 🔒 requieren sesión
(cookie `bubus.sid` emitida por `POST /auth/login`). El frontend debe enviar
`credentials: 'include'` en las peticiones.

## Convenciones de respuesta de error

```json
{ "error": "Mensaje legible" }
```

| Código | Significado                                                          |
| ------ | -------------------------------------------------------------------- |
| 200    | OK (lectura, update, delete lógico, login)                           |
| 201    | Created (POST que creó recurso)                                      |
| 400    | Validación fallida o payload inválido                                |
| 401    | No autenticado                                                       |
| 404    | Recurso no encontrado                                                |
| 409    | Conflicto (ej.: SKU/NIT duplicado por constraint UNIQUE)             |
| 500    | Error interno (mensaje genérico, ver logs del backend)               |

---

## Autenticación

### `POST /auth/login`
Inicia sesión.

Request:
```json
{ "username": "ericka", "password": "demo123" }
```
Response 200:
```json
{
  "user": {
    "id": 1, "username": "ericka", "nombres": "Ericka",
    "apellidos": "Sandoval", "rol": "Administrador", "id_rol": 1,
    "sucursal": "Bubu's Bakery", "id_sucursal": 1
  }
}
```
Errores: 400 (campos faltantes), 401 (credenciales inválidas).

### `POST /auth/register`
Crea un empleado nuevo y abre sesión automáticamente. El rol se asigna como
`Vendedor Mostrador` por defecto (no se permite elegir rol desde signup público
para evitar escalación).

Request:
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "55551234",
  "username": "juanp",
  "password": "secreto123",
  "id_sucursal": 1
}
```
Response 201: mismo shape que `/auth/login`.

Errores:
- 400 → validación (campos faltantes, email inválido, password < 6 chars, etc.)
- 409 → username o email ya existen.

### `POST /auth/logout`
Cierra sesión y borra la cookie. → `{ "ok": true }`

### `GET /auth/me`
Devuelve `{ "user": ... | null }`. Útil para rehidratar la sesión en el cliente.

---

## Salud

### `GET /health`
`{ "status": "ok", "db": true }` — comprueba que el backend hace `SELECT 1` contra Postgres.

---

## Productos

### `GET /productos`
Lista todos los productos activos, leyendo de la VIEW `vw_producto_detalle`
(incluye `categoria`, `marca`, `stock_bajo` calculado).

### `GET /productos/bajo-stock`
Solo productos con `stock_bajo = TRUE`, ordenados por déficit.

### `GET /productos/:id`
Producto puntual. 404 si no existe.

### 🔒 `POST /productos`
Crear producto.
```json
{
  "sku": "BRW-099", "nombre": "Brownie nuevo",
  "descripcion": "...", "precio": 25.00,
  "stock": 30, "stock_minimo": 5,
  "id_categoria": 1, "id_marca": 2
}
```
- 201 → producto creado (devuelve fila de `vw_producto_detalle`).
- 400 → validación (sku/nombre vacíos, precio < 0, fk faltante).
- 409 → SKU duplicado.

### 🔒 `PUT /productos/:id`
Editar. Mismo payload que POST.

### 🔒 `DELETE /productos/:id`
Soft delete: `UPDATE Producto SET activo = FALSE`. Preserva FKs de DetalleVenta.

---

## Clientes

### `GET /clientes`
Lista clientes activos.

### `GET /clientes/:id`
Cliente puntual. 404 si no existe.

### 🔒 `POST /clientes`
```json
{
  "nombres": "Ana", "apellidos": "López",
  "nit": "1234567-8", "telefono": "55551234",
  "email": "ana@example.com", "direccion": "Zona 10, Ciudad"
}
```
409 si el NIT ya existe.

### 🔒 `PUT /clientes/:id`
Misma estructura que POST.

### 🔒 `DELETE /clientes/:id`
Soft delete.

---

## Ventas

### 🔒 `GET /ventas`
Últimas 50 ventas con JOIN a Cliente, Empleado, Sucursal y MetodoPago.

### 🔒 `GET /ventas/:id`
Detalle completo (cabecera + items).

### 🔒 `POST /ventas`
Registrar venta. **Transacción explícita con `BEGIN/COMMIT/ROLLBACK`** y
`SELECT ... FOR UPDATE` sobre los productos involucrados para evitar races.

```json
{
  "id_cliente": 3,
  "id_metodo_pago": 1,
  "items": [
    { "id_producto": 5, "cantidad": 2 },
    { "id_producto": 7, "cantidad": 1 }
  ]
}
```

- 201 → `{ id_venta, numero_factura, subtotal, impuesto, total, items: [...] }`.
- 400 → validaciones (items vacío, stock insuficiente, productos inactivos).
  Si falla, el backend hace `ROLLBACK` antes de responder.

`id_empleado` y `id_sucursal` se toman de la sesión.

---

## Catálogos auxiliares

### `GET /categorias`
`[{ "id_categoria", "nombre", "descripcion" }, ...]`

### `GET /marcas`
`[{ "id_marca", "nombre", "descripcion" }, ...]`

### `GET /sucursales`
`[{ "id_sucursal", "nombre", "direccion" }, ...]` — usado en signup.

### `GET /metodos-pago`
`[{ "id_metodo_pago", "nombre", "activo" }, ...]` (sólo activos).

---

## Reportes (endpoints de agregación) — todos 🔒

### `GET /reportes/top-productos`
Top 10 más vendidos. CTE + JOINs.
```json
[{ "id_producto", "sku", "nombre", "categoria", "marca",
   "unidades", "ingresos", "num_ventas" }, ...]
```

### `GET /reportes/ventas-por-sucursal`
GROUP BY + HAVING. Agregaciones por sucursal.
```json
[{ "id_sucursal", "sucursal",
   "num_ventas", "empleados_activos", "metodos_pago_usados",
   "ingresos_totales", "ticket_promedio",
   "primera_venta", "ultima_venta" }, ...]
```

### `GET /reportes/productos-criticos`
Subquery escalar + subquery con `IN`.
```json
[{ "id_producto", "sku", "nombre", "categoria",
   "stock", "stock_minimo", "deficit", "promedio_stock_catalogo" }, ...]
```

### `GET /reportes/clientes-frecuentes`
Subquery correlacionada `EXISTS` + GROUP BY.
```json
[{ "id_cliente", "nombres", "apellidos", "email",
   "total_compras", "total_gastado", "ultima_compra" }, ...]
```

---

## Ejemplos `curl`

```bash
# Login y guardar cookies
curl -c cookies.txt -X POST http://localhost:58082/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ericka","password":"demo123"}'

# Listar productos (público)
curl http://localhost:58082/productos

# Crear cliente (requiere sesión)
curl -b cookies.txt -X POST http://localhost:58082/clientes \
  -H 'Content-Type: application/json' \
  -d '{"nombres":"Ana","apellidos":"López","email":"ana@ex.com"}'

# Reporte agregado
curl -b cookies.txt http://localhost:58082/reportes/top-productos

# Registrar venta (transacción explícita)
curl -b cookies.txt -X POST http://localhost:58082/ventas \
  -H 'Content-Type: application/json' \
  -d '{"id_metodo_pago":1,"items":[{"id_producto":5,"cantidad":2}]}'
```
