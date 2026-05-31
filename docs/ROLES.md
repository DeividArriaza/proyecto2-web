# Esquema de roles y permisos — Proyecto 3

La seguridad se define **a nivel del DBMS** (PostgreSQL), no solo en la aplicación.
Se crean **5 roles** con `CREATE ROLE` y permisos granulares mediante `GRANT` /
`REVOKE`. Script fuente: [`db/init/05_roles.sql`](../db/init/05_roles.sql).

Cada rol del DBMS se corresponde **1:1** con un valor de la columna `Rol.grupo`
(tabla de la aplicación). La UI y el backend autorizan por ese `grupo`; los
permisos del motor son la capa de seguridad de fondo.

## Los 5 roles

| Rol DBMS | Grupo (`Rol.grupo`) | Tipo de usuario | Puede |
|---|---|---|---|
| `tienda_admin` | `admin` | Administrador / Soporte | **Todo**: CRUD en todas las tablas. |
| `tienda_gerente` | `gerente` | Gerencia / supervisión | Lee todo; crea y edita catálogo, clientes, proveedores y compras. **No** borra ni edita empleados. |
| `tienda_vendedor` | `vendedor` | Cajero / mostrador (POS) | Lee catálogo y clientes; registra ventas y clientes; descuenta stock. **No** ve empleados ni compras. |
| `tienda_bodeguero` | `bodeguero` | Inventario / cocina | Lee todo; gestiona productos, compras a proveedor y movimientos de stock. **No** vende ni accede a clientes/empleados. |
| `tienda_consulta` | `consulta` | Auditor / contador | **Solo lectura** (reportes). Ninguna escritura. |

## Permisos por tabla y operación

Leyenda: **S**=SELECT · **I**=INSERT · **U**=UPDATE · **D**=DELETE · — = sin acceso.

| Tabla | admin | gerente | vendedor | bodeguero | consulta |
|---|---|---|---|---|---|
| Categoria, Marca | SIUD | SIU | S | SIU | S |
| Producto | SIUD | SIU | S, U(stock) | SIU | S |
| Proveedor | SIUD | SIU | — | SIU | S |
| CompraProveedor, DetalleCompra | SIUD | SIU | — | SIU | S |
| Cliente | SIUD | SIU | SI | — | S |
| Venta, DetalleVenta | SIUD | S | SI | — | S |
| MovimientoStock | SIUD | SIU | I | SIU | S |
| MetodoPago | SIUD | SIU | S | S | S |
| Sucursal, Rol | SIUD | S | S* | S | S |
| Empleado | SIUD | S | — | — | S |

\* `tienda_vendedor` solo tiene `SELECT` sobre `Sucursal` (no sobre `Empleado`).

## Usuarios de prueba (uno por rol)

Sembrados en [`db/init/02_seed.sql`](../db/init/02_seed.sql). Contraseña: **`demo123`**.

| Usuario | Grupo / rol DBMS | Rol de negocio |
|---|---|---|
| `admin_demo` | admin / `tienda_admin` | Administrador |
| `gerente_demo` | gerente / `tienda_gerente` | Gerente General |
| `vendedor_demo` | vendedor / `tienda_vendedor` | Vendedor Mostrador |
| `bodega_demo` | bodeguero / `tienda_bodeguero` | Encargado Bodega |
| `consulta_demo` | consulta / `tienda_consulta` | Auditor |

(El admin histórico `ericka / demo123` sigue funcionando.)

## Cómo verificar que los permisos son reales (DBMS, no app)

Conéctate al contenedor de la base y usa `SET ROLE` para asumir un rol y
comprobar que el motor bloquea lo no permitido:

```bash
docker compose exec db psql -U proy3 -d tienda
```

```sql
-- El vendedor NO puede ver la tabla de empleados (credenciales):
SET ROLE tienda_vendedor;
SELECT * FROM Empleado;          -- ERROR: permission denied for table empleado

-- El auditor NO puede modificar nada:
SET ROLE tienda_consulta;
UPDATE Producto SET precio = 0;  -- ERROR: permission denied for table producto

-- El bodeguero SÍ gestiona inventario pero NO vende:
SET ROLE tienda_bodeguero;
SELECT count(*) FROM Producto;   -- OK
INSERT INTO Venta (subtotal,impuesto,total,id_empleado,id_sucursal,id_metodo_pago)
  VALUES (1,0,1,1,1,1);          -- ERROR: permission denied for table venta

RESET ROLE;                      -- volver a proy3
```
