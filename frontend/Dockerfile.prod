# Multi-stage para producción: build con Vite, sirve con nginx alpine.
# Same-origin deploy: nginx sirve la SPA y hace proxy_pass de /api/ al backend.
# El frontend usa rutas relativas (`/api/*`), así funciona bajo cualquier dominio
# (ej. http://www.servigtdev.com/) sin hardcodear URLs en el bundle.

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
# VITE_API_URL queda vacío a propósito → api.js cae al default "/api" relativo.
RUN npm run build

# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# BACKEND_HOST: host:puerto interno del backend. Por defecto apunta al servicio
# "backend" del docker-compose; en un VPS sin compose, pasar BACKEND_HOST=127.0.0.1:58082.
ENV BACKEND_HOST=backend:58082

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# La imagen oficial de nginx ya hace envsubst sobre /etc/nginx/templates al arrancar.

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
