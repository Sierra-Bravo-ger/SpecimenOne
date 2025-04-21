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
- **Druckoptimierte Ausgabe:** Professionelle Druckansicht für ausgewählte Tests
- **Long-Press-Funktionalität:** Optimierte Bedienung auf Touch-Geräten

## Technologien

- React mit Vite als Build-Tool
- Material Design 3 (Material Web Components)
- CSS für responsive Gestaltung und Dark Mode
- JSON-Datenhaltung mit bidirektionaler CSV-Konvertierung

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

## Datenkonvertierung

Für die Bearbeitung der Testdaten stehen PowerShell-Skripte zur Verfügung:

```powershell
# JSON zu CSV konvertieren
.\convertJsonToCsv.ps1

# CSV zu JSON konvertieren
.\convertCsvToJson.ps1
```