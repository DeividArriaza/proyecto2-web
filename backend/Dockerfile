# Backend en producción. Sin --watch (no hay bind mount, el código vive
# adentro de la imagen) y sin devDependencies.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

ENV NODE_ENV=production
EXPOSE 58082
CMD ["node", "src/index.js"]
