# SpecimenOne

React-Web-App (PWA) zur Anzeige des Labor-Leistungsverzeichnisses: Tests, Referenzwerte, Materialien und Profile für medizinisches Personal.

## Funktionen

- Suche über Testname, Synonyme, Material, Fachbereich, LOINC-Code und Test-ID
- Detailansicht je Test mit Referenzwerten (alters-, geschlechts- und zustandsabhängig), Material, Abrechnung (EBM/GOÄ) und Versandinfos
- Drei Ansichten: Einzeltests, Test-Profile, hierarchische Tabelle nach Fachbereich
- Persönliche Profile per Checkbox-Auswahl, gespeichert im Browser; optional Meldung per Discord-Webhook
- Druckansicht für Testdetails und Profile
- Dark Mode, farbcodierte Fachbereiche und Material-Badges
- PWA: installierbar, offlinefähig (Workbox; API-Antworten NetworkFirst)

## Architektur

```
Browser ──/api/*──▶ nginx (Image specimenone) ──▶ api:3001 (Image specimenone-api) ──▶ PostgreSQL
          sonst ──▶ statische App
```

| Teil | Technik | Ort |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind, Material Web | `src/`, `public/`, `Dockerfile`, `nginx.conf` |
| API | Node 22, Express, pg (nur lesend) | `server/` (siehe `server/README.md`) |
| Datenbank | PostgreSQL 17 | Container im Stack, Daten auf dem Host |

Das Frontend ruft die API **relativ** unter `/api` auf (`src/services/apiConfig.js`, überschreibbar mit `VITE_API_BASE_URL` beim Build). In Produktion leitet nginx `/api/` an den Compose-Service `api` weiter, in der Entwicklung macht das der Vite-Proxy.

## Entwicklung

Voraussetzung: Node.js 22.

```bash
npm ci
(cd server && npm ci && npm start)   # API auf :3001, DB-Default styx:5433
npm run dev                          # Vite auf :5173, /api -> localhost:3001
```

Qualitätssicherung (läuft auch in der CI):

```bash
npm run lint                  # ESLint (Flat Config, React-Hooks- und Refresh-Regeln)
npm test                      # Vitest: Filter- und Sortierlogik der Testliste
npm run build                 # Produktions-Build nach dist/
(cd server && npm test)       # API-Tests (node:test + supertest, DB gemockt, keine Datenbank nötig)
```

Die DB-Verbindung der API kommt aus `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. Ein anderes API-Ziel für den Vite-Proxy: `API_PROXY_TARGET=http://host:3001 npm run dev`.

## Build und Deployment

```bash
./scripts/build-push.sh            # baut beide Images und pusht nach Docker Hub (madmoench/…)
./scripts/build-push.sh --no-push  # nur bauen
```

`compose.yaml` ist der Produktiv-Stack (Frontend `:8100`, API ohne Host-Port, PostgreSQL `:5433`). Optionale Umgebungsvariable im Frontend: `VITE_DISCORD_WEBHOOK_URL` (landet zur Laufzeit in `config.js`, siehe `docker-entrypoint.sh`).

Der Discord-Webhook ist kein Build-Bestandteil: `src/services/ServiceClient.js` liest ihn nur zur Laufzeit aus `window.SPECIMENONE_CONFIG.DISCORD_WEBHOOK_URL`. Ohne Webhook meldet die App „nicht eingerichtet“. Der Build braucht keine lokalen Zusatzdateien: `npm ci && npm run build` genügt.

### CI (GitHub Actions)

[![CI](https://github.com/Sierra-Bravo-ger/SpecimenOne/actions/workflows/ci.yml/badge.svg)](https://github.com/Sierra-Bravo-ger/SpecimenOne/actions/workflows/ci.yml)

`.github/workflows/ci.yml` läuft bei jedem Push und Pull Request:

1. Frontend: `npm ci`, `npm run lint`, `npm test`, `npm run build`
2. API: `npm ci`, `npm test`
3. Beide Docker-Images bauen (ohne Push)
4. Nur auf `main`: Images nach Docker Hub pushen, **sofern** die Secrets gesetzt sind. Ohne Secrets wird dieser Schritt übersprungen, der Lauf bleibt grün.

Secrets für den Docker-Hub-Push anlegen: Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Zwei Secrets mit exakt diesen Namen:

| Name | Wert |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker-Hub-Benutzername (`madmoench`) |
| `DOCKERHUB_TOKEN` | Access Token aus Docker Hub → Account Settings → Personal access tokens (Rechte: Read & Write) |

## Projektstruktur

```
├── src/                 React-App (components, services, contexts, styles, utils)
├── public/              statische Dateien, Icons, Fonts, Laufzeit-Konfiguration (config.js)
├── server/              REST-API (Express + PostgreSQL)
├── docs/                Entwicklungsnotizen (Theming, Material-Badges, persönliche Profile)
├── scripts/
│   ├── build-push.sh    Images bauen und pushen
│   └── legacy/          PowerShell-Werkzeuge aus der JSON/CSV-Zeit inkl. Import nach PostgreSQL
├── .github/workflows/   CI (Lint, Tests, Build, Docker)
├── Dockerfile           Frontend-Image (Build + nginx)
├── nginx.conf           SPA + /api-Proxy
└── compose.yaml         Produktiv-Stack
```

## Lizenz

MIT, siehe [LICENSE](LICENSE). Lizenzen der Abhängigkeiten: [LICENSES.md](LICENSES.md).
