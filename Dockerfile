# ========== STAGE 1: Build ==========
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./

# Optimierung für schnelleren Build
ENV NODE_ENV=production

# Installiere Vite explizit und dann alle Dependencies
RUN npm install -g vite
RUN npm ci

# Kopiere den Rest der Dateien
COPY . .

# Build mit dem global installierten Vite
RUN vite build

# ========== STAGE 2: Serve ==========
FROM nginx:alpine

# NGINX-Konfiguration hinzufügen
COPY nginx.conf /etc/nginx/conf.d/default.conf

# .htaccess für MIME-Typen kopieren (als Backup-Lösung)
COPY ./public/.htaccess /usr/share/nginx/html/.htaccess

COPY --from=builder /app/dist /usr/share/nginx/html

# Metadaten hinzufügen
LABEL maintainer="SpecimenOne Team"
LABEL version="1.0"
LABEL description="SpecimenOne Labor-Test-Verwaltungsanwendung"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]