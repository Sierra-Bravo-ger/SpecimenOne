#!/usr/bin/env pwsh
# PrettyTableQueryTest.ps1
# Dieses Skript demonstriert eine verbesserte Tabellenformatierung für DuckDB-Abfragen
# Autor: GitHub Copilot
# Datum: 03.05.2025

# Pfad zur tests.json Datei
$testsJsonPath = "./public/tests.json"

# Funktion zum Ausführen einer Abfrage und Formatieren der Ausgabe
function Invoke-FormattedQuery {
    param (
        [string]$SqlQuery,
        [string]$Description,
        [switch]$UseAscii = $true
    )

    Write-Host "`n$Description" -ForegroundColor Cyan
    Write-Host "SQL: $SqlQuery" -ForegroundColor DarkGray
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
    
    # Verwende die DuckDB-Standardformatierung mit ASCII-Flag für schönere Tabellen
    if ($UseAscii) {
        $result = duckdb -c "$SqlQuery" -ascii | Out-String
    } else {
        $result = duckdb -c "$SqlQuery" | Out-String
    }
    
    Write-Host $result
}

# Beispielabfragen

# 1. Zählt alle Tests in der Datenbank
$query1 = "SELECT COUNT(*) AS AnzahlTests FROM read_json_auto('$testsJsonPath');"
Invoke-FormattedQuery -SqlQuery $query1 -Description "1. Anzahl Tests in der Datenbank"

# 2. Zählt Tests pro Kategorie
$query2 = "SELECT kategorie, COUNT(*) AS AnzahlTests FROM read_json_auto('$testsJsonPath') GROUP BY kategorie ORDER BY AnzahlTests DESC;"
Invoke-FormattedQuery -SqlQuery $query2 -Description "2. Anzahl Tests pro Kategorie"

# 3. Findet Tests mit bestimmten Materialien (z.B. Serum)
$query3 = "SELECT id, name, material FROM read_json_auto('$testsJsonPath') WHERE CONTAINS(material, 'SE-00') LIMIT 10;"
Invoke-FormattedQuery -SqlQuery $query3 -Description "3. Tests, die Serum (SE-00) als Material verwenden (Top 10)"

# 4. Sucht nach einem bestimmten Test anhand von ID oder Namen
$suchbegriff = "T9999" # Hier könnte später eine Benutzereingabe eingesetzt werden
$query4 = "SELECT id, name, kategorie, material FROM read_json_auto('$testsJsonPath') WHERE id = '$suchbegriff' OR name LIKE '%$suchbegriff%' LIMIT 5;"
Invoke-FormattedQuery -SqlQuery $query4 -Description "4. Suche nach Tests mit '$suchbegriff' in ID oder Name"

Write-Host "`nDiese einfache Lösung mit dem DuckDB ASCII-Modus sorgt für schöne Tabellen in allen PowerShell-Umgebungen." -ForegroundColor Green
Write-Host "Bei fehlerhafter Darstellung der Ausgabe in PowerShell folgenden Befehl ausführen:" -ForegroundColor Green
Write-Host "`$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor DarkGray