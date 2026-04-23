# Erste Stage: Build-Umgebung
FROM node:lts-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Zweite Stage: Produktionsumgebung
FROM node:slim AS production
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./
COPY --from=builder /app/package*.json /app/pnpm-lock.yaml ./
RUN pnpm install --production --frozen-lockfile

# Definiere den Befehl zum Starten deiner Anwendung
CMD [ "node", "index.js" ]