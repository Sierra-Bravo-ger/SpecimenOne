# SpecimenOne

Eine moderne React-basierte Web-Anwendung zur Anzeige und Verwaltung von Labortests für medizinisches Personal.

## Schnellstart

### Lokale Entwicklung

```powershell
# Installieren der Abhängigkeiten
npm install

# Starten des Entwicklungsservers
npm run dev
```
Die Anwendung ist dann unter http://localhost:5173 verfügbar.

### Docker-Deployment

```powershell
# Container bauen und starten
docker build -t specimenone:latest .
docker run -d -p 8100:80 --name specimenone specimenone:latest
```
Die Anwendung ist dann unter http://localhost:8100 verfügbar.

### Docker Compose

```powershell
# Mit Docker Compose starten
docker compose up -d
```

### Portainer-Deployment

1. Lade die `compose-portainer.yaml` in Portainer hoch
2. Erstelle einen neuen Stack mit dieser Datei
3. Deploye den Stack

## Funktionen

### UI-Komponenten
- Responsive Benutzeroberfläche auf Deutsch mit Material Design 3
- Dark Mode mit angepasstem Farbschema (Pastelgrün #6abf7b statt Standard-Purple)
- Intuitive Farbcodierung der Laborfachbereiche:
  - Hämatologie: Rot
  - Klinische Chemie: Braun
  - Gerinnung: Grün
  - Immunologie: Blau
  - Mikrobiologie: Violett
  - Endokrinologie: Amber/Gold
  - Virologie: Hellblau
  - Infektionsdiagnostik: Braun

### Kernfunktionalitäten
- Erweiterte Suchfunktion für Tests (Namen, Synonyme, Fachbereiche, LOINC-Codes, Test-IDs)
- Detaillierte Testansicht mit strukturierten Informationen
- Test-Profil-Funktionalität zur Gruppierung zusammengehöriger Tests
- Tab-Navigation für Einzeltest-, Profil- und Tabellenansicht
- Hierarchische Drilldown-Tabelle mit erweiterbaren Details nach Kategorie
- Abrechnungsinformationen (einheit, ebm, goae)
- Sortiernummern für Tests und Profile zur besseren Pflegbarkeit
- Optimierte Druckausgabe der Testdetails mit eigenem Druckfenster (SOP auf Knopfdruck)

### Datenmanagement
- PowerShell-Skripte für Konvertierung zwischen JSON und CSV:
  ```powershell
  # JSON zu CSV konvertieren
  .\convertJsonToCsv.ps1
  
  # CSV zu JSON konvertieren
  .\convertCsvToJson.ps1
  ```
- Excel-kompatible Import/Export-Funktionalität

## Technologie

- React 18+ mit Vite als Build-Tool
- Material Design 3 Komponenten
- Responsive Design für Desktop und mobile Ansichten
- Docker-Container für einfache Bereitstellung

## Projektstruktur

```
specimenone/
├── src/                  # Quellcode der React-Anwendung
│   ├── components/       # React-Komponenten
│   ├── App.jsx           # Hauptkomponente
│   └── main.jsx          # Einstiegspunkt
├── public/               # Statische Dateien
│   ├── profile.json      # Test-Profil-Definitionen
│   └── tests.json        # Testdaten
├── Dockerfile            # Docker-Konfiguration
├── compose.yaml          # Docker Compose Konfiguration
├── compose-portainer.yaml # Portainer Stack Konfiguration
└── *.ps1                 # PowerShell-Hilfsskripte
```

## Lizenzen

 - Dieses Projekt steht unter der [MIT License](./LICENSE).

##

Das Docker Image basiert auf:

- **Alpine Linux 20** – MIT License  
  [https://alpinelinux.org](https://alpinelinux.org)  
  [MIT License Text](https://opensource.org/licenses/MIT)

Weitere Abhängigkeiten siehe GitHub-Repo.