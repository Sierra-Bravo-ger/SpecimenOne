# Input- und Output-Pfade
$csvPath = "test_prof_nachfo.csv"
$profileJsonPath = "public/profile.json"

Write-Host "Starte Import von Test-Profil-Nachfolgern aus $csvPath..."

# Funktion: Formatiere die Test-ID aus TEST_NR (übernommen aus ConvertTesteCsvToJson.ps1)
function Format-TestId {
    param(
        [Parameter(Mandatory=$true)]
        [string]$testNr,
        
        [Parameter(Mandatory=$false)]
        [int]$digits = 4  # Standard: 4 Stellen, für zukünftige Erweiterung auf 5 vorbereitet
    )
    
    # Entferne Dezimalstellen, falls vorhanden
    if ($testNr -match '(\d+),\d+') {
        $testNr = $matches[1]
    } elseif ($testNr -match '(\d+)\.0') {
        $testNr = $matches[1]
    } elseif ($testNr -match '(\d+)\..*') {
        $testNr = $matches[1]  # Entferne alle Dezimalstellen
    }
    
    # Prüfe, ob 5 Stellen nötig sind
    if ($testNr.Length -ge 5 -or [int]$testNr -ge 10000) {
        $digits = 5
    }
    
    # Formatiere als 'T' + vierstellige/fünfstellige Zahl
    return "T" + $testNr.PadLeft($digits, '0')
}

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    Write-Host "$($csv.Count) Einträge aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Bestehende Profile laden
try {
    if (Test-Path $profileJsonPath) {
        $profiles = Get-Content -Path $profileJsonPath -Raw | ConvertFrom-Json
        Write-Host "$(($profiles | Measure-Object).Count) bestehende Profile geladen."
    } else {
        Write-Host "Keine bestehende profile.json gefunden, erstelle neue Datei." -ForegroundColor Yellow
        $profiles = @()
    }
} catch {
    Write-Host "Fehler beim Laden der bestehenden Profile: $_" -ForegroundColor Red
    exit 1
}

# Gruppieren der CSV nach TEST_PROFIL_NR
$groupedProfiles = $csv | Group-Object -Property TEST_PROFIL_NR

# Für jedes Profil die Tests sammeln und Profil erstellen/aktualisieren
foreach ($group in $groupedProfiles) {
    $profilNr = $group.Name.Replace(',', '.')  # Dezimalkomma in Dezimalpunkt umwandeln
    $profilId = "P" + [int]$profilNr  # Profil-ID formatieren (z.B. P123)
    
    # Prüfen, ob dieses Profil bereits existiert
    $existingProfile = $profiles | Where-Object { $_.id -eq $profilId }
    
    if ($existingProfile) {
        Write-Host "Aktualisiere vorhandenes Profil $profilId" -ForegroundColor Yellow
        
        # Bestehende Tests behalten und neue hinzufügen
        $tests = @($existingProfile.tests)
        $name = $existingProfile.name
        $beschreibung = $existingProfile.beschreibung
        $kategorie = $existingProfile.kategorie
    } else {
        Write-Host "Erstelle neues Profil $profilId" -ForegroundColor Green
        $tests = @()
        
        # Für neue Profile Standardwerte setzen
        $firstItem = $group.Group[0]
        $name = $firstItem.NAME_KURZ
        $beschreibung = $firstItem.NAME_KURZ  # Verwende NAME_KURZ auch als Beschreibung
        $kategorie = "Sonstige"  # Standardkategorie
    }
    
    # Sortierung übernehmen
    $sortierNummer = $group.Group[0].ANZEIGE_NR.Replace(',', '.')
    if ([string]::IsNullOrEmpty($sortierNummer) -or $sortierNummer -eq "0") {
        $sortierNummer = 999  # Standardwert wenn keine Sortierung angegeben
    } else {
        try {
            $sortierNummer = [int]$sortierNummer
        } catch {
            $sortierNummer = 999
        }
    }
    
    # Tests aus der Gruppe sammeln
    foreach ($item in $group.Group) {
        if (-not [string]::IsNullOrEmpty($item.TEST_NR)) {
            $testId = Format-TestId -testNr $item.TEST_NR
            
            # Test nur hinzufügen wenn nicht bereits vorhanden
            if (-not $tests.Contains($testId)) {
                $tests += $testId
            }
        }
    }
    
    # Profil erstellen oder aktualisieren
    if ($existingProfile) {
        # Vorhandenes Profil aktualisieren
        $existingProfile.tests = $tests
        $existingProfile.sortierNummer = $sortierNummer
    } else {
        # Neues Profil erstellen
        $newProfile = [PSCustomObject]@{
            id = $profilId
            name = $name
            beschreibung = $beschreibung
            kategorie = $kategorie
            sortierNummer = $sortierNummer
            tests = $tests
        }
        
        # Zum Array hinzufügen
        $profiles += $newProfile
    }
}

# Sortiere Profile nach sortierNummer
$profiles = $profiles | Sort-Object -Property sortierNummer

# JSON speichern
try {
    # Backup der alten Datei erstellen, wenn vorhanden
    if (Test-Path $profileJsonPath) {
        $backupPath = "backups_$(Get-Date -Format yyyy-MM-dd-HH-mm-ss)"
        if (-not (Test-Path $backupPath)) {
            New-Item -ItemType Directory -Path $backupPath | Out-Null
        }
        Copy-Item -Path $profileJsonPath -Destination "$backupPath/profile.json"
        Write-Host "Backup der alten profile.json erstellt: $backupPath/profile.json" -ForegroundColor Gray
    }
    
    # Array in JSON-Format konvertieren und speichern
    $jsonContent = $profiles | ConvertTo-Json -Depth 10
    Set-Content -Path $profileJsonPath -Value $jsonContent -Encoding UTF8
    Write-Host "Profile erfolgreich in $profileJsonPath gespeichert." -ForegroundColor Green
    Write-Host "$(($profiles | Measure-Object).Count) Profile insgesamt in der JSON-Datei."
} catch {
    Write-Host "Fehler beim Speichern der JSON-Datei: $_" -ForegroundColor Red
}
