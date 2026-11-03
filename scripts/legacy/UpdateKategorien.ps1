# UpdateKategorien.ps1
# Dieses Skript aktualisiert die Kategorien in tests.json basierend auf dem Mapping in kategorie_mapping.json
# Autor: GitHub Copilot
# Datum: 01.05.2025

# Dateipfade
$testsJsonPath = "./public/tests.json"
$mappingJsonPath = "./public/kategorie_mapping.json"
$backupFolder = "./backups_$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"

# Funktion für farbige Textausgabe
function Write-ColorText($text, $color) {
    if ($null -eq $color) {
        Write-Host $text
    } else {
        Write-Host $text -ForegroundColor $color
    }
}

Write-ColorText "Kategorien-Update für Tests" "Cyan"
Write-ColorText "------------------------" "Cyan"

# Backup erstellen
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-ColorText "Backup-Ordner erstellt: $backupFolder" "Green"
}

Copy-Item -Path $testsJsonPath -Destination "$backupFolder/tests.json"
Write-ColorText "Backup der tests.json erstellt: $backupFolder/tests.json" "Green"

# Mapping laden
$mapping = Get-Content -Path $mappingJsonPath -Raw | ConvertFrom-Json
$mappingDict = @{}
foreach ($entry in $mapping.kategorie_mapping) {
    $mappingDict[$entry.alt] = $entry.neu
}

Write-ColorText "Kategorie-Mapping geladen: $($mappingDict.Count) Einträge" "Green"
Write-ColorText "Folgende Mappings werden angewendet:" "Yellow"
foreach ($key in $mappingDict.Keys) {
    Write-ColorText " • '$key' → '$($mappingDict[$key])'" "Yellow"
}

# Tests laden und aktualisieren
$tests = Get-Content -Path $testsJsonPath -Raw | ConvertFrom-Json
$updateCount = 0
$kategorieStats = @{}

foreach ($test in $tests) {
    $altKategorie = $test.kategorie
    if ($mappingDict.ContainsKey($altKategorie)) {
        $neuKategorie = $mappingDict[$altKategorie]
        $test.kategorie = $neuKategorie
        $updateCount++
        
        # Statistik führen
        if (-not $kategorieStats.ContainsKey($altKategorie)) {
            $kategorieStats[$altKategorie] = @{
                "count" = 0
                "neuKategorie" = $neuKategorie
                "beispiele" = @()
            }
        }
        
        $kategorieStats[$altKategorie].count++
        
        # Für die ersten 3 Tests jeder Kategorie Beispiele speichern
        if ($kategorieStats[$altKategorie].beispiele.Count -lt 3) {
            $kategorieStats[$altKategorie].beispiele += $test.name
        }
    }
}

Write-ColorText "`nInsgesamt $updateCount Tests aktualisiert:" "Green"
foreach ($altKategorie in $kategorieStats.Keys) {
    $stats = $kategorieStats[$altKategorie]
    Write-ColorText " • $($stats.count) Tests von '$altKategorie' zu '$($stats.neuKategorie)' geändert" "Cyan"
    
    if ($stats.beispiele.Count -gt 0) {
        Write-ColorText "   Beispiele: " -NoNewline
        Write-Host ($stats.beispiele -join ", ")
    }
}

# Tests speichern
$tests | ConvertTo-Json -Depth 10 | Set-Content -Path $testsJsonPath
Write-ColorText "`nAktualisierte Tests gespeichert in $testsJsonPath" "Green"

Write-ColorText "`nAbgeschlossen." "Cyan"
