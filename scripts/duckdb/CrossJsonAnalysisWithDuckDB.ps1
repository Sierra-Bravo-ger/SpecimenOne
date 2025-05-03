#!/usr/bin/env pwsh
# CrossJsonAnalysisWithDuckDB.ps1
# Dieses Skript demonstriert die Verwendung von DuckDB für die relationale Analyse zwischen verschiedenen JSON-Dateien
# Autor: Copilot
# Datum: 02.05.2024

# Stellen Sie sicher, dass die erforderlichen JSON-Dateien für die Analyse existieren
$jsonFiles = @(
    "./public/tests.json",
    "./public/material.json",
    "./public/farben.json",
    "./public/kategorie_mapping.json"
)

# Prüft, ob DuckDB CLI installiert ist
function Test-DuckDBInstalled {
    try {
        $null = Get-Command duckdb -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Wenn DuckDB nicht installiert ist, gibt eine Nachricht aus
if (-not (Test-DuckDBInstalled)) {
    Write-Host "DuckDB ist nicht installiert. Bitte installiere DuckDB über: https://duckdb.org/docs/installation/" -ForegroundColor Red
    Write-Host "Alternativ kannst du es mit 'scoop install duckdb' oder 'winget install duckdb' installieren" -ForegroundColor Yellow
    exit 1
}

# Prüft, ob alle erforderlichen JSON-Dateien existieren
foreach ($jsonFile in $jsonFiles) {
    if (-not (Test-Path $jsonFile)) {
        Write-Host "Die Datei $jsonFile konnte nicht gefunden werden. Bitte überprüfe den Pfad." -ForegroundColor Red
        exit 1
    }
}

# Funktion zum Ausführen einer SQL-Abfrage und Anzeigen der Ergebnisse
function Invoke-DuckDBQuery {
    param (
        [string]$SqlQuery,
        [string]$Description
    )

    Write-Host "`n$Description" -ForegroundColor Cyan
    Write-Host "SQL: $SqlQuery" -ForegroundColor DarkGray
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
    
    # Führt die Abfrage direkt mit DuckDB aus und formatiert mit ASCII-Linien
    $result = duckdb -c "$SqlQuery" -ascii | Out-String
    
    # Gibt das Ergebnis aus
    Write-Host $result
}

Write-Host "Willkommen zu relationale Analysen mit DuckDB für SpecimenOne!" -ForegroundColor Green
Write-Host "Dieses Skript verbindet verschiedene JSON-Dateien für eine tiefere Analyse." -ForegroundColor Green
Write-Host "----------------------------------------------------------------------" -ForegroundColor Green

# Beispielabfragen für Übergreifende JSON-Analysen

# 1. Verbindet Tests und Materialtypen 
$query1 = "WITH 
  tests AS (SELECT * FROM read_json_auto('./public/tests.json'))
SELECT 
  t.id, 
  t.name, 
  t.kategorie, 
  unnest AS material_id
FROM 
  tests t, 
  UNNEST(t.material) 
LIMIT 15;"
Invoke-DuckDBQuery -SqlQuery $query1 -Description "1. Material-IDs für Tests (ohne Join)"

# 2. Analyse der Materialnutzung (nur tests.json) 
$query2 = "WITH 
  tests AS (SELECT * FROM read_json_auto('./public/tests.json'))
SELECT 
  unnest AS material_id,
  COUNT(*) AS AnzahlTests
FROM 
  tests, 
  UNNEST(material) 
GROUP BY material_id
ORDER BY AnzahlTests DESC
LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query2 -Description "2. Top 10 Materialien nach Nutzungshäufigkeit"

# 3. Kategorie-Analyse
$query3 = "WITH 
  tests AS (SELECT * FROM read_json_auto('./public/tests.json'))
SELECT 
  kategorie, 
  COUNT(*) AS AnzahlTests,
  AVG(mindestmenge_ml) AS DurchschnittlicheMindestmenge
FROM 
  tests
GROUP BY 
  kategorie
ORDER BY 
  AnzahlTests DESC;"
Invoke-DuckDBQuery -SqlQuery $query3 -Description "3. Detaillierte Kategoriestatistiken"

# 4. Komplexe Analyse: Verteilung von Tests über Materialien und Kategorien
$query4 = "WITH 
  tests AS (SELECT * FROM read_json_auto('./public/tests.json')),
  test_materials AS (
    SELECT
      t.id,
      t.kategorie,
      unnest AS material_id
    FROM 
      tests t,
      UNNEST(t.material)
  )
SELECT 
  kategorie,
  material_id,
  COUNT(*) AS test_count
FROM 
  test_materials
GROUP BY 
  kategorie, material_id
HAVING 
  COUNT(*) > 10
ORDER BY 
  kategorie, test_count DESC
LIMIT 20;"
Invoke-DuckDBQuery -SqlQuery $query4 -Description "4. Korrelation zwischen Materialtypen und Testkategorien"

# 5. Übergreifende Statistiken zur Datenqualität
$query5 = "WITH 
  tests AS (SELECT * FROM read_json_auto('./public/tests.json')),
  -- Tests mit potenziellen Datenqualitätsproblemen
  test_problems AS (
    SELECT
      COUNT(*) FILTER (WHERE array_length(material) = 0) AS tests_ohne_material,
      COUNT(*) FILTER (WHERE array_length(synonyme) = 0) AS tests_ohne_synonyme
    FROM tests
  )
SELECT 
  tp.tests_ohne_material,
  tp.tests_ohne_synonyme
FROM 
  test_problems tp;"
Invoke-DuckDBQuery -SqlQuery $query5 -Description "5. Datenqualitätsanalyse der tests.json"

# 6. Besondere Tests: Analysiert Tests mit ungewöhnlichen Werten
$query6 = "WITH tests AS (
    SELECT * FROM read_json_auto('./public/tests.json')
)
SELECT
    id,
    name,
    kategorie,
    mindestmenge_ml,
    array_length(material) AS anzahl_materialien,
    array_length(synonyme) AS anzahl_synonyme
FROM
    tests
WHERE
    mindestmenge_ml > 1.0 OR              -- Ungewöhnlich große Mindestmenge
    array_length(material) > 1 OR         -- Mehrere Materialien
    array_length(synonyme) > 4            -- Viele Synonyme
ORDER BY
    mindestmenge_ml DESC,
    array_length(material) DESC,
    array_length(synonyme) DESC
LIMIT 15;"
Invoke-DuckDBQuery -SqlQuery $query6 -Description "6. Tests mit ungewöhnlichen Eigenschaften"

Write-Host "`nDiese erweiterten Abfragen zeigen die Mächtigkeit von DuckDB für die übergreifende Analyse mehrerer JSON-Dateien." -ForegroundColor Green
Write-Host "Du kannst die relationalen Abfragen erweitern, um noch tiefere Einblicke in deine Daten zu erhalten." -ForegroundColor Green
Write-Host "Wenn du diese Analysen in deine Anwendung integrieren möchtest, empfehle ich die DuckDB-Bibliothek für Node.js oder Python." -ForegroundColor Green
Write-Host "Bei fehlerhafter Darstellung der Ausgabe in PowerShell folgenden Befehl ausführen:" -ForegroundColor Green
Write-Host "$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8" -ForegroundColor Yellow