# DuckDB Integration für SpecimenOne

Diese Sammlung von PowerShell-Skripten demonstriert die Verwendung von DuckDB zur Analyse und Verwaltung von JSON-Daten im SpecimenOne-Projekt, insbesondere für die `tests.json` Datei.

## Übersicht der Skripte

### 1. [QueryTestsWithDuckDB.ps1](./QueryTestsWithDuckDB.ps1)

Grundlegende Abfragen für die `tests.json`-Datei mit einer ansprechenden Konsolenausgabe mit dünnen ASCII-Tabellen:

- Zählung von Tests in der Datenbank
- Statistiken zu Testkategorien
- Suche nach Tests mit bestimmten Materialien
- Durchschnittliche Mindestmengen pro Materialtyp
- Suche nach Tests anhand von ID oder Namen
- Analyse von Synonymen
- Statistiken zu Befundzeiten
- Identifizierung inaktiver Tests
- Identifizierung von Tests mit fehlenden Informationen
- Analyse von Tests mit mehreren Materialanforderungen
- Erkennung potenzieller Duplikate
- Erweiterte Kategoriestatistiken

### 2. [CrossJsonAnalysisWithDuckDB.ps1](./CrossJsonAnalysisWithDuckDB.ps1)

Erweiterte Abfragen, die mehrere JSON-Dateien verbinden und relationale Analysen durchführen:

- Verbindung von Tests mit Materialtypen
- Gruppierung von Tests nach Materialfarben
- Anreicherung von Testdaten mit Kategorie-Mapping-Informationen
- Komplexe Analysen zu Material-Kategorie-Korrelationen
- Datenqualitätsanalysen über alle JSON-Dateien hinweg
- Synchronitätsprüfung zwischen CSV- und JSON-Daten

### 3. [TestsJsonUpdaterWithDuckDB.ps1](./TestsJsonUpdaterWithDuckDB.ps1)

Interaktives Tool zur Verwaltung und Aktualisierung der `tests.json`-Datei:

- Aktualisierung einzelner Felder in Tests
- Hinzufügen neuer Tests
- Deaktivierung von Tests
- Änderung von Materialeinträgen
- Bearbeitung von Synonymen
- Automatische Backups vor Änderungen
- Validierung der JSON-Struktur nach Änderungen

## Installation und Voraussetzungen

1. **DuckDB installieren**:
   ```powershell
   # Mit Scoop (empfohlen für Windows)
   scoop install duckdb

   # Alternativ mit winget
   winget install duckdb
   ```

2. **Skripte ausführen**:
   ```powershell
   # Beispiel
   ./QueryTestsWithDuckDB.ps1
   ```

## Vorteile der DuckDB-Integration

- **Schnelle Verarbeitung**: DuckDB ist optimiert für analytische Abfragen und verarbeitet auch große JSON-Dateien effizient.
- **SQL-Mächtigkeit**: Nutzt die volle Ausdruckskraft von SQL für komplexe Datenanalysen.
- **Keine Datenbank erforderlich**: Arbeitet direkt mit JSON-Dateien, ohne eine separate Datenbankinstallation.
- **Schöne Ausgabe**: Formatiert Ergebnisse in übersichtlichen ASCII-Tabellen mit dünnen Linien.
- **Dateisystemintegrität**: Führt automatische Backups vor Änderungen durch und validiert die JSON-Struktur.

## Integration in die Anwendung

Für eine tiefere Integration in die SpecimenOne-Anwendung empfehlen wir:

- **Node.js**: Nutzung des [node-duckdb](https://github.com/duckdb/duckdb-node) Pakets
- **Python**: Verwendung des [duckdb](https://github.com/duckdb/duckdb-python) Python-Pakets

## Beispielabfrage

```sql
-- Zählt Tests pro Kategorie
SELECT kategorie, COUNT(*) AS AnzahlTests 
FROM read_json_auto('./public/tests.json') 
GROUP BY kategorie 
ORDER BY AnzahlTests DESC;
```

## Hinweise zur Verwendung

- Alle Skripte verwenden den Pfad `./public/tests.json` relativ zum Ausführungsverzeichnis.
- Bei Änderungen an den JSON-Dateien werden automatisch Backups im `./backups`-Ordner erstellt.
- Die ASCII-Tabellenformatierung wird mit dem `-ascii` Parameter für DuckDB erreicht.

---

Erstellt von GitHub Copilot, Mai 2024
