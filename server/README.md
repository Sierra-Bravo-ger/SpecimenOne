# Backend-Server für SpecimenOne

Dieser Server stellt eine REST-API für die SpecimenOne-Anwendung bereit, die mit der PostgreSQL-Datenbank kommuniziert.

## Starten

```bash
cd server
npm ci
npm start        # oder: npm run dev (nodemon)
```

## API-Endpunkte

Alle Endpunkte (Parameter, Antworten, Fehlerformat, Beispiele) stehen in der OpenAPI-Spezifikation [`openapi.yaml`](openapi.yaml). Die laufende API liefert sie als `GET /api/openapi.json` und als klickbare Doku (Swagger UI) unter `GET /api/docs`.

**Neue Routen müssen in `openapi.yaml` nachgetragen werden.** Der Vertragstest `openapi.test.js` (`npm test`) schlägt fehl, wenn eine Route aus `app.js` in der Spezifikation fehlt oder die Beispiele nicht mehr zu den Antworten passen. Einmalig gegen die echte Datenbank: laufende API mit DB, dann `node scripts/vertrag-live.js http://localhost:3001`.

## Konfiguration

Die Datenbankverbindung kommt aus Umgebungsvariablen (Defaults in Klammern):
`PGHOST` (styx), `PGPORT` (5433), `PGUSER` (specimen), `PGPASSWORD` (**Pflicht**, kein Default: ohne die Variable bricht der Start mit einer Meldung ab), `PGDATABASE` (specimenone), `PORT` (3001).

## Absicherung

- `GET /api/tests`: `page` und `limit` nur als positive Ganzzahlen, `limit` höchstens 2000, `search` höchstens 200 Zeichen. Sonst `400`.
- Fehler: zentrale Error-Middleware. Der Client bekommt nur `{"error":"Interner Serverfehler"}`, Details landen per `console.error` im Container-Log.
- Header: `helmet` mit Standard-CSP auf allen Routen (auch `/api/docs`, die Swagger UI braucht keine Lockerung), kein `X-Powered-By`. Kein CORS: Das Frontend ruft die API über nginx mit gleicher Herkunft auf.

## Betrieb (Docker, styx)

- Image: `madmoench/specimenone-api` (`docker build -t madmoench/specimenone-api:latest server`)
- Läuft als Service `api` im Stack `specimenone-styx` (siehe `compose.yaml` im Repo-Root), ohne eigenen Host-Port.
- Das Frontend-nginx leitet `/api/*` an `api:3001` weiter; das Frontend ruft die API relativ unter `/api` auf.
- Lokale Entwicklung: `cd server && npm start`, dann im Root `npm run dev` (Vite-Proxy `/api` → `localhost:3001`).
