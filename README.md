# SpecimenOne

Eine moderne React-basierte Web-Anwendung zur Anzeige und Verwaltung von Labortests für medizinisches Personal.

## Funktionen

### UI-Komponenten und Design
- Responsive Benutzeroberfläche vollständig auf Deutsch
- Integration von Material Design 3 (MDC Web) für ein modernes Look & Feel
- Komponenten für TestListe, TestDetails und Suchleiste
- Lösung von Kompatibilitätsproblemen mit Material Web Components durch Verwendung von react-icons/md
- Angepasstes Farbschema mit Pastelgrün (#6abf7b) statt Standard-Material-Purple
- Dark Mode mit entsprechend angepasstem Farbschema

### Kernfunktionalitäten
- Erweiterte Suchfunktion für Tests, die Namen, Synonyme und Fachbereiche durchsucht
- Detaillierte Ansicht für Labortests mit strukturierten Informationen
- Separate Suchleistenkomponente für bessere Wartbarkeit
- Dark Mode Toggle für bessere Benutzerfreundlichkeit in verschiedenen Umgebungen

### Test-Profil-Funktionalität
- Profile.json für die Gruppierung zusammengehöriger Tests (z.B. "Kleines Blutbild", "Großes Blutbild")
- Tab-Navigation zur Umschaltung zwischen Einzeltest-Ansicht und Profil-Ansicht
- ProfilListe-Komponente für Tests nach klinisch relevanten Profilen

### Datenmanagement
- Erweiterte Testdaten mit zusätzlichen Feldern (einheit, ebm, goae)
- Angepasste TestDetails-Komponente zur Anzeige der neuen Felder
- Abrechnungsinformationen in der Detailansicht

### Datenkonvertierung und Wartung
- PowerShell-Skripte für bidirektionale Konvertierung zwischen JSON und CSV:
  - convertJsonToCsv.ps1: Exportiert Tests in CSV-Format
  - convertCsvToJson.ps1: Importiert bearbeitete CSV zurück ins JSON-Format
- Korrekte Datenstruktur-Erhaltung durch Referenz-JSON
- Excel-Kompatibilität:
  - Flexible Erkennung von Trennzeichen (Komma/Semikolon)
  - Unterstützung für verschiedene Pipe-getrennte Wertformate
  - Robuste Verarbeitung von Excel-modifizierten Dateien

## Technologie

- React 18+ mit Vite als Build-Tool
- Material Design 3 Komponenten
- Responsive Design für Desktop und mobile Ansichten
- Dunkelmodus-Unterstützung
- Anpassbares Farbschema

## Projektstruktur

```
labor-test-menu/
├── src/
│   ├── components/
│   │   ├── Suchleiste.jsx
│   │   ├── TestListe.jsx
│   │   ├── TestDetails.jsx
│   │   ├── ProfilListe.jsx
│   │   └── DarkModeToggle.jsx
│   ├── data/
│   │   ├── tests.json
│   │   └── profile.json
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   ├── convertJsonToCsv.ps1
│   └── convertCsvToJson.ps1
└── README.md
```

## Optimierungen

- Zentralisierte Suchfunktion ohne Redundanz
- Optimierte Dark Mode Lesbarkeit mit angepassten Kontrasteinstellungen
- Verbesserte Darstellung der Kategorie-Tags im Dark Mode
- Effiziente Datenkonvertierung mit Strukturerhaltung

## Lizenz

Dieses Projekt steht unter der [MIT License](./LICENSE).