# Backend-Server für SpecimenOne

Dieser Server stellt eine REST-API für die SpecimenOne-Anwendung bereit, die mit der PostgreSQL-Datenbank kommuniziert.

## Starten

```bash
cd server
npm ci
npm start        # oder: npm run dev (nodemon)
```

## Verfügbare API-Endpunkte

- `GET /api/health` - Überprüft die Datenbankverbindung
- `GET /api/material` - Ruft alle Materialien ab
- `GET /api/einheiten` - Ruft alle Einheiten ab
- `GET /api/tests` - Ruft Tests ab (mit Paginierung und Suche)
- `GET /api/tests/:id` - Ruft einen bestimmten Test mit Referenzwerten ab
- `GET /api/profile` - Ruft alle Profile ab
- `GET /api/farben` - Ruft alle Farben ab

## Konfiguration

Die Datenbankverbindung kommt aus Umgebungsvariablen (Defaults in Klammern):
`PGHOST` (styx), `PGPORT` (5433), `PGUSER` (specimen), `PGPASSWORD` (**Pflicht**, kein Default: ohne die Variable bricht der Start mit einer Meldung ab), `PGDATABASE` (specimenone), `PORT` (3001).

## Absicherung

- `GET /api/tests`: `page` und `limit` nur als positive Ganzzahlen, `limit` höchstens 2000, `search` höchstens 200 Zeichen. Sonst `400`.
- Fehler: zentrale Error-Middleware. Der Client bekommt nur `{"error":"Interner Serverfehler"}`, Details landen per `console.error` im Container-Log.
- Header: `helmet`, kein `X-Powered-By`. Kein CORS: Das Frontend ruft die API über nginx mit gleicher Herkunft auf.

## Betrieb (Docker, styx)

- Image: `madmoench/specimenone-api` (`docker build -t madmoench/specimenone-api:latest server`)
- Läuft als Service `api` im Stack `specimenone-styx` (siehe `compose.yaml` im Repo-Root), ohne eigenen Host-Port.
- Das Frontend-nginx leitet `/api/*` an `api:3001` weiter; das Frontend ruft die API relativ unter `/api` auf.
- Lokale Entwicklung: `cd server && npm start`, dann im Root `npm run dev` (Vite-Proxy `/api` → `localhost:3001`).
