#!/usr/bin/env pwsh
# QueryTestsWithDuckDB.ps1
# Dieses Skript demonstriert die Verwendung von DuckDB für die Analyse der tests.json-Datei
# Autor: Copilot
# Datum: 02.05.2025

# Stellen Sie sicher, dass die erforderlichen Module verfügbar sind
# Legt den Pfad zur tests.json-Datei fest
$testsJsonPath = "./public/tests.json"

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

# Funktion zum Ausführen einer SQL-Abfrage und Anzeigen der Ergebnisse
function Invoke-DuckDBQuery {
    param (
        [string]$SqlQuery,
        [string]$Description
    )

    Write-Host "`n$Description" -ForegroundColor Cyan
    Write-Host "SQL: $SqlQuery" -ForegroundColor DarkGray
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
      # Führt die Abfrage mit DuckDB aus und formatiert die Ausgabe mit dünnen Linien
    $result = duckdb -c "$SqlQuery" -ascii | Out-String
    
    # Gibt das Ergebnis aus
    Write-Host $result
}

# Beispielabfragen

# 1. Zählt alle Tests in der Datenbank
$query1 = "SELECT COUNT(*) AS AnzahlTests FROM read_json_auto('./public/tests.json');"
Invoke-DuckDBQuery -SqlQuery $query1 -Description "1. Anzahl Tests in der Datenbank"

# 2. Zählt Tests pro Kategorie
$query2 = "SELECT kategorie, COUNT(*) AS AnzahlTests FROM read_json_auto('./public/tests.json') GROUP BY kategorie ORDER BY AnzahlTests DESC;"
Invoke-DuckDBQuery -SqlQuery $query2 -Description "2. Anzahl Tests pro Kategorie"

# 3. Findet Tests mit bestimmten Materialien (z.B. Serum)
$query3 = "SELECT id, name, material FROM read_json_auto('./public/tests.json') WHERE CONTAINS(material, 'SE-00') LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query3 -Description "3. Tests, die Serum (SE-00) als Material verwenden (Top 10)"

# 4. Durchschnittliche Mindestmenge pro Materialtyp
$query4 = "SELECT unnest AS Material, AVG(t.mindestmenge_ml) AS DurchschnittlicheMindestmengeMl, COUNT(*) AS AnzahlTests FROM read_json_auto('./public/tests.json') t, UNNEST(t.material) GROUP BY unnest ORDER BY AnzahlTests DESC LIMIT 15;"
Invoke-DuckDBQuery -SqlQuery $query4 -Description "4. Durchschnittliche Mindestmenge pro Materialtyp (Top 15)"

# 5. Sucht nach einem bestimmten Test anhand von ID oder Namen
$suchbegriff = "T9" # Hier könnte später eine Benutzereingabe eingesetzt werden
$query5 = "SELECT id, name, kategorie, material FROM read_json_auto('./public/tests.json') WHERE id LIKE '%$suchbegriff%' OR name LIKE '%$suchbegriff%' LIMIT 20;"
Invoke-DuckDBQuery -SqlQuery $query5 -Description "5. Suche nach Tests mit '$suchbegriff' in ID oder Name"

# 6. Findet Tests mit den meisten Synonymen
$query6 = "SELECT id, name, ARRAY_LENGTH(synonyme) AS AnzahlSynonyme, synonyme FROM read_json_auto('./public/tests.json') ORDER BY AnzahlSynonyme DESC LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query6 -Description "6. Top 10 Tests mit den meisten Synonymen"

# 7. Verteilung der Befundzeiten
$query7 = "SELECT befundzeit, COUNT(*) AS AnzahlTests FROM read_json_auto('./public/tests.json') GROUP BY befundzeit ORDER BY AnzahlTests DESC;"
Invoke-DuckDBQuery -SqlQuery $query7 -Description "7. Verteilung der Befundzeiten"

# 8. Zeigt inaktive Tests an (falls vorhanden)
$query8 = "SELECT id, name, kategorie FROM read_json_auto('./public/tests.json') WHERE aktiv = false LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query8 -Description "8. Inaktive Tests (falls vorhanden)"

# 9. Tests mit fehlenden Informationen (leere Felder)
$query9 = "SELECT id, name, kategorie FROM read_json_auto('./public/tests.json') 
WHERE material IS NULL OR array_length(material) = 0 OR befundzeit IS NULL OR mindestmenge_ml IS NULL 
ORDER BY kategorie LIMIT 15;"
Invoke-DuckDBQuery -SqlQuery $query9 -Description "9. Tests mit fehlenden Informationen"

# 10. Komplexe Materialanforderungen - Tests mit mehr als einem Material
$query10 = "SELECT id, name, material, array_length(material) AS AnzahlMaterialien 
FROM read_json_auto('./public/tests.json') 
WHERE array_length(material) > 1 
ORDER BY array_length(material) DESC LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query10 -Description "10. Tests mit mehreren Materialanforderungen"

# 11. Potenzielle Duplikate basierend auf ähnlichen Namen
$query11 = "WITH NormalizedNames AS (
    SELECT id, name, regexp_replace(lower(name), '[^a-zäöüß0-9]', '') AS normalized_name
    FROM read_json_auto('./public/tests.json') 
)
SELECT a.id AS Id1, a.name AS Name1, b.id AS Id2, b.name AS Name2
FROM NormalizedNames a
JOIN NormalizedNames b ON a.normalized_name = b.normalized_name AND a.id < b.id
LIMIT 10;"
Invoke-DuckDBQuery -SqlQuery $query11 -Description "11. Potenzielle Duplikate basierend auf ähnlichen Namen"

# 12. Kategorien-Analyse mit zusätzlichen Statistiken
$query12 = "SELECT 
    kategorie, 
    COUNT(*) AS AnzahlTests, 
    AVG(mindestmenge_ml) AS DurchschnittlicheMindestmenge,
    MIN(befundzeit) AS SchnellsteBefundzeit,
    MAX(befundzeit) AS LängsteBefundzeit
FROM read_json_auto('./public/tests.json')
GROUP BY kategorie
ORDER BY AnzahlTests DESC;"
Invoke-DuckDBQuery -SqlQuery $query12 -Description "12. Erweiterte Statistiken pro Kategorie"

Write-Host "`nDiese Beispielabfragen zeigen die Mächtigkeit von DuckDB bei der Analyse von JSON-Daten." -ForegroundColor Green
Write-Host "Du kannst diese Abfragen anpassen und erweitern, um deine spezifischen Anforderungen zu erfüllen." -ForegroundColor Green
Write-Host "Für die Integration in deine Anwendung empfehle ich die Verwendung der DuckDB-Bibliothek für Node.js oder Python." -ForegroundColor Green
Write-Host "Bei fehlerhafter Darstellung der Ausgabe in PowerShell folgenden Befehl ausführen:" -ForegroundColor Green
Write-Host "$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8" -ForegroundColor Yellow
