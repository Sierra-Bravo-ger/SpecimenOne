# Input- und Output-Pfade
$csvPath = "teste_db.csv"
$jsonPath = "public/tests.json"
$materialJsonPath = "public/material.json"
$einheitenJsonPath = "public/einheiten.json"

Write-Host "Skript wird ausgeführt in: $(Get-Location)"
Write-Host "Starte Import von Tests-CSV-Daten aus $csvPath..."

# Liste der Felder, die bei existierenden Tests NICHT überschrieben werden sollen
$preservedFields = @("synonyme", "dokumente", "hinweise", "aktiv")

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    Write-Host "$($csv.Count) Tests aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Einlesen der Material-JSON und Einheiten-JSON für besseres Mapping
$materialMapping = @{}          # Material-Kürzel zu Material-ID Mapping
$materialDbIdMapping = @{}      # DB-Material-ID zu Material-IDs Mapping

try {
    $materialJson = Get-Content -Path $materialJsonPath -Raw | ConvertFrom-Json
    
    foreach ($material in $materialJson) {
        if ($material.kuerzel) {
            $materialMapping[$material.kuerzel] = $material.id
        }
        
        if ($material.db_id) {
            $material.db_id = [string]$material.db_id # Stelle sicher, dass die ID als String behandelt wird
            $materialDbIdMapping[$material.db_id] = $material.id
        }
    }
    
    Write-Host "Material-Mappings geladen: $($materialMapping.Count) Kürzel, $($materialDbIdMapping.Count) DB-IDs"
} catch {
    Write-Host "Warnung: Material-JSON konnte nicht geladen werden: $_" -ForegroundColor Yellow
}

# Einheiten-Mapping laden
$einheitenMapping = @{}

try {
    $einheitenJson = Get-Content -Path $einheitenJsonPath -Raw | ConvertFrom-Json
    
    foreach ($einheit in $einheitenJson) {
        if ($einheit.db_id) {
            $einheit.db_id = [string]$einheit.db_id # Stelle sicher, dass die ID als String behandelt wird
            $einheitenMapping[$einheit.db_id] = $einheit.id
        }
    }
    
    Write-Host "Einheiten-Mapping geladen: $($einheitenMapping.Count) Einheiten"
} catch {
    Write-Host "Warnung: Einheiten-JSON konnte nicht geladen werden: $_" -ForegroundColor Yellow
}

# Kategorien-Mapping
$kategorienMapping = @{
    "1" = "Klinische Chemie"
    "2" = "Hämatologie"
    "3" = "Serologie"
    "4" = "Sonstiges"
    "5" = "Mikrobiologie"
    "6" = "Virologie"
    "7" = "Pathologie"
    "8" = "Toxikologie"
    "9" = "Elektrophorese"
    "10" = "Immunologie"
    "11" = "Pathophysiologie"
    "12" = "Genetik"
    "13" = "Molekularbiologie"
    "14" = "Immunhämatologie"
    "15" = "Infektionsdiagnostik"
}

# Funktion: Kategorie aus DB-Wert ermitteln
function Get-Kategorie {
    param($test)
    
    # Versuche, eine Kategorie basierend auf TESTGRUPPE_ID zu finden
    if ($test.TESTGRUPPE_ID -and $kategorienMapping[$test.TESTGRUPPE_ID]) {
        return $kategorienMapping[$test.TESTGRUPPE_ID]
    }
    
    # Fallbacks basierend auf Namensteilen
    if ($test.NAME_KURZ -match "DIFF" -or $test.NAME_LANG -match "Differenzierung" -or $test.NAME_BEFUND -match "Differenzierung") {
        return "Hämatologie"
    }
    
    if ($test.NAME_KURZ -match "BAK" -or $test.NAME_LANG -match "Bakterien" -or $test.NAME_BEFUND -match "Bakterien") {
        return "Mikrobiologie"
    }
    
    if ($test.NAME_KURZ -match "VIRO" -or $test.NAME_LANG -match "Vir" -or $test.NAME_BEFUND -match "Vir") {
        return "Virologie"
    }
    
    if ($test.NAME_KURZ -match "TOX" -or $test.NAME_LANG -match "Toxik" -or $test.NAME_BEFUND -match "Toxik") {
        return "Toxikologie"
    }
    
    if ($test.NAME_KURZ -match "IMMUN" -or $test.NAME_LANG -match "Immun" -or $test.NAME_BEFUND -match "Immun") {
        return "Immunologie"
    }
    
    # Standard-Kategorie
    return "Klinische Chemie"
}

# Funktion: Formatiere die Test-ID aus TEST_NR
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
    
    # Formatiere als 'T' + vierstellige Zahl (oder mehr, wenn $digits > 4)
    return "T" + $testNr.PadLeft($digits, '0')
}

# Funktion: Generiere zufällige Befundzeit
function Get-RandomBefundzeit {
    $stunden = Get-Random -Minimum 1 -Maximum 6
    return "$stunden Stunden"
}

# Bestimmen der maximalen Test-Nummer für die Entscheidung 4/5-stellig
$maxTestNumber = 0
foreach ($row in $csv) {
    if ($row.TEST_NR -match '(\d+)') {
        $testNumber = [int]$matches[1]
        if ($testNumber -gt $maxTestNumber) {
            $maxTestNumber = $testNumber
        }
    }
}

# Entscheide ob 4 oder 5 Stellen nötig sind
$requiredDigits = 4
if ($maxTestNumber -ge 10000) {
    $requiredDigits = 5
    Write-Host "5-stellige Test-IDs erkannt, verwende Format T00000." -ForegroundColor Yellow
} else {
    Write-Host "Verwende Standard-Format T0000 für Test-IDs." -ForegroundColor Green
}

# Bestehende Tests laden, falls vorhanden
$existingTestsMap = @{}
if (Test-Path $jsonPath) {
    try {
        $existingTests = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
        Write-Host "Bestehende Tests geladen: $($existingTests.Length) Tests" -ForegroundColor Green
        
        foreach ($test in $existingTests) {
            $existingTestsMap[$test.id] = $test
        }
        
        Write-Host "Test-Map erstellt für bestehende Tests."
    } catch {
        Write-Host "Warnung: Bestehende Tests konnten nicht geladen werden: $_" -ForegroundColor Yellow
    }
}

# Umwandlung in die gewünschte JSON-Struktur
$tests = @()
$preservedTestCount = 0
$updatedTestCount = 0
$newTestCount = 0

foreach ($row in $csv) {
    # Test-ID formatieren basierend auf TEST_NR gemäß Mapping
    $testId = Format-TestId -testNr $row.TEST_NR -digits $requiredDigits
    
    # Name aus NAME_BEFUND_LANG gemäß Mapping
    $name = $row.NAME_BEFUND_LANG
    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = $row.NAME_LANG  # Fallback
        if ([string]::IsNullOrWhiteSpace($name)) {
            $name = $row.NAME_BEFUND  # Zweiter Fallback
            if ([string]::IsNullOrWhiteSpace($name)) {
                $name = $row.NAME_KURZ  # Dritter Fallback
            }
        }
    }
    
    # Material-IDs zuordnen, wenn vorhanden:
    # 1. Versuche MATERIAL_ID aus der CSV zu verwenden
    # 2. Fallback ist "SE-00" (Serum)
    $material = @("SE-00")  # Standard-Material
    
    if ($row.MATERIAL_ID -and $materialDbIdMapping[$row.MATERIAL_ID]) {
        $material = @($materialDbIdMapping[$row.MATERIAL_ID])
    }
    
    # Einheit-ID zuordnen (Format: "E" + ID)
    $einheitId = "E4445"  # Standard-Einheit
    
    if ($row.EINHEIT_ID -and $einheitenMapping[$row.EINHEIT_ID]) {
        $einheitId = $einheitenMapping[$row.EINHEIT_ID]
    } elseif ($row.EINHEIT_ID -match '^\d+$|^\d+,\d+$') {
        # Falls keine Mapping-Einheit gefunden, aber eine Nummer vorhanden ist, direkte Umwandlung
        $rawId = $row.EINHEIT_ID -replace ',', '.'  # Komma durch Punkt ersetzen
        # Schneide Dezimalstellen ab
        $rawId = [int][double]$rawId
        $einheitId = "E$rawId"
    }
    
    # Synonyme aus NAME_KURZ
    $synonyme = @()
    if (-not [string]::IsNullOrWhiteSpace($row.NAME_KURZ)) {
        $synonyme += $row.NAME_KURZ
    }
    
    # Kategorie zuordnen
    $kategorie = Get-Kategorie -test $row
    
    # Prüfen, ob dieser Test bereits existiert
    if ($existingTestsMap.ContainsKey($testId)) {
        $existingTest = $existingTestsMap[$testId]
        $logMessage = "Aktualisiere Test $testId ($name)"
        
        # Felder, die nicht überschrieben werden sollen, wenn bereits vorhanden
        if ($existingTest.synonyme -and $existingTest.synonyme.Count -gt 0) {
            $logMessage += ", behalte vorhandene Synonyme"
            $synonyme = $existingTest.synonyme
        }
        
        $dokumente = $existingTest.dokumente -or @()
        $hinweise = $existingTest.hinweise -or @()
        
        # Bestehenden Test aktualisieren, aber bestimmte Felder beibehalten
        $updatedTest = [ordered]@{
            id = $testId
            name = $name
            kategorie = $kategorie
            material = $material
            synonyme = $synonyme
            aktiv = [bool]($existingTest.aktiv -eq $null -or $existingTest.aktiv -eq $true) # Standardmäßig aktiv, es sei denn explizit deaktiviert
            einheit_id = $einheitId
            befundzeit = $existingTest.befundzeit -or (Get-RandomBefundzeit)
            durchfuehrung = $existingTest.durchfuehrung -or "Mo-Fr"
            loinc = $existingTest.loinc -or "folgt"
            mindestmenge_ml = $existingTest.mindestmenge_ml -or 0.5
            lagerung = $existingTest.lagerung -or "Standard"
            dokumente = $dokumente
            hinweise = $hinweise
            ebm = $existingTest.ebm -or ""
            goae = $existingTest.goae -or ""
        }
        
        $tests += [PSCustomObject]$updatedTest
        $preservedTestCount++
    } else {
        # Neuen Test erstellen
        $newTest = [ordered]@{
            id = $testId
            name = $name
            kategorie = $kategorie
            material = $material
            synonyme = $synonyme
            aktiv = $true
            einheit_id = $einheitId
            befundzeit = Get-RandomBefundzeit
            durchfuehrung = "Mo-Fr"
            loinc = "folgt"
            mindestmenge_ml = 0.5
            lagerung = "Standard"
            dokumente = @()
            hinweise = @()
            ebm = ""
            goae = ""
        }
        
        $tests += [PSCustomObject]$newTest
        $newTestCount++
    }
}

Write-Host "Verarbeitung abgeschlossen:"
Write-Host "- $preservedTestCount vorhandene Tests aktualisiert mit Beibehaltung manueller Änderungen"
Write-Host "- $newTestCount neue Tests hinzugefügt"
Write-Host "Insgesamt: $($tests.Count) Tests"

# Backup der alten Datei erstellen
if (Test-Path $jsonPath) {
    $backupDir = "backups_$(Get-Date -Format yyyy-MM-dd-HH-mm-ss)"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    $fileName = Split-Path $jsonPath -Leaf
    $backupPath = Join-Path $backupDir $fileName
    Copy-Item -Path $jsonPath -Destination $backupPath
    Write-Host "Backup erstellt: $backupPath" -ForegroundColor Gray
}

# Array in JSON-Format konvertieren und speichern
$jsonContent = $tests | ConvertTo-Json -Depth 10
Set-Content -Path $jsonPath -Value $jsonContent -Encoding UTF8

Write-Host "Tests erfolgreich in $jsonPath gespeichert." -ForegroundColor Green
