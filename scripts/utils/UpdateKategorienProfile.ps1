# UpdateKategorienProfile.ps1
# Dieses Skript aktualisiert die Kategorien in profile.json basierend auf dem Mapping in kategorie_mapping.json
# Autor: GitHub Copilot
# Datum: 01.05.2025

# Dateipfade
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

Write-ColorText "Kategorien-Update für Profile" "Cyan"
Write-ColorText "------------------------" "Cyan"

# Backup erstellen
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-ColorText "Backup-Ordner erstellt: $backupFolder" "Green"
}

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

# Profile laden und aktualisieren
$profiles = Get-Content -Path $profileJsonPath -Raw | ConvertFrom-Json
$updateCount = 0
$kategorieStats = @{}

foreach ($profile in $profiles) {
    $altKategorie = $profile.kategorie
    if ($mappingDict.ContainsKey($altKategorie)) {
        $neuKategorie = $mappingDict[$altKategorie]
        Write-ColorText "Profil '$($profile.profilName)': Kategorie '$altKategorie' → '$neuKategorie'" "White"
        $profile.kategorie = $neuKategorie
        $updateCount++
        
        # Statistik aktualisieren
        if (!$kategorieStats.ContainsKey($neuKategorie)) {
            $kategorieStats[$neuKategorie] = 1
        } else {
            $kategorieStats[$neuKategorie]++
        }
    } else {
        # Statistik für unveränderte Kategorien
        if (!$kategorieStats.ContainsKey($altKategorie)) {
            $kategorieStats[$altKategorie] = 1
        } else {
            $kategorieStats[$altKategorie]++
        }
    }
}

Write-ColorText "`n$updateCount Profile aktualisiert" "Green"

# Statistik ausgeben
Write-ColorText "`nKategorieverteilung nach Update:" "Cyan"
foreach ($kat in $kategorieStats.GetEnumerator() | Sort-Object -Property Key) {
    Write-ColorText " • $($kat.Key): $($kat.Value) Profile" "White"
}

# Profile speichern
$profiles | ConvertTo-Json -Depth 10 | Set-Content -Path $profileJsonPath
Write-ColorText "`nAktualisierte Profile gespeichert in $profileJsonPath" "Green"

Write-ColorText "`nAbgeschlossen." "Cyan"
