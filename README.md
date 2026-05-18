# Bubu's Bakery

Aplicación web para administrar el inventario y las ventas de **Bubu's Bakery**, una repostería boutique guatemalteca especializada en brownies artesanales. Proyecto 2 del curso **cc3062 — Sistemas y Tecnologías Web** (UVG, Ciclo 1 — 2026).

Levanta tres contenedores (PostgreSQL, backend Node/Express, frontend React/Vite) con un solo comando: `docker compose up`. Documentación de la API REST en [`docs/API.md`](docs/API.md) y guía de deploy en [`docs/DEPLOY.md`](docs/DEPLOY.md).

**Producción**: <http://www.servigtdev.com/>

> El frontend usa rutas relativas (`/api/*`). Nginx (dentro del contenedor del frontend) hace `proxy_pass` al backend, así que no hay URLs hardcodeadas en el bundle ni problemas de CORS.

---

## Stack

| Capa     | Tecnología                                |
| -------- | ----------------------------------------- |
| DB       | PostgreSQL 16 (alpine)                    |
| Backend  | Node 20 + Express 4 + driver `pg` (sin ORM, SQL crudo) |
| Frontend | React 18 + Vite 5 + react-router-dom 6    |
| Auth     | `express-session` + `bcrypt`              |
| Infra    | Docker Compose                            |

Todas las consultas son **SQL explícito**, sin ORMs que oculten el SQL.

---

## Requisitos previos

- Docker y Docker Compose instalados.
- Puerto `58083` libre en el host (configurable vía `FRONTEND_PORT` en `.env`).

---

## Levantar el proyecto

```bash
git clone <url-del-repo>
cd proyecto2-web
cp .env.example .env
docker compose up --build
```

Cuando los tres servicios estén `healthy/up` (≈ 30 segundos), todo el sitio está accesible bajo el mismo origen:

| Recurso       | URL                                          |
| ------------- | -------------------------------------------- |
| Frontend SPA  | <http://localhost:58083>                     |
| API (proxy)   | <http://localhost:58083/api/health>          |

El **backend y la DB no se exponen al host** — viven en la red interna de Docker. El frontend habla con el API por rutas relativas (`/api/*`) y nginx (dentro del contenedor del frontend) hace `proxy_pass` al backend. Mismo comportamiento en desarrollo y en producción.

Abrí el frontend, va a redirigir automáticamente a `/login`.

### Credenciales del administrador

```
usuario:    ericka
contraseña: demo123
```

**Ericka Sandoval** es la cuenta de administradora (rol `Administrador`, sucursal `Bubu's Bakery`). Tiene acceso a todos los CRUDs, reportes y al registro de ventas.

Los otros 24 empleados sembrados también entran con `demo123`, pero solo Ericka tiene rol de admin.

> Desde la pantalla de login también podés tocar "Crear cuenta" para registrar un empleado nuevo. Las cuentas creadas por signup público quedan con rol `Vendedor Mostrador`.

Detener: `docker compose down` (preserva datos) o `docker compose down -v` (borra el volumen y vuelve a sembrar).

---

## Credenciales (resumen)

### Base de datos (fijas, exigidas por la rúbrica)

```
usuario:    proy2
contraseña: secret
db:         tienda
```

### Aplicación

| Tipo                 | Usuario   | Contraseña | Rol                  |
| -------------------- | --------- | ---------- | -------------------- |
| **Administrador**    | `ericka`  | `demo123`  | Administrador        |
| Resto del seed (24)  | ver `02_seed.sql` | `demo123` | varios (Gerente, Cajero, etc.) |
| Cuenta nueva (signup desde la UI) | _vos elegís_ | _vos elegís_ | Vendedor Mostrador |

---

## Estructura del proyecto

```
.
├── docker-compose.yml         # 3 servicios + red interna + volumen pgdata
├── .env / .env.example         # credenciales y puertos
├── db/
│   ├── Dockerfile              # extiende postgres:16-alpine
│   └── init/                   # cargados en orden alfabético al primer boot
│       ├── 01_schema.sql       # 14 tablas con PK/FK/NOT NULL/CHECK
│       ├── 02_seed.sql         # ≥25 registros por tabla, en transacción
│       ├── 03_indexes.sql      # 4 índices justificados
│       └── 04_views.sql        # vw_producto_detalle (consumida por backend)
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.js            # bootstrap Express + sesión + CORS
│       ├── db.js               # pool de Postgres
│       ├── middleware.js       # cors manual + requireAuth
│       └── routes/
│           ├── auth.js         # login / logout / me (bcrypt + sesión)
│           ├── productos.js    # CRUD + bajo-stock (lee de la VIEW)
│           ├── clientes.js     # CRUD con soft delete
│           ├── ventas.js       # POST con BEGIN/COMMIT/ROLLBACK + GET
│           ├── reportes.js     # 4 reportes (CTE, GROUP BY/HAVING, subqueries)
│           └── catalogos.js    # /categorias, /marcas, /metodos-pago
├── frontend/
│   ├── Dockerfile
│   ├── .eslintrc.cjs           # ESLint v8 + plugin-react + react-hooks
│   ├── vite.config.js          # incluye configuración de vitest (jsdom)
│   └── src/
│       ├── App.jsx             # rutas protegidas + Providers (Auth + Cart)
│       ├── main.jsx            # importa styles.css global
│       ├── api.js              # fetch con credentials + paleta
│       ├── styles.css          # CSS responsive (media queries 768/600/480px) + @media print
│       ├── Login.jsx           # form validado, useAuth
│       ├── Layout.jsx          # header + nav mobile (hamburger) + Modal/banners
│       ├── Catalog.jsx         # listado con búsqueda (useMemo) + add-to-cart
│       ├── ProductosAdmin.jsx  # CRUD producto (modal + validación inline)
│       ├── ClientesAdmin.jsx   # CRUD cliente (modal + validación inline)
│       ├── Ventas.jsx          # carrito vía CartContext + listado de ventas
│       ├── Reportes.jsx        # 4 reportes + export CSV + export PDF (window.print)
│       ├── context/
│       │   ├── AuthContext.jsx # sesión + login/logout con useCallback
│       │   └── CartContext.jsx # carrito con useReducer + useMemo de totales
│       ├── lib/
│       │   └── validators.js   # validateProducto / validateCliente
│       ├── test/setup.js       # vitest setup (@testing-library/jest-dom)
│       └── __tests__/          # 13 tests pasando (reducer, validators, Context)
└── docs/
    └── API.md                  # documentación completa de endpoints REST
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
- **Vitest + React Testing Library**: 13 tests en 3 archivos (`npm test`).
  - `cartReducer.test.js` — 5 tests del reducer puro.
  - `validation.test.js` — 7 tests de los validadores.
  - `CartContext.test.jsx` — render con Provider, totales reactivos.

### Manejo de errores en UI
Banners reutilizables (`ErrorBanner` / `SuccessBanner`) + validación inline por campo. Los errores del backend (por ejemplo, el `ROLLBACK` de la transacción) se muestran al usuario.

---

## Mapeo a la rúbrica (cc3062 — Sistemas y Tecnologías Web)

| Categoría                                          | Pts | Ubicación / evidencia                                                            |
| -------------------------------------------------- | --- | -------------------------------------------------------------------------------- |
| **I. Arquitectura y API REST**                     |     |                                                                                  |
| Endpoints REST documentados                        | 8   | [`docs/API.md`](docs/API.md)                                                     |
| CRUD completo vía API ≥2 entidades                 | 15  | Productos + Clientes (`backend/src/routes/`)                                     |
| Manejo de errores con códigos HTTP + JSON          | 7   | 400/401/404/409/500 en todos los routers                                         |
| ≥1 endpoint que agregue datos                      | 5   | `/reportes/top-productos`, `/reportes/ventas-por-sucursal`                       |
| **II. Frontend — React**                           |     |                                                                                  |
| React Router con ≥4 rutas                          | 8   | 6 rutas en `App.jsx`                                                             |
| React Context para estado global                   | 8   | `AuthContext` + `CartContext` en `src/context/`                                  |
| `useState` + `useEffect` + `useCallback`/`useMemo` | 8   | Catalog, Ventas, AuthContext, CartContext                                        |
| ≥1 flujo complejo con `useReducer`                 | 8   | Carrito en `CartContext.jsx`                                                     |
| Formularios controlados con validación cliente     | 8   | `src/lib/validators.js` + uso en ProductosAdmin / ClientesAdmin / Login          |
| ≥1 reporte visible en la UI con datos reales       | 8   | `/reportes` con 4 reportes y tablas                                              |
| Manejo visible de errores                          | 5   | `ErrorBanner`/`SuccessBanner` + errores inline por campo                         |
| **III. Calidad de código**                         |     |                                                                                  |
| ESLint sin errores                                 | 5   | `npm run lint` → 0 errores                                                       |
| ≥3 pruebas unitarias/integración pasando           | 7   | 13 tests pasando (`npm test`)                                                    |
| **IV. Despliegue y entrega**                       |     |                                                                                  |
| README con instrucciones y ejemplo                 | 5   | Este archivo                                                                     |
| `docker compose up` levanta sin pasos extra        | 10  | `docker-compose.yml` con healthcheck                                             |
| **V. Avanzado**                                    |     |                                                                                  |
| Auth login/logout con sesión vía Context           | 10  | `AuthContext` + `/auth/*` endpoints                                              |
| Exportar reporte a CSV o PDF                       | 5   | Botones en `/reportes` (CSV nativo + PDF vía `window.print`)                     |
| Diseño responsivo verificable                      | 5   | `styles.css` con media queries 768/600/480px + navbar mobile                     |

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
| GET    | `/clientes`                         | Listado                                  | sí   |
| POST/PUT/DELETE | `/clientes[/:id]`          | CRUD                                     | sí   |
| GET    | `/ventas`                           | Listado con JOIN a Cliente/Sucursal/...  | sí   |
| POST   | `/ventas`                           | Registra venta (transacción ROLLBACK)    | sí   |
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
cd proyecto2-web
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
npm test                    # 13 tests pasando
npm run build               # vite build → dist/ (lo que termina sirviendo nginx)
```

Para iterar con HMR en el frontend sin rebuildear el container, correr `npm run dev` desde la host: arranca Vite en `:5173` con proxy de `/api` apuntando al container del frontend (que ya hace `proxy_pass` al backend).
