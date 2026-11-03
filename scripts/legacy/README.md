# PowerShell-Skripte zur CSV-nach-JSON-Konvertierung

Diese Dokumentation beschreibt die PowerShell-Skripte, die zur Konvertierung von CSV-Daten in das JSON-Format für die SpecimenOne-Anwendung entwickelt wurden.

## Übersicht

Die folgenden Skripte wurden entwickelt, um Labor-Daten aus dem Laborinformationssystem in das für die SpecimenOne-Anwendung erforderliche JSON-Format zu konvertieren:

1. `ConvertAllCsvToJson.ps1` - Hauptskript, das alle Konvertierungsskripte aufruft
2. `ConvertMaterialCsvToJson.ps1` - Konvertiert Material-Daten
3. `ConvertEinheitCsvToJson.ps1` - Konvertiert Einheiten-Daten
4. `ConvertTesteCsvToJson.ps1` - Konvertiert Test-Daten
5. `GenerateMaterialExtensionMapping.ps1` - Erzeugt Mapping für Material-Erweiterungen
6. `UpdateMaterialCSS.ps1` - Generiert CSS-Klassen für Material-Badges

## Voraussetzungen

- PowerShell 5.1 oder höher
- Zugriff auf die CSV-Dateien (`material.csv`, `einheit.csv`, `teste_db.csv`, `materw_umsetz.csv`)
- Schreibrechte im Projektverzeichnis

## Workflow

Der typische Workflow für die Datenaktualisierung ist:

1. Aktuelle CSV-Dateien aus dem Laborinformationssystem exportieren
2. `ConvertAllCsvToJson.ps1` ausführen, um alle JSON-Dateien zu aktualisieren
3. `UpdateMaterialCSS.ps1` ausführen, um die CSS-Klassen für Material-Badges zu aktualisieren

## Skriptdetails

### ConvertAllCsvToJson.ps1

Dieses Hauptskript orchestriert den gesamten Konvertierungsprozess:

- Erstellt Backups der vorhandenen JSON-Dateien
- Führt `GenerateMaterialExtensionMapping.ps1` aus (falls erforderlich)
- Führt die einzelnen Konvertierungsskripte in der richtigen Reihenfolge aus

```powershell
# Verwendung:
pwsh -ExecutionPolicy Bypass -File ConvertAllCsvToJson.ps1
```

### ConvertMaterialCsvToJson.ps1

Dieses Skript konvertiert die Material-Daten aus der `material.csv` und `materw_umsetz.csv` in die `material.json`:

- Liest Material-Daten aus `material.csv`
- Liest Material-Erweiterungen aus `materw_umsetz.csv`
- Generiert eine strukturierte JSON-Datei mit allen Material-Varianten
- Fügt Farb-IDs und Lagerungsinformationen hinzu

**Mapping-Details:**
- `material_id`: Generiert aus Material-Kürzel und Erweiterung (z.B. "SE-00")
- `material_bezeichnung`: Aus `MATERIAL_ANZ`
- `material_kurz`: Aus `MAT_KUERZEL`
- `material_farbe`: Ermittelt aus Farben-Mapping basierend auf `FARBEN_ID`
- `farben_id`: Direkt aus `FARBEN_ID`
- `lagerung`: Standardwerte basierend auf Materialtyp

```powershell
# Verwendung:
pwsh -ExecutionPolicy Bypass -File ConvertMaterialCsvToJson.ps1
```

### ConvertEinheitCsvToJson.ps1

Dieses Skript konvertiert die Einheiten-Daten aus der `einheit.csv` in die `einheiten.json`:

- Liest Einheiten-Daten aus `einheit.csv`
- Normalisiert die Einheiten-IDs
- Generiert eine strukturierte JSON-Datei

**Mapping-Details:**
- `einheit_id`: Generiert als "E" + Einheiten-ID (z.B. "E36")
- `einheit_id_db`: Original-ID aus der Datenbank
- `bezeichnung`: Aus `EINHEIT_ANZ`
- `beschreibung`: Standardwert "noch keine Angabe"
- `kategorie`: Standardwert "noch keine Angabe"

```powershell
# Verwendung:
pwsh -ExecutionPolicy Bypass -File ConvertEinheitCsvToJson.ps1
```

### ConvertTesteCsvToJson.ps1

Dieses Skript konvertiert die Test-Daten aus der `teste_db.csv` in die `tests.json`:

- Liest Test-Daten aus `teste_db.csv`
- Lädt Material-Mapping aus `material.json`
- Lädt Einheiten-Mapping aus `einheiten.json`
- Generiert eine strukturierte JSON-Datei mit allen Tests

**Mapping-Details:**
- `id`: Formatiert aus `TEST_NR` (z.B. "T0003")
- `name`: Aus `NAME_BEFUND_LANG`
- `kategorie`: Ermittelt aus `ARBEITSPLATZ_ID` über ein definiertes Mapping
- `material`: Array aus zugehörigen Material-IDs, ermittelt über `MATERIAL_ID`
- `synonyme`: Array erstellt aus `NAME_KURZ_10`
- `aktiv`: Abgeleitet aus `NICHTANFORDERBAR` (invertiert)
- `einheit_id`: Verknüpft über `EINHEIT_ID` und das Einheiten-Mapping
- `befundzeit`: Zufällig generiert zwischen 1-5 Stunden
- Standardwerte für `loinc`, `mindestmenge_ml`, etc.

```powershell
# Verwendung:
pwsh -ExecutionPolicy Bypass -File ConvertTesteCsvToJson.ps1
```

### GenerateMaterialExtensionMapping.ps1

Hilfsskript zur Generierung der Material-Erweiterungs-Zuordnungen:

- Wird nur benötigt, wenn `materw_umsetz.csv` nicht existiert
- Generiert eine Tabelle der Material-Erweiterungen basierend auf bekannten Materialtypen
- Normalerweise nicht manuell aufgerufen, sondern durch `ConvertAllCsvToJson.ps1`

```powershell
# Verwendung (falls manuell benötigt):
pwsh -ExecutionPolicy Bypass -File GenerateMaterialExtensionMapping.ps1
```

### UpdateMaterialCSS.ps1

Hilfsskript zur Generierung der CSS-Klassen für Material-Badges:

- Liest die Material-Daten aus `material.json`
- Liest die Farben-Definitionen aus `farben.json`
- Generiert CSS-Klassen für jedes Material und jede Farben-ID
- Bereinigt ungültige Zeichen in CSS-Selektoren
- Speichert die generierte CSS-Datei in `src/styles/material-badges.css`
- Erstellt ein Backup der vorherigen CSS-Datei

```powershell
# Verwendung:
pwsh -ExecutionPolicy Bypass -File UpdateMaterialCSS.ps1
```

## Datenstruktur und Mapping

### Material-Datenmapping

| JSON-Feld           | CSV-Spalte      | Bemerkung                                   |
|---------------------|-----------------|---------------------------------------------|
| material_id         | MATERIAL_ID     | Nur als Referenz für Mapping (nicht angezeigt) |
| material_bezeichnung | MATERIAL_ANZ   | Name des Materials                          |
| material_kurz       | MAT_KUERZEL     | Kurzbezeichnung                             |
| material_farbe      | -               | Abgeleitet aus farben_id                    |
| farben_id          | FARBEN_ID       | Aus materw_umsetz.csv                      |
| material_erweiterung | MAT_ERWEITERUNG | Aus materw_umsetz.csv                      |
| lagerung            | -               | Standardwert basierend auf Materialtyp       |
| probenroehre        | MATERIAL_ANZ    | Material-Bezeichnung + "-Röhrchen"          |
| praekanalytik       | -               | Standardwert "noch keine Angabe"             |

### Einheiten-Datenmapping

| JSON-Feld    | CSV-Spalte   | Bemerkung                           |
|--------------|--------------|-------------------------------------|
| einheit_id   | EINHEIT_ID   | Format: "E" + ID                    |
| einheit_id_db | EINHEIT_ID  | Original-ID zur Referenz            |
| bezeichnung  | EINHEIT_ANZ  | Name der Einheit                    |
| beschreibung | -            | Standardwert "noch keine Angabe"     |
| kategorie    | -            | Standardwert "noch keine Angabe"     |

### Test-Datenmapping

| JSON-Feld      | CSV-Spalte       | Bemerkung                          |
|----------------|------------------|-----------------------------------|
| id             | TEST_NR          | Format: "T" + vierstellige Zahl   |
| name           | NAME_BEFUND_LANG | Name des Tests                    |
| kategorie      | ARBEITSPLATZ_ID  | Mapping über definierte Tabelle   |
| material       | MATERIAL_ID      | Mapping über material.json        |
| synonyme       | NAME_KURZ_10     | Als Array                         |
| aktiv          | NICHTANFORDERBAR | Invertiert (kein Wert = aktiv)    |
| einheit_id     | EINHEIT_ID       | Mapping über einheiten.json       |
| befundzeit     | -                | Zufällig 1-5 Stunden              |
| loinc          | -                | Standardwert "folgt"               |
| mindestmenge_ml | -               | Standardwert 0.5                   |
| lagerung       | -                | Standardwert "Standard"            |
| dokumente      | -                | Leeres Array                       |
| hinweise       | -                | Leeres Array                       |
| ebm            | -                | Leerer String                      |
| goae           | -                | Leerer String                      |

## Farben-Mapping

Die Farben-IDs werden wie folgt gemappt:

| ID    | Farbe   | Hex-Wert | Text-Farbe |
|-------|---------|----------|------------|
| 1     | Gelb    | #FFEB3B  | black      |
| 2     | Grün    | #4CAF50  | white      |
| 3     | Rot     | #F44336  | white      |
| 4     | Blau    | #2196F3  | white      |
| 8     | Braun   | #795548  | white      |
| 12    | Lila    | #9C27B0  | white      |
| 124   | Orange  | #FF9800  | black      |
| 128   | Weiß    | #FFFFFF  | black      |

## Tipps und Tricks

1. **Backup-Dateien**: Alle Skripte erstellen automatisch Backups der vorhandenen JSON-Dateien vor der Konvertierung. Diese werden im Format `backups_YYYY-MM-DD-HH-MM-SS` gespeichert.

2. **Fehlerbehandlung**: Bei Fehlern während der Konvertierung werden entsprechende Meldungen angezeigt. Überprüfen Sie die CSV-Dateien auf Konsistenz und Format.

3. **CSS-Regenerierung**: Wenn Sie die Material-Daten aktualisieren, sollten Sie immer auch `UpdateMaterialCSS.ps1` ausführen, um die CSS-Klassen zu aktualisieren.

4. **Material-Erweiterungen**: Wenn neue Material-Typen hinzugefügt werden, müssen entsprechende Einträge in `materw_umsetz.csv` vorhanden sein, damit sie korrekt konvertiert werden.

5. **Kategorie-Mapping**: Das Mapping der Arbeitsplatz-IDs zu Kategorien ist hart codiert im Skript `ConvertTesteCsvToJson.ps1`. Bei Änderungen an den Arbeitsplätzen muss dieses Mapping angepasst werden.

## Häufige Probleme und Lösungen

1. **Problem**: Einige Tests haben keine Materialien zugeordnet.
   **Lösung**: Überprüfen Sie, ob die Material-IDs in der `teste_db.csv` korrekte Verweise auf Einträge in der `material.csv` sind.

2. **Problem**: CSS-Styles werden nicht korrekt angewendet.
   **Lösung**: Führen Sie `UpdateMaterialCSS.ps1` aus, um die CSS-Klassen zu aktualisieren.

3. **Problem**: Unbekannte oder fehlende Farben-IDs.
   **Lösung**: Ergänzen Sie das Farben-Mapping in `ConvertMaterialCsvToJson.ps1` und aktualisieren Sie die `farben.json`-Datei entsprechend.

4. **Problem**: Ungültige Zeichen in CSS-Selektoren.
   **Lösung**: Das `UpdateMaterialCSS.ps1`-Skript bereinigt automatisch ungültige Zeichen in CSS-Selektoren. Überprüfen Sie bei Problemen die Daten in der `material.json`.

## Weitere Entwicklung

Die Skripte können bei Bedarf erweitert werden, um zusätzliche Daten wie Referenzbereiche, Abrechnungsziffern oder weitere Metadaten zu importieren. Dafür müssten jedoch entsprechende CSV-Dateien und Mapping-Definitionen erstellt werden.
