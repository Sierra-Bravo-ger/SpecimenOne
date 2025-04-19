# Input- und Output-Pfade
$csvPath = "Mappe1.csv"
$jsonPath = "tests_importiert$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).json"
$referenceJsonPath = "tests_orig.json" # Referenz-JSON für die Struktur

Write-Host "Starte Import von CSV-Daten..."

# CSV einlesen - mit flexiblen Trennzeichen
try {
    # Standardversuch mit Komma als Trennzeichen
    $csv = Import-Csv -Path $csvPath 
    
    # Wenn keine Spalten gefunden wurden, versuchen wir es mit Semikolon
    if ($csv.Count -gt 0 -and $csv[0].PSObject.Properties.Name.Count -le 1) {
        Write-Host "Versuche mit Semikolon als Trennzeichen..." -ForegroundColor Yellow
        $csv = Import-Csv -Path $csvPath -Delimiter ";" 
    }
} catch {
    # Fallback: Manuelles Parsen der CSV
    Write-Host "Standard-Import fehlgeschlagen, versuche manuelles Parsen..." -ForegroundColor Yellow
    $content = Get-Content -Path $csvPath -Raw
    $lines = $content -split "\r?\n"
    $headers = $lines[0] -split "," | ForEach-Object { $_.Trim('"') }
    
    $csv = @()
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ([string]::IsNullOrWhiteSpace($lines[$i])) { continue }
        
        $row = New-Object PSObject
        $values = $lines[$i] -split ","
        for ($j = 0; $j -lt $headers.Count -and $j -lt $values.Count; $j++) {
            $value = $values[$j].Trim('"')
            $row | Add-Member -MemberType NoteProperty -Name $headers[$j] -Value $value
        }
        $csv += $row
    }
}

if ($null -eq $csv -or $csv.Count -eq 0) {
    Write-Host "Fehler: Die CSV-Datei ist leer oder konnte nicht gelesen werden." -ForegroundColor Red
    exit 1
}

Write-Host "Analysiere CSV-Struktur..."

# Alle Spalten ermitteln
$columns = $csv[0].PSObject.Properties.Name
Write-Host "Gefundene Spalten: $($columns -join ', ')"
Write-Host "Beginne Konvertierung von $($csv.Count) Tests..."

# Hilfsfunktion für Pipe-getrennte Felder
function Split-PipeIfExists {
    param($string)
    if ([string]::IsNullOrWhiteSpace($string)) { return @() }
    
    # Unterstützt sowohl | als auch \ als Trennzeichen (Excel kann diese ändern)
    # Entfernt zusätzlich Leerzeichen, die Excel möglicherweise hinzufügt
    $values = $string -split "\s*[\|\\]\s*" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    return $values
}

# Hilfsfunktion für Dokumente-Feld
function ConvertFrom-DokumenteString {
    param($dokumentText)
    if ([string]::IsNullOrWhiteSpace($dokumentText) -or $dokumentText -eq ":") { return @() }
    # Stellen Sie sicher, dass das Ergebnis immer ein Array ist, selbst bei nur einem Eintrag
    $dokumente = $dokumentText -split "\s*[\|\\]\s*" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object {
        $parts = $_ -split ":", 2
        if ($parts.Count -ge 2) {
            @{ titel = $parts[0].Trim(); url = $parts[1].Trim() }
        } else {
            @{ titel = $parts[0].Trim(); url = "" }
        }
    }
    
    # Stelle sicher, dass das Ergebnis immer ein Array ist
    if ($null -eq $dokumente) { return @() }
    if ($dokumente -isnot [Array]) { return @($dokumente) }
    return $dokumente
}

# Lädt die Referenz-JSON um Strukturvergleich und mindestmenge_ml-Werte zu haben
$referenceTests = @{}
if (Test-Path $referenceJsonPath) {
    try {
        $referenceJson = Get-Content -Path $referenceJsonPath -Raw | ConvertFrom-Json
        foreach ($test in $referenceJson) {
            if ($test.id) {
                $referenceTests[$test.id] = $test
            }
        }
        Write-Host "Referenz-JSON mit $($referenceTests.Count) Tests geladen."
    }
    catch {
        Write-Host "Warnung: Konnte die Referenz-JSON nicht laden: $_" -ForegroundColor Yellow
    }
}

# Hilfsfunktion zum Konvertieren von mindestmenge_ml
function Convert-Mindestmenge {
    param($id, $value)
    
    # Wenn eine Referenz für diesen Test existiert, verwende den Wert daraus
    if ($referenceTests.ContainsKey($id)) {
        return $referenceTests[$id].mindestmenge_ml
    }
    
    # Sonst konvertiere den CSV-Wert zu einem niedrigeren Dezimalwert (Division durch 10)
    if ([double]::TryParse($value, [ref]$null)) {
        return [double]$value / 10
    }
    
    return 0.5 # Default-Wert falls keine Konvertierung möglich
}

# Hilfsfunktion zum Konvertieren von Werten in passende Typen
function Convert-ToAppropriateType {
    param($fieldName, $value, $id)
    
    # Leerwerte als leere Arrays oder null behandeln
    if ([string]::IsNullOrWhiteSpace($value) -or $value -eq ":") {
        switch ($fieldName) {
            # Felder, die Arrays sein sollten
            { $_ -in @("synonyme", "material", "hinweise", "dokumente") } { return @() }
            default { return $null }
        }
    }
    
    # Konvertierung je nach Feldtyp
    switch ($fieldName) {
        "synonyme" { return Split-PipeIfExists $value }
        "material" { return Split-PipeIfExists $value }
        "hinweise" { return Split-PipeIfExists $value }
        "dokumente" { return ConvertFrom-DokumenteString $value }
        "mindestmenge_ml" { return Convert-Mindestmenge -id $id -value $value }
        "aktiv" { 
            if ($value -eq "true" -or $value -eq "1") { return $true }
            elseif ($value -eq "false" -or $value -eq "0") { return $false }
            return $null
        }
        default { return $value }
    }
}

# Alle Zeilen in strukturierte Objekte umwandeln
$structured = $csv | ForEach-Object {
    $item = $_
    $testObject = [ordered]@{}
    
    # Stelle zunächst die id bereit, damit wir sie für mindestmenge_ml verwenden können
    $id = $item.id
    
    foreach ($column in $columns) {
        $value = $item.$column
        $convertedValue = Convert-ToAppropriateType -fieldName $column -value $value -id $id
        $testObject[$column] = $convertedValue
    }
    
    [PSCustomObject]$testObject
}

# Vorhandene tests.json-Struktur übernehmen
try {
    if (Test-Path $referenceJsonPath) {
        Write-Host "Verwende Referenz-JSON für Strukturvalidierung..."
        
        # Liste von Feldern, die immer Arrays sein sollten
        $arrayFields = @("synonyme", "material", "hinweise", "dokumente")
        
        # Stelle sicher, dass bestimmte Felder immer als Arrays gespeichert werden
        foreach ($test in $structured) {
            foreach ($field in $arrayFields) {
                if ($test.PSObject.Properties.Name -contains $field) {
                    $fieldValue = $test.$field
                    
                    # Stelle sicher, dass Felder die Arrays sein sollten, auch wirklich Arrays sind
                    if ($null -eq $fieldValue) {
                        $test.$field = @()
                    }
                    elseif ($fieldValue -isnot [Array]) {
                        $test.$field = @($fieldValue)
                    }
                }
            }
        }
    }
} 
catch {
    Write-Host "Warnung: Konnte die Referenz-JSON nicht verwenden: $_" -ForegroundColor Yellow
}

# Als JSON speichern mit korrekter Formatierung für Arrays
$structuredJson = $structured | ConvertTo-Json -Depth 10

# Einige Anpassungen an der JSON-Formatierung
# - Stelle sicher, dass leere Arrays als [] und nicht als {} dargestellt werden
$structuredJson = $structuredJson -replace '"hinweise":\s*\{\}', '"hinweise": []' `
                                -replace '"dokumente":\s*\{\}', '"dokumente": []' `
                                -replace '"material":\s*\{\}', '"material": []' `
                                -replace '"synonyme":\s*\{\}', '"synonyme": []'

# Speichere die bereinigte JSON
$structuredJson | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "JSON erfolgreich erstellt unter: $jsonPath"
Write-Host "Statistik:"
Write-Host "   - Tests importiert: $($structured.Count)"
Write-Host "   - Felder pro Test: $($columns.Count)"
