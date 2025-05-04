# Backend-Server für SpecimenOne

Dieser Server stellt eine REST-API für die SpecimenOne-Anwendung bereit, die mit der PostgreSQL-Datenbank kommuniziert.

## Installation

1. Navigieren Sie zum Serververzeichnis
```powershell
cd c:\Projekte\SpecimenOne\server
```

2. Installieren Sie die Abhängigkeiten
```powershell
npm install
```

## Starten des Servers

Für die Entwicklung (mit automatischem Neustart):
```powershell
npm run dev
```

Für den Produktivbetrieb:
```powershell
npm start
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

Die Datenbankverbindung wird in der `index.js` konfiguriert. Falls nötig, passen Sie die Verbindungsparameter an:

```javascript
const pool = new Pool({
  host: '192.168.178.43',
  port: 5433,
  user: 'specimen',
  password: 'specimenpw',
  database: 'specimenone'
});
```
