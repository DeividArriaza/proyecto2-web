# Bubu's Bakery — Proyecto 3 (Bases de Datos 1)

Aplicación web para administrar el inventario y las ventas de **Bubu's Bakery**, una repostería boutique guatemalteca. **Proyecto 3 del curso cc3088 — Bases de Datos 1** (UVG, Ciclo 1 — 2026): extiende el Proyecto 2 agregando **seguridad a nivel de base de datos** (5 roles con permisos granulares), **stored procedures** para las operaciones críticas y el uso de un **ORM (Sequelize)**.

Levanta tres contenedores (PostgreSQL, backend Node/Express, frontend React/Vite) con un solo comando: `docker compose up`. Documentación de la API REST en [`docs/API.md`](docs/API.md), esquema de roles en [`docs/ROLES.md`](docs/ROLES.md) y guía de deploy en [`docs/DEPLOY.md`](docs/DEPLOY.md).

> El frontend usa rutas relativas (`/api/*`). Nginx (dentro del contenedor del frontend) hace `proxy_pass` al backend, así que no hay URLs hardcodeadas en el bundle ni problemas de CORS.

---

## Novedades del Proyecto 3

| Eje | Qué se agregó | Evidencia |
| --- | --- | --- |
| **Seguridad / roles** | 5 roles en el DBMS (`CREATE ROLE` + `GRANT`/`REVOKE` granulares), columna `Rol.grupo`, 5 usuarios de prueba, rutas/vistas protegidas por rol | [`db/init/05_roles.sql`](db/init/05_roles.sql) · [`docs/ROLES.md`](docs/ROLES.md) |
| **Stored procedures** | 5 SPs invocados desde el backend; uno con params IN/OUT + excepciones; uno (PROCEDURE) con `COMMIT`/`ROLLBACK` explícito | [`db/init/06_procedures.sql`](db/init/06_procedures.sql) |
| **ORM** | Sequelize configurado; CRUD de `Cliente` (list/get/create/update/delete) vía ORM | [`backend/src/sequelize.js`](backend/src/sequelize.js) · [`backend/src/routes/clientes.js`](backend/src/routes/clientes.js) |

---

## Stack

| Capa     | Tecnología                                |
| -------- | ----------------------------------------- |
| DB       | PostgreSQL 16 (alpine)                    |
| Backend  | Node 20 + Express 4 + **Sequelize** (ORM) + driver `pg` (SQL crudo para SPs y reportes) |
| Frontend | React 18 + Vite 5 + react-router-dom 6    |
| Auth     | `express-session` + `bcrypt`              |
| Infra    | Docker Compose                            |

El **ORM (Sequelize)** maneja el CRUD de entidades; los **stored procedures** atienden las operaciones críticas (ventas, compras, ajustes) y el **SQL explícito** los reportes avanzados (CTE, GROUP BY/HAVING, subqueries).

---

## Requisitos previos

- Docker y Docker Compose instalados.
- Puerto `58085` libre en el host (configurable vía `FRONTEND_PORT` en `.env`).

---

## Levantar el proyecto

```bash
git clone <url-del-repo>
cd proyecto3-BasesDeDatos
cp .env.example .env
docker compose up --build
```

Cuando los tres servicios estén `healthy/up` (≈ 30 segundos), todo el sitio está accesible bajo el mismo origen:

| Recurso       | URL                                          |
| ------------- | -------------------------------------------- |
| Frontend SPA  | <http://localhost:58085>                     |
| API (proxy)   | <http://localhost:58085/api/health>          |

El **backend y la DB no se exponen al host** — viven en la red interna de Docker. El frontend habla con el API por rutas relativas (`/api/*`) y nginx (dentro del contenedor del frontend) hace `proxy_pass` al backend. Mismo comportamiento en desarrollo y en producción.

Abrí el frontend, va a redirigir automáticamente a `/login`.

### Usuarios de prueba — uno por cada rol del DBMS

Todos con contraseña **`demo123`**. Cada uno cae en un `grupo` distinto (= los 5 roles del DBMS) y ve una UI distinta:

| Usuario | Grupo / rol DBMS | Qué puede hacer en la UI |
| --- | --- | --- |
| `admin_demo` | admin / `tienda_admin` | Todo: catálogo, productos, clientes, ventas, reportes |
| `gerente_demo` | gerente / `tienda_gerente` | Todo menos vender; puede **anular** ventas |
| `vendedor_demo` | vendedor / `tienda_vendedor` | Catálogo, clientes y **registrar ventas** (POS) |
| `bodega_demo` | bodeguero / `tienda_bodeguero` | Catálogo y gestión de **productos/stock** |
| `consulta_demo` | consulta / `tienda_consulta` | Catálogo y **reportes** (solo lectura) |

El admin histórico **`ericka / demo123`** sigue activo. Los 24 empleados del seed también entran con `demo123`.

Detener: `docker compose down` (preserva datos) o `docker compose down -v` (borra el volumen y vuelve a sembrar).

---

## Credenciales (resumen)

### Base de datos (fijas, exigidas por la rúbrica del Proyecto 3)

```
usuario:    proy3
contraseña: secret
db:         tienda
```

### Aplicación

Ver tabla de usuarios de prueba arriba. Resumen: **`<rol>_demo / demo123`** para cada uno de los 5 roles, y `ericka / demo123` como administrador histórico.

---

## Estructura del proyecto

```
.
├── docker-compose.yml         # 3 servicios + red interna + volumen pgdata
├── .env / .env.example         # credenciales y puertos
├── db/
│   ├── Dockerfile              # extiende postgres:16-alpine
│   └── init/                   # cargados en orden alfabético al primer boot
│       ├── 01_schema.sql       # 14 tablas con PK/FK/NOT NULL/CHECK (+ Rol.grupo)
│       ├── 02_seed.sql         # ≥25 reg/tabla + 5 usuarios demo (uno por rol)
│       ├── 03_indexes.sql      # 4 índices justificados
│       ├── 04_views.sql        # vw_producto_detalle (consumida por backend)
│       ├── 05_roles.sql        # ★ 5 roles del DBMS + GRANT/REVOKE granulares
│       └── 06_procedures.sql   # ★ 5 stored procedures (IN/OUT, excepciones, ROLLBACK)
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.js            # bootstrap Express + sesión + CORS + Sequelize
│       ├── db.js               # pool de Postgres (SQL crudo: SPs y reportes)
│       ├── sequelize.js        # ★ ORM: instancia + modelos (Cliente, Categoria, Marca)
│       ├── middleware.js       # cors manual + requireAuth + requireRole
│       └── routes/
│           ├── auth.js         # login / logout / me (bcrypt + sesión + grupo)
│           ├── productos.js    # CRUD + bajo-stock + PATCH stock (sp_ajustar_stock)
│           ├── clientes.js     # ★ CRUD vía ORM (Sequelize)
│           ├── ventas.js       # POST (sp_registrar_venta) + anular (sp_anular_venta)
│           ├── compras.js      # ★ POST (sp_registrar_compra)
│           ├── reportes.js     # total-ventas (SP) + 4 reportes (CTE, GROUP BY, subqueries)
│           └── catalogos.js    # /categorias, /marcas, /metodos-pago
├── frontend/
│   ├── Dockerfile
│   ├── .eslintrc.cjs           # ESLint v8 + plugin-react + react-hooks
│   ├── vite.config.js          # incluye configuración de vitest (jsdom)
│   └── src/
│       ├── App.jsx             # rutas protegidas por rol (RequireRole) + Providers
│       ├── permissions.js      # ★ mapa de permisos por grupo (rutas y acciones)
│       ├── api.js              # fetch con credentials + paleta
│       ├── Layout.jsx          # header + nav filtrado por rol + Modal/banners
│       ├── Ventas.jsx          # carrito (useReducer) + venta + botón Anular por rol
│       ├── ProductosAdmin.jsx / ClientesAdmin.jsx / Catalog.jsx / Reportes.jsx / Login.jsx
│       ├── context/            # AuthContext (sesión+grupo) + CartContext (useReducer)
│       ├── lib/validators.js   # validateProducto / validateCliente
│       └── __tests__/          # 24 tests pasando (reducer, validators, Context, permisos)
└── docs/
    ├── API.md                  # documentación de endpoints REST
    └── ROLES.md                # ★ esquema de roles, permisos y cómo verificarlos
```

---

## Funcionalidades

### Arquitectura
- **API REST con JSON**, sin renderizado en servidor. Frontend y backend separados.
- Documentación de endpoints en [`docs/API.md`](docs/API.md).
- Códigos HTTP consistentes (200/201/400/401/404/409/500) con cuerpo `{ "error": "..." }`.

### Autenticación
- Login y logout con `express-session` (cookie HTTP-only, sameSite lax).
- Las contraseñas en la base están guardadas como hash bcrypt.
- Páginas protegidas redirigen a `/login` si no hay sesión.
- **Estado de sesión expuesto vía `AuthContext`** (`useAuth()`).

### Frontend (React)
- **React Router** con 6 rutas: `/login`, `/`, `/productos`, `/clientes`, `/ventas`, `/reportes`.
- **React Context global**: `AuthContext` (sesión) y `CartContext` (carrito) — Provider en `App.jsx`.
- **`useReducer`** en `CartContext` para el carrito (acciones `ADD_ITEM`, `SET_CANTIDAD`, `REMOVE_ITEM`, `CLEAR`, ...).
- **Hooks combinados**: `useState` + `useEffect` + `useMemo` (filtrado de catálogo, totales) + `useCallback` (handlers).
- **Formularios controlados con validación cliente** (`src/lib/validators.js`) — feedback inline por campo, `role="alert"`, `aria-invalid`.
- **Diseño responsivo** (mobile-first) con `styles.css` y media queries para 768/600/480px. Navbar con hamburger en móvil.

### CRUD
- **Productos**: alta, edición, listado, soft delete. Dropdowns alimentados por `Categoría` y `Marca`.
- **Clientes**: mismo patrón. Soft delete preserva las FKs históricas en `Venta`.

### Ventas
- Catálogo agrega al carrito (`CartContext`), `/ventas` muestra el carrito y registra la operación. El backend ejecuta una **transacción explícita** con `BEGIN/COMMIT/ROLLBACK`.

### Reportes (`/reportes`)
1. **Top productos más vendidos** — endpoint que **agrega datos** (SUM, COUNT, ranking).
2. **Ventas por sucursal** — agregaciones GROUP BY.
3. **Productos críticos** — déficit y promedio del catálogo.
4. **Clientes frecuentes** — compradores recurrentes.

Botones **↓ Exportar CSV** (nativo, RFC 4180 con BOM para Excel) y **⎙ Exportar PDF** (`window.print()` con `@media print`).

### Calidad de código
- **ESLint** configurado (`.eslintrc.cjs`): `npm run lint` pasa con 0 errores.
- **Vitest + React Testing Library**: 24 tests en 4 archivos (`npm test`).
  - `cartReducer.test.js` — 5 tests del reducer puro.
  - `validation.test.js` — 11 tests de los validadores.
  - `CartContext.test.jsx` — render con Provider, totales reactivos.
  - `permissions.test.js` — 7 tests de la autorización por rol.

### Manejo de errores en UI
Banners reutilizables (`ErrorBanner` / `SuccessBanner`) + validación inline por campo. Los errores del backend (por ejemplo, el `ROLLBACK` de la transacción) se muestran al usuario.

---

## Seguridad, stored procedures y ORM (detalle Proyecto 3)

### 5 roles en el DBMS
Definidos con `CREATE ROLE` + permisos granulares (`GRANT`/`REVOKE`) en
[`db/init/05_roles.sql`](db/init/05_roles.sql). Cada uno corresponde a un valor
de `Rol.grupo`. Tabla completa de permisos por tabla/operación en
[`docs/ROLES.md`](docs/ROLES.md):

`tienda_admin` · `tienda_gerente` · `tienda_vendedor` · `tienda_bodeguero` · `tienda_consulta`

Verificar que los permisos son reales (no solo lógica de app):

```bash
docker compose exec db psql -U proy3 -d tienda -c \
  "SET ROLE tienda_consulta; UPDATE Producto SET precio = 0;"
# ERROR: permission denied for table producto
```

### 5 stored procedures (invocados desde el backend)
En [`db/init/06_procedures.sql`](db/init/06_procedures.sql):

| SP | Tipo | Cubre | Invocado en |
| --- | --- | --- | --- |
| `sp_registrar_venta` | FUNCTION | **params IN + OUT** + **manejo de excepciones** | `POST /ventas` |
| `sp_anular_venta` | PROCEDURE | **transacción con `COMMIT`/`ROLLBACK` explícito** | `POST /ventas/:id/anular` |
| `sp_registrar_compra` | FUNCTION | entrada de inventario atómica | `POST /compras` |
| `sp_ajustar_stock` | FUNCTION | ajuste de stock + auditoría | `PATCH /productos/:id/stock` |
| `sp_total_ventas` | FUNCTION | agregación para reportes | `GET /reportes/total-ventas` |

### ORM (Sequelize)
Configurado en [`backend/src/sequelize.js`](backend/src/sequelize.js). El CRUD de
`Cliente` ([`routes/clientes.js`](backend/src/routes/clientes.js)) usa el modelo:
`findAll`, `findByPk`, `create`, `update` y soft-delete — más de 3 operaciones CRUD vía ORM.

---

## Mapeo a la rúbrica (cc3088 — Bases de Datos 1, Proyecto 3)

| Categoría | Pts | Ubicación / evidencia |
| --- | --- | --- |
| **I. Seguridad y roles** | | |
| 5 roles en el DBMS con `CREATE ROLE` + `GRANT`/`REVOKE` | 20 | [`db/init/05_roles.sql`](db/init/05_roles.sql) |
| Esquema de roles documentado | 10 | [`docs/ROLES.md`](docs/ROLES.md) |
| Auth con sesión + un usuario de prueba por rol | 10 | `auth.js` + `02_seed.sql` (`*_demo`) |
| Rutas y vistas de la UI protegidas por rol | 15 | `permissions.js` + `RequireRole` en `App.jsx` + `requireRole` en backend |
| **II. Stored Procedures y ORM** | | |
| ≥5 stored procedures invocados desde el backend | 15 | `06_procedures.sql` (ver tabla arriba) |
| ≥1 SP con params IN/OUT + manejo de excepciones | 10 | `sp_registrar_venta` |
| ≥1 transacción explícita con `ROLLBACK` dentro de un SP | 10 | `sp_anular_venta` (PROCEDURE) |
| ORM configurado y usado en ≥3 operaciones CRUD | 10 | Sequelize en `clientes.js` |

> **Requisito de entrada (no puntúa, pero sin esto no se evalúa):** todo el
> Proyecto 2 sigue funcional (CRUD, reportes, ventas, frontend, Docker).
> Calidad: `npm run lint` → 0 errores; `npm test` → 24 tests pasando.

---

## Endpoints principales

| Método | Ruta                                | Descripción                              | Auth |
| ------ | ----------------------------------- | ---------------------------------------- | ---- |
| GET    | `/health`                           | Status del backend + ping a DB           | no   |
| POST   | `/auth/login`                       | Inicia sesión                            | no   |
| POST   | `/auth/logout`                      | Cierra sesión                            | no   |
| GET    | `/auth/me`                          | Usuario actual                           | no   |
| GET    | `/productos`                        | Listado (lee de la VIEW)                 | no   |
| GET    | `/productos/bajo-stock`             | Productos con stock ≤ stock_minimo       | no   |
| POST/PUT/DELETE | `/productos[/:id]`         | CRUD                                     | sí   |
| GET    | `/clientes`                         | Listado (vía ORM)                        | sí   |
| POST/PUT/DELETE | `/clientes[/:id]`          | CRUD vía ORM (Sequelize)                 | sí · rol |
| PATCH  | `/productos/:id/stock`              | Ajuste de stock (`sp_ajustar_stock`)     | sí · rol |
| GET    | `/ventas`                           | Listado con JOIN a Cliente/Sucursal/...  | sí   |
| POST   | `/ventas`                           | Registra venta (`sp_registrar_venta`)    | sí · rol |
| POST   | `/ventas/:id/anular`                | Anula venta (`sp_anular_venta`, ROLLBACK)| sí · rol |
| GET/POST | `/compras`                        | Listado / registro (`sp_registrar_compra`)| sí · rol |
| GET    | `/reportes/total-ventas`            | Agregación (`sp_total_ventas`)           | sí   |
| GET    | `/reportes/top-productos`           | CTE                                      | sí   |
| GET    | `/reportes/ventas-por-sucursal`     | GROUP BY + HAVING                        | sí   |
| GET    | `/reportes/productos-criticos`      | 2 subqueries                             | sí   |
| GET    | `/reportes/clientes-frecuentes`     | EXISTS correlacionada                    | sí   |
| GET    | `/categorias`, `/marcas`, `/metodos-pago` | Catálogos para dropdowns           | no   |

---

## Notas operativas

- Los puertos están elegidos en rango `5xxxx` para evitar conflictos con servicios comunes (Postgres `5432`, Vite `5173`, etc.). El `.env` controla los tres puertos del proyecto.
- Cuando se agregan dependencias nuevas al backend o frontend hay que reconstruir limpio: `docker compose down -v && docker compose up --build`. El `-v` borra el volumen anónimo de `node_modules`.
- El seed se ejecuta solo en el primer boot (cuando el volumen `pgdata` está vacío). Para re-sembrar, hacer `docker compose down -v` antes de levantar.

---

## Producción

El mismo `docker compose up` levanta el setup de producción. No hay archivos `*.prod.yml` ni comandos especiales: la imagen del frontend siempre buildea con Vite y sirve con nginx; el backend siempre corre `node` sin watch. La única diferencia entre tu laptop y el server es el valor de `FRONTEND_PORT` en `.env` (en el server lo mapeás a `80`):

```bash
# en el servidor
git clone <url-del-repo>
cd proyecto3-BasesDeDatos
cp .env.example .env
sed -i "s/cambiame-en-produccion/$(openssl rand -hex 32)/" .env
sed -i "s/FRONTEND_PORT=.*/FRONTEND_PORT=80/" .env
docker compose up -d --build
```

Apuntar el A record del dominio al IP del servidor y listo. Guía detallada (incluyendo HTTPS con Caddy) en [`docs/DEPLOY.md`](docs/DEPLOY.md).

> **Recordatorio rúbrica**: si la app no está accesible en una URL pública, la nota es **0**.

---

## Scripts útiles del frontend

El container del frontend en producción es **solo nginx** (sirve el build estático), así que ESLint y Vitest se ejecutan desde la host. Requiere Node 20+ y `npm install` la primera vez:

```bash
cd frontend
npm install                 # solo la primera vez
npm run lint                # 0 errores
npm test                    # 24 tests pasando
npm run build               # vite build → dist/ (lo que termina sirviendo nginx)
```

Para iterar con HMR en el frontend sin rebuildear el container, correr `npm run dev` desde la host: arranca Vite en `:5173` con proxy de `/api` apuntando al container del frontend (que ya hace `proxy_pass` al backend).
