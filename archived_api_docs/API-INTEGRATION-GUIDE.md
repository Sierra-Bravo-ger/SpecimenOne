# API-Integration für SpecimenOne

Diese Anleitung beschreibt die Schritte, um die SpecimenOne-Anwendung von lokalen JSON-Dateien auf die neue PostgreSQL-API umzustellen.

## 1. Überblick

Die Änderungen betreffen folgende Bereiche:
- **API-Client**: Zentrale Schnittstelle zur PostgreSQL-Datenbank
- **Services**: Angepasste Services, die mit der API kommunizieren
- **Zentraler Hook**: `useLeistungsverzeichnis` als Hauptschnittstelle

## 2. Voraussetzungen

Der API-Server muss gestartet sein:

```powershell
cd c:\Projekte\SpecimenOne\server
npm run dev
```

## 3. Integration der API-Services

1. Umbenennen Sie den korrigierten Hook:

```powershell
Copy-Item -Path "c:\Projekte\SpecimenOne\src\hooks\useLeistungsverzeichnis.fixed.js" -Destination "c:\Projekte\SpecimenOne\src\hooks\useLeistungsverzeichnis.js" -Force
```

2. Stellen Sie sicher, dass die API-Services verwendet werden:

- MaterialService.api.jsx statt MaterialService.jsx
- EinheitenService.api.jsx statt EinheitenService.jsx
- ProfileService.api.jsx statt ProfileService.jsx
- TestsService.jsx bleibt unverändert (bereits für API implementiert)

## 4. Komponenten anpassen

### Beispiel für TestListe.jsx:

```jsx
import useLeistungsverzeichnis from '../hooks/useLeistungsverzeichnis';

function TestListe({ /* bestehende Props */ }) {
  const {
    tests,
    testsLoading,
    loadFilteredTests,
    // weitere benötigte Funktionen...
  } = useLeistungsverzeichnis();
  
  // Beim Laden der Komponente Tests laden
  useEffect(() => {
    loadFilteredTests();
  }, [loadFilteredTests]);
  
  // ... bestehender Code
}
```

### Beispiel für App.jsx:

```jsx
// Statt direkter JSON-Ladung:
// const testsData = await loadJsonData('tests');

// Verwenden Sie den Leistungsverzeichnis Hook:
const {
  tests,
  testsLoading,
  testsError,
  profiles,
  profilesLoading,
  profilesError,
  loadFilteredTests
} = useLeistungsverzeichnis();

// Tests laden
useEffect(() => {
  loadFilteredTests();
}, [loadFilteredTests]);

// State synchronisieren (falls nötig)
useEffect(() => {
  if (!testsLoading && tests) {
    setTests(tests);
  }
}, [tests, testsLoading]);
```

## 5. Testen der Integration

Testen Sie die Integration schrittweise:

1. **API-Verbindung**: Sicherstellen, dass die API erreichbar ist
2. **Materialdaten**: Anzeige der Materialbadges prüfen
3. **Testliste**: Laden und Anzeigen der Tests
4. **Testdetails**: Details und Referenzwerte prüfen
5. **Profile**: Anzeige und Funktionalität der Profile testen

## 6. Fehlerbehandlung

Bei API-Fehlern werden diese über die entsprechenden Error-States zur Verfügung gestellt:

```jsx
const { testsError, profilesError, materialError, einheitenError } = useLeistungsverzeichnis();

// Anzeige von Fehlern
{testsError && (
  <div className="error-message">
    Fehler beim Laden der Tests: {testsError}
  </div>
)}
```

## 7. Anpassungen für Entwicklung/Produktion

Im apiClient.js können Sie die API-URLs anpassen:

```javascript
// Entwicklung
const API_BASE_URL = 'http://localhost:3001/api';

// Produktion
// const API_BASE_URL = 'https://specimenone-api.example.com/api';
```

## 8. Troubleshooting

### Häufige Probleme:

1. **CORS-Fehler**: Sicherstellen, dass der Server CORS aktiviert hat
2. **Verbindungsfehler**: API-Server läuft nicht oder ist nicht erreichbar
3. **Datenformat-Probleme**: API liefert andere Feldnamen als erwartet

### Diagnose:

```javascript
// Logging in den Services aktivieren
console.log('API-Antwort:', response);
```

### Tests:

```powershell
# API-Endpunkte direkt testen
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
Invoke-RestMethod -Uri "http://localhost:3001/api/material"
Invoke-RestMethod -Uri "http://localhost:3001/api/tests?limit=5"
```
