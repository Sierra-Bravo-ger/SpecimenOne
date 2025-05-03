# UpdateKategorienKomplett.ps1
# Dieses Skript aktualisiert die Kategorien in tests.json und profile.json basierend auf dem Mapping in kategorie_mapping.json
# Autor: GitHub Copilot
# Datum: 01.05.2025

# Dateipfade
$testsJsonPath = "./public/tests.json"
$profileJsonPath = "./profile.json"
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

Write-ColorText "Komplettes Kategorien-Update" "Cyan"
Write-ColorText "------------------------" "Cyan"

# Backup erstellen
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-ColorText "Backup-Ordner erstellt: $backupFolder" "Green"
}

Copy-Item -Path $testsJsonPath -Destination "$backupFolder/tests.json"
Write-ColorText "Backup der tests.json erstellt: $backupFolder/tests.json" "Green"

Copy-Item -Path $profileJsonPath -Destination "$backupFolder/profile.json"
Write-ColorText "Backup der profile.json erstellt: $backupFolder/profile.json" "Green"

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

# TEIL 1: TESTS AKTUALISIEREN
Write-ColorText "`nUPDATE TESTS.JSON" "Magenta"
Write-ColorText "----------------" "Magenta"

# Tests laden und aktualisieren
$tests = Get-Content -Path $testsJsonPath -Raw | ConvertFrom-Json
$updateCountTests = 0
$kategorieStatsTests = @{}

foreach ($test in $tests) {
    $altKategorie = $test.kategorie
    if ($mappingDict.ContainsKey($altKategorie)) {
        $neuKategorie = $mappingDict[$altKategorie]
        $test.kategorie = $neuKategorie
        $updateCountTests++
        
        # Statistik aktualisieren
        if (!$kategorieStatsTests.ContainsKey($neuKategorie)) {
            $kategorieStatsTests[$neuKategorie] = 1
        } else {
            $kategorieStatsTests[$neuKategorie]++
        }
    } else {
        # Statistik für unveränderte Kategorien
        if (!$kategorieStatsTests.ContainsKey($altKategorie)) {
            $kategorieStatsTests[$altKategorie] = 1
        } else {
            $kategorieStatsTests[$altKategorie]++
        }
    }
}

Write-ColorText "$updateCountTests Tests aktualisiert" "Green"

# Statistik ausgeben
Write-ColorText "`nKategorieverteilung der Tests nach Update:" "Cyan"
foreach ($kat in $kategorieStatsTests.GetEnumerator() | Sort-Object -Property Key) {
    Write-ColorText " • $($kat.Key): $($kat.Value) Tests" "White"
}

# Tests speichern
$tests | ConvertTo-Json -Depth 10 | Set-Content -Path $testsJsonPath
Write-ColorText "Aktualisierte Tests gespeichert in $testsJsonPath" "Green"

# TEIL 2: PROFILE AKTUALISIEREN
Write-ColorText "`nUPDATE PROFILE.JSON" "Magenta"
Write-ColorText "------------------" "Magenta"

# Profile laden und aktualisieren
$profiles = Get-Content -Path $profileJsonPath -Raw | ConvertFrom-Json
$updateCountProfiles = 0
$kategorieStatsProfiles = @{}

foreach ($profile in $profiles) {
    $altKategorie = $profile.kategorie
    if ($mappingDict.ContainsKey($altKategorie)) {
        $neuKategorie = $mappingDict[$altKategorie]
        $profile.kategorie = $neuKategorie
        $updateCountProfiles++
        
        # Statistik aktualisieren
        if (!$kategorieStatsProfiles.ContainsKey($neuKategorie)) {
            $kategorieStatsProfiles[$neuKategorie] = 1
        } else {
            $kategorieStatsProfiles[$neuKategorie]++
        }
    } else {
        # Statistik für unveränderte Kategorien
        if (!$kategorieStatsProfiles.ContainsKey($altKategorie)) {
            $kategorieStatsProfiles[$altKategorie] = 1
        } else {
            $kategorieStatsProfiles[$altKategorie]++
        }
    }
}

Write-ColorText "$updateCountProfiles Profile aktualisiert" "Green"

# Statistik ausgeben
Write-ColorText "`nKategorieverteilung der Profile nach Update:" "Cyan"
foreach ($kat in $kategorieStatsProfiles.GetEnumerator() | Sort-Object -Property Key) {
    Write-ColorText " • $($kat.Key): $($kat.Value) Profile" "White"
}

# Profile speichern
$profiles | ConvertTo-Json -Depth 10 | Set-Content -Path $profileJsonPath
Write-ColorText "Aktualisierte Profile gespeichert in $profileJsonPath" "Green"

Write-ColorText "`nZusammenfassung:" "Cyan" 
Write-ColorText "• $updateCountTests Tests aktualisiert" "White"
Write-ColorText "• $updateCountProfiles Profile aktualisiert" "White"
Write-ColorText "• $(($updateCountTests + $updateCountProfiles)) Einträge insgesamt aktualisiert" "White"
Write-ColorText "`nAbgeschlossen." "Cyan"
