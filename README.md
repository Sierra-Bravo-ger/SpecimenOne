# SpecimenOne

Eine moderne Web-App zur Anzeige und Verwaltung von Labortests und Profilen.

## Features

- Übersichtliche Darstellung von Labortests mit detaillierten Informationen
- Filterung nach Fachbereichen und erweiterte Suchfunktion
- Detailansicht für Labortests mit allen wichtigen Parametern
- Vorgegebene Testprofile für gängige Untersuchungen
- Dark Mode für optimale Lesbarkeit in verschiedenen Arbeitsumgebungen
- Druckoptimierte Ausgabe für Testdetails und Profile
- Hierarchische Tabellenansicht für strukturierte Datenübersicht
- Referenzwerte mit alters- und geschlechtsspezifischen Grenzwerten

### Neu: Benutzerdefinierte Testprofile

- **Testauswahl durch Checkboxen:** Einfache Mehrfachauswahl von Tests
- **Profilerstellung:** Erstellung benutzerdefinierter Testprofile mit Metadaten
- **Benachrichtigung via Webhook oder Email:** User können Wunschprofile festlegen, benennen und an eine Zentrale stelle zur Bearbeitung senden
- **Druckoptimierte Ausgabe:** Professionelle Druckansicht für ausgewählte Tests
- **Long-Press-Funktionalität:** Optimierte Bedienung auf Touch-Geräten
- **E-Mail-Integration:** Direkte Übermittlung von erstellten Profilen per E-Mail

## Technologien

- React mit Vite als Build-Tool
- Material Design 3 (Material Web Components)
- CSS für responsive Gestaltung und Dark Mode
- JSON-Datenhaltung mit bidirektionaler CSV-Konvertierung

## Web-Hook-Funktionalität

 - Automatische Benachrichtigung über neu beantragte Testprofile
 - User geben Namen, Email und Wunsch Profilnamen ein
 - Erfassung der Teste mit intuitiver Benutzeroberfläche

## Fallback E-Mail-Funktionalität

Ist der Webhook nicht erreichbar hat die App hat außerdem die Möglichkeit, erstellte Profile direkt per E-Mail zu versenden:
- Integration mit FormSubmit für zuverlässigen E-Mail-Versand
- HTML-formatierte E-Mails mit übersichtlicher Testauflistung
- Letzter Fallback auf den Standard-E-Mail-Client bei API-Fehlern (mailto:)
- Optimiert für Benutzerfreundlichkeit mit Statusanzeigen

## Datenmanagement

Die App unterstützt die Pflege der Testdaten durch einfache Export/Import-Funktionen:

- Export der Tests als CSV-Datei für einfache Bearbeitung in Excel
- Import der bearbeiteten CSV zurück in das JSON-Format
- Robuste Fehlerbehandlung für verschiedene CSV-Formate

### Referenzwerte

Die App enthält eine umfangreiche Sammlung von Referenzwerten für Labortests:
- Alters- und geschlechtsspezifische Referenzbereiche
- Spezielle Referenzbereiche für verschiedene Zustände (z.B. Schwangerschaft)
- Automatische Verknüpfung zwischen Tests und ihren Referenzwerten

## Ansichten

Die App bietet drei verschiedene Ansichten der Labortests:

1. **Tests:** Kartenbasierte Übersicht aller Tests mit Suchfunktion
2. **Profile:** Vorgegebene und benutzerdefinierte Sammlungen zusammengehöriger Tests
3. **Tabelle:** Hierarchische, nach Fachbereichen gruppierte Tabellenansicht

## Installation und Start

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build
```

### Umgebungsvariablen für Discord Webhook

Für die Discord-Integration müssen Sie eine Webhook-URL konfigurieren:

1. Kopieren Sie `src/services/DiscordService.example.js` zu `src/services/DiscordService.js`
2. Für lokale Entwicklung erstellen Sie eine `.env.local` Datei im Projektroot:

```
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url
```

Die Anwendung verwendet diese Umgebungsvariable für die Discord-Integration. Ohne diese Variable wird automatisch auf den E-Mail-Fallback zurückgegriffen.

## Datenkonvertierung

Für die Bearbeitung der Testdaten stehen PowerShell-Skripte zur Verfügung:

```powershell
# JSON zu CSV konvertieren
.\convertJsonToCsv.ps1

# CSV zu JSON konvertieren
.\convertCsvToJson.ps1
```

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
- Umfassende Referenzwerte pro Test mit alters-, geschlechts- und zustandsbezogenen Variationen
- Test-Profil-Funktionalität zur Gruppierung zusammengehöriger Tests
- Tab-Navigation für Einzeltest-, Profil- und Tabellenansicht
- Hierarchische Drilldown-Tabelle mit erweiterbaren Details nach Kategorie
- Farblich kodierte Kategorie-Zähler für verbesserte Übersichtlichkeit
- Abrechnungsinformationen (einheit, ebm, goae)
- Optimierte Druckausgabe der Testdetails mit eigenem Druckfenster (SOP auf Knopfdruck)
- Robuste Fehlerbehandlung gegen unvollständige oder fehlerhafte Datensätze
- JSON-Datei mit bidirektionaler CSV-Konvertierung
- Robuste Dezimalwertbehandlung bei der Konvertierung von CSV zu JSON
- Optimierte Verarbeitung von Excel-formatierten CSV-Dateien (inklusive Apostroph-Präfixen)
- Zentrale Definition von Einheiten in tests.json mit automatischer Verknüpfung zu Referenzwerten
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