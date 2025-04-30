# ConvertNormwerteCsvToJson.ps1
# Konvertiert Normwerte_info.csv in das referenzwerte.json Format

# Input- und Output-Pfade
$csvPath = "Normwerte_info.csv"
$jsonPath = "public/referenzwerte.json"
$testsJsonPath = "public/tests.json" # Zum Referenz-Check

Write-Host "SpecimenOne Normwerte CSV zu JSON Konverter" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starte Import von Normwerte-CSV-Daten aus $csvPath..."

# Funktion zum Formatieren der Test-ID wie in ConvertTesteCsvToJson.ps1
function Format-TestId {
    param(
        [Parameter(Mandatory=$true)]
        [string]$testNr,
        
        [Parameter(Mandatory=$false)]
        [int]$digits = 4  # Standard: 4 Stellen, kann auf 5 erhöht werden
    )
    
    # Entferne Dezimalstellen und ersetze Komma durch Punkt für einheitliche Behandlung
    $testNr = $testNr -replace ',', '.'
    if ($testNr -match '(\d+)\.0') {
        $testNr = $matches[1]
    } elseif ($testNr -match '(\d+)\..*') {
        $testNr = $matches[1]  # Entferne alle Dezimalstellen
    }
    
    # Formatiere als 'T' + vierstellige/fünfstellige Zahl
    return "T" + $testNr.PadLeft($digits, '0')
}

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";" -Encoding Default
    Write-Host "$($csv.Count) Normwerte-Einträge aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Vorhandene Tests laden, um Existenz zu prüfen
$testsJson = Get-Content -Path $testsJsonPath -Raw | ConvertFrom-Json
$existingTestIds = @{}
$maxTestNumber = 0

foreach ($test in $testsJson) {
    $existingTestIds[$test.id] = $true
    
    # Extrahiere die Nummer aus der Test-ID
    if ($test.id -match 'T(\d+)') {
        $testNumber = [int]$matches[1]
        if ($testNumber -gt $maxTestNumber) {
            $maxTestNumber = $testNumber
        }
    }
}

# Bestimme die benötigte Anzahl an Stellen (4 oder 5)
$requiredDigits = 4
if ($maxTestNumber -ge 10000) {
    $requiredDigits = 5
    Write-Host "5-stellige Test-IDs erkannt, verwende Format T00000." -ForegroundColor Yellow
} else {
    $maxTestFromNormwerte = 0
    foreach ($row in $csv) {
        if ($row.TEST_NR -match '(\d+),') {
            $testNumber = [int]$matches[1]
            if ($testNumber -gt $maxTestFromNormwerte) {
                $maxTestFromNormwerte = $testNumber
            }
        }
    }
    
    if ($maxTestFromNormwerte -ge 10000) {
        $requiredDigits = 5
        Write-Host "Große Test-Nummern in Normwerte erkannt, verwende Format T00000." -ForegroundColor Yellow
    } else {
        Write-Host "Verwende Standard-Format T0000 für Test-IDs." -ForegroundColor Green
    }
}

# Normwerte gruppieren nach Test-ID
$normwerteByTestId = @{}

foreach ($row in $csv) {
    # Test-ID formatieren mit der ermittelten Anzahl an Stellen
    $testId = Format-TestId -testNr $row.TEST_NR -digits $requiredDigits
    
    # Geschlecht umwandeln: "m" -> 1000, "w" -> 2000, "u" -> 3000
    $geschlechtCode = switch ($row.GESCHLECHT.Trim()) {
        "m" { 1000 }
        "w" { 2000 }
        "u" { 3000 }
        default { 3000 } # Default = unisex
    }
    
    # Altersberechnung
    $alterVon = 0
    $alterBis = 999
    
    # Wenn konkrete Alterswerte vorhanden, diese verwenden
    if ($row.BIS_ALTER -match '\d+') {
        $alterBis = [int]($row.BIS_ALTER -replace ',', '.')
        # Wenn 999, dann maximales Alter
        if ($alterBis -eq 999) { $alterBis = 99 }
    }
    
    # Weitere Altersdifferenzierungen
    if ($row.BIS_ALTER_JAHRE -match '\d+') {
        $alterBis = [int]($row.BIS_ALTER_JAHRE -replace ',', '.')
    }
    
    if ($row.BIS_ALTER_MONATE -match '\d+') {
        # Monate in Jahre umrechnen
        $alterBis = [math]::Round([double]($row.BIS_ALTER_MONATE -replace ',', '.') / 12, 2)
    }
    
    if ($row.BIS_ALTER_TAGE -match '\d+') {
        # Tage in Jahre umrechnen
        $alterBis = [math]::Round([double]($row.BIS_ALTER_TAGE -replace ',', '.') / 365, 2)
    }    # Wertegrenzen (kommas durch punkte ersetzen für korrektes JSON-Format)
    $untereGrenze = if ($row.NORMALWERT_VON -match '\d') { 
        [double]($row.NORMALWERT_VON -replace ',', '.') 
    } else { $null }
    
    $obereGrenze = if ($row.NORMALWERT_BIS -match '\d') { 
        [double]($row.NORMALWERT_BIS -replace ',', '.') 
    } else { $null }
    
    # Besondere Bedingung/Beurteilung aus dem Feld BEURTEILUNG
    $besondereBedingung = $null
    if (-not [string]::IsNullOrWhiteSpace($row.BEURTEILUNG)) {
        $besondereBedingung = $row.BEURTEILUNG.Trim()
    }
    
    # Präfix für einseitige Grenzwerte hinzufügen
    $anzeigeLabel = $null
    if ($untereGrenze -ne $null -and $obereGrenze -eq $null) {
        # Nur untere Grenze vorhanden -> ">" Zeichen
        $anzeigeLabel = "> $untereGrenze"
    } elseif ($untereGrenze -eq $null -and $obereGrenze -ne $null) {
        # Nur obere Grenze vorhanden -> "<" Zeichen
        $anzeigeLabel = "< $obereGrenze"
    }
      # Normwert-Eintrag erstellen
    $normwert = @{
        "Alter_von" = $alterVon
        "Alter_bis" = $alterBis
        "Geschlecht" = $geschlechtCode
        "Wert_untere_Grenze" = $untereGrenze
        "Wert_obere_Grenze" = $obereGrenze 
        "Schwangerschaft" = $null
        "Besondere_Bedingung" = $besondereBedingung
        "Anzeige_Label" = $anzeigeLabel
    }
    
    # Zum Array für diesen Test hinzufügen
    if (-not $normwerteByTestId.ContainsKey($testId)) {
        $normwerteByTestId[$testId] = @()
    }
    $normwerteByTestId[$testId] += $normwert
}

# Ausgabe erstellen
$outputJson = @{}

# Für jeden Test die Normwerte speichern
$foundTestCount = 0
$missingTestCount = 0

foreach ($testId in $normwerteByTestId.Keys | Sort-Object) {
    # Prüfen, ob der Test in tests.json existiert
    if ($existingTestIds.ContainsKey($testId)) {
        $outputJson[$testId] = $normwerteByTestId[$testId]
        $foundTestCount++
    } else {
        Write-Host "Warnung: Test $testId existiert nicht in tests.json" -ForegroundColor Yellow
        $missingTestCount++
    }
}

Write-Host "$foundTestCount Tests aus der Normwerte_info.csv wurden in der tests.json gefunden."
if ($missingTestCount -gt 0) {
    Write-Host "$missingTestCount Tests aus der Normwerte_info.csv wurden NICHT in der tests.json gefunden." -ForegroundColor Yellow
}

# JSON speichern
$jsonContent = $outputJson | ConvertTo-Json -Depth 10
Set-Content -Path $jsonPath -Value $jsonContent -Encoding UTF8

Write-Host ""
Write-Host "Normwerte erfolgreich in $jsonPath gespeichert." -ForegroundColor Green
Write-Host "Die Datei enthält Referenzwerte für $foundTestCount Tests."
