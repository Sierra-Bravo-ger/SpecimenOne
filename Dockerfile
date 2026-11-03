FROM node:22-alpine AS build

WORKDIR /app

# Kopiere zuerst die package.json und installiere Abhängigkeiten
COPY package*.json ./
RUN npm ci

# Kopiere den Quellcode (ohne node_modules und andere ignorierte Dateien)
COPY . .

# Frontend bauen
RUN npm run build

# Produktions-Stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Kopiere eine benutzerdefinierte nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiere und mache das Startup-Script ausführbar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
CMD ["/docker-entrypoint.sh"]