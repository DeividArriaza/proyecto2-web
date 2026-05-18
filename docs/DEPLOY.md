# Guía de deploy en producción

La rúbrica del curso es **categórica**: si el proyecto no está desplegado en un
servidor en producción, la nota es **0**.

> **Topología single-domain.** Todo el sitio vive bajo un único dominio
> (ej. `http://www.servigtdev.com/`). El frontend usa **rutas relativas** —
> llama a `/api/auth/login`, `/api/productos`, etc. — y nginx (dentro del
> contenedor del frontend) hace `proxy_pass` al backend en la red interna.
> El backend y la DB **no están expuestos al mundo**; solo el frontend en el
> puerto 80. Esto elimina los problemas de CORS y de `SameSite` en las cookies
> de sesión, y permite que la URL del API no esté hardcodeada en el bundle.

Esta guía cubre tres caminos comunes ordenados por simplicidad.

Antes de elegir, recordá que necesitás:

- Un dominio o subdominio público (puede ser el que da el proveedor).
- Credenciales `proy2 / secret` para la DB (exigidas por la rúbrica).
- Tres servicios: **db**, **backend**, **frontend**.

Los Dockerfiles de producción ya están listos:

| Servicio  | Dockerfile                   | Imagen final           |
| --------- | ---------------------------- | ---------------------- |
| Backend   | `backend/Dockerfile.prod`    | `node:20-alpine`       |
| Frontend  | `frontend/Dockerfile.prod`   | `nginx:1.27-alpine`    |
| DB        | `db/Dockerfile`              | `postgres:16-alpine`   |

Y `docker-compose.prod.yml` permite hacer un smoke-test local antes de subir:

```bash
VITE_API_URL=http://localhost:58082 docker compose -f docker-compose.prod.yml up --build
```

---

## Opción A — Fly.io (recomendado, free-tier amplio)

Fly corre contenedores Docker en máquinas pequeñas. Cada servicio = una "app".

### 1. Instalar y autenticarse

```bash
curl -L https://fly.io/install.sh | sh
fly auth signup     # o fly auth login
```

### 2. Crear la DB Postgres administrada

```bash
fly postgres create --name proy2web-db --region gru --vm-size shared-cpu-1x \
  --initial-cluster-size 1 --volume-size 1
```

Importante: tras crear la DB, **renombrar el usuario y password** para que coincidan
con la rúbrica:

```bash
fly postgres connect -a proy2web-db
# dentro de psql:
ALTER USER postgres RENAME TO proy2;
ALTER USER proy2 WITH PASSWORD 'secret';
CREATE DATABASE tienda OWNER proy2;
\c tienda
\i /path/al/01_schema.sql    -- o copiar y pegar el contenido
\i /path/al/02_seed.sql
\i /path/al/03_indexes.sql
\i /path/al/04_views.sql
```

### 3. Deploy del backend

```bash
cd backend
fly launch --name proy2web-backend --no-deploy --dockerfile Dockerfile.prod
```

Editar el `fly.toml` que se genera:

```toml
[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  [[services.ports]]
    handlers = ["http"]
    port = 80
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

```bash
fly secrets set \
  DB_HOST=proy2web-db.flycast \
  DB_PORT=5432 \
  DB_USER=proy2 \
  DB_PASSWORD=secret \
  DB_NAME=tienda \
  SESSION_SECRET="$(openssl rand -hex 32)"
fly deploy
```

Anotá la URL: `https://proy2web-backend.fly.dev`.

### 4. Deploy del frontend

```bash
cd ../frontend
fly launch --name proy2web-frontend --no-deploy --dockerfile Dockerfile.prod
fly deploy --build-arg VITE_API_URL=https://proy2web-backend.fly.dev
```

URL final: `https://proy2web-frontend.fly.dev`. Esa es la que va al README como
URL de producción.

> **CORS**: cuando frontend y backend están en dominios distintos, las cookies
> de sesión necesitan `sameSite: 'none'` + `secure: true`. Ajustar en
> `backend/src/index.js` antes de subir.

---

## Opción B — Render.com

Render tiene una integración nativa con repos GitHub. Cada servicio se define
en su propio `render.yaml` o desde el dashboard.

1. Crear cuenta en <https://render.com>.
2. **New → PostgreSQL**: nombre `proy2web-db`, usuario `proy2`, password `secret`,
   db `tienda`. Plan: free.
3. Ejecutar los scripts SQL con `psql $DATABASE_URL` desde tu máquina (Render expone
   la URL en el dashboard).
4. **New → Web Service** (para backend):
   - Conectá el repo.
   - Root directory: `backend`.
   - Dockerfile path: `backend/Dockerfile.prod`.
   - Env vars: `DB_HOST`, `DB_PORT`, `DB_USER=proy2`, `DB_PASSWORD=secret`,
     `DB_NAME=tienda`, `SESSION_SECRET`.
5. **New → Static Site** (para frontend):
   - Root directory: `frontend`.
   - Build command: `npm ci && npm run build`.
   - Publish directory: `dist`.
   - Env var de build: `VITE_API_URL=https://tu-backend.onrender.com`.
   - **Rewrite rule**: `/* → /index.html` (SPA fallback).

---

## Opción C — VPS propio con dominio (caso `www.servigtdev.com`)

Este es el deploy más simple cuando ya tenés un servidor con IP pública y un
dominio apuntado a él. La imagen del frontend trae nginx integrado con
`proxy_pass /api/ → backend`, así que **no hay que configurar nada externo** si
el sitio puede vivir en HTTP plano. (Para HTTPS, agregar Caddy/Traefik delante.)

### 1. Preparar el servidor

Cualquier VPS con Linux + Docker + docker-compose alcanza:

```bash
# en el servidor
apt update && apt install -y docker.io docker-compose-plugin
```

Apuntar el A record de `www.servigtdev.com` (y, si querés, `servigtdev.com`)
al IP del VPS desde el panel del registrador del dominio.

### 2. Clonar y configurar

```bash
git clone <url-del-repo>
cd proyecto2-web
cp .env.example .env
# Editar .env: poner un SESSION_SECRET nuevo (NO el de ejemplo).
sed -i "s/cambiame-en-produccion/$(openssl rand -hex 32)/" .env
# Mapear el frontend al puerto 80 del host:
sed -i "s/FRONTEND_PORT=.*/FRONTEND_PORT=80/" .env
```

### 3. Levantar

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Eso es todo. El sitio queda accesible en `http://www.servigtdev.com/`. El
backend y la DB **no son alcanzables desde el exterior** — solo viven en la
red interna de Docker.

Verificación rápida desde el VPS:

```bash
curl http://localhost/                # → HTML de la SPA
curl http://localhost/api/health      # → {"status":"ok","db":true}
```

### 4. (Opcional) Agregar HTTPS con Caddy

Si querés `https://www.servigtdev.com/` con certificado automático, poné un
contenedor Caddy delante del frontend. Cambiar el mapeo del puerto del
frontend (`FRONTEND_PORT=58083` o similar) y agregar este servicio al compose:

```yaml
caddy:
  image: caddy:2-alpine
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
  depends_on:
    - frontend
```

Con este `Caddyfile`:

```caddy
www.servigtdev.com, servigtdev.com {
    reverse_proxy frontend:80
}
```

Caddy obtiene y renueva el certificado de Let's Encrypt automáticamente.
Como nginx ya hace el proxy de `/api/` adentro, Caddy no necesita reglas
adicionales.

### 5. Re-deploys posteriores

```bash
cd proyecto2-web
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Si cambiaste el schema (`db/init/*.sql`), agregar `down -v` para que el seed
vuelva a correr. Pero ojo: eso borra todos los datos transaccionales.

---

## Checklist final antes de entregar

- [ ] URL pública funcional listada en `README.md` (al inicio).
- [ ] Login funciona con `ericka / demo123` desde producción.
- [ ] Las credenciales de la DB en producción siguen siendo `proy2 / secret`.
- [ ] `SESSION_SECRET` en producción NO es el de `.env.example`.
- [ ] Cookies con `secure: true` y `sameSite: 'none'` si frontend y backend están en hosts distintos.
- [ ] HTTPS habilitado (lo da el proveedor automáticamente en Fly/Render).
- [ ] Smoke-test en móvil real (responsive verificable).
