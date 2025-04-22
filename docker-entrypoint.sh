#!/bin/sh
# docker-entrypoint.sh - Konfiguriert die Anwendung mit Umgebungsvariablen vor dem Start

# Erstelle die Konfigurationsdatei für das Frontend mit den aktuellen Umgebungsvariablen
echo "console.log('Loading runtime config...');" > /usr/share/nginx/html/config.js
echo "window.SPECIMENONE_CONFIG = {" >> /usr/share/nginx/html/config.js
echo "  DISCORD_WEBHOOK_URL: \"$VITE_DISCORD_WEBHOOK_URL\"," >> /usr/share/nginx/html/config.js
echo "  BUILD_TIME: \"$(date)\"," >> /usr/share/nginx/html/config.js
echo "  CONTAINER_ID: \"$(hostname)\"" >> /usr/share/nginx/html/config.js
echo "};" >> /usr/share/nginx/html/config.js
echo "console.log('Runtime config loaded successfully');" >> /usr/share/nginx/html/config.js

# Ausgabe zur Bestätigung, dass die Konfigurationsdatei erstellt wurde
echo "Runtime config wurde erstellt mit Discord-URL: $VITE_DISCORD_WEBHOOK_URL"

# Starte Nginx im Vordergrund
echo "Starting Nginx..."
exec nginx -g 'daemon off;'