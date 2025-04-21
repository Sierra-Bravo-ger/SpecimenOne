# Input- und Output-Pfade
$csvPath = "profile_exportiert.csv"
$jsonPath = "public\profile_importiert-$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).json"
$referenceJsonPath = "public\profile.json" # Referenz-JSON für die Struktur

Write-Host "Starte Import von Profil-CSV-Daten..."

# CSV einlesen - mit flexiblen Trennzeichen, primär auf Semikolon eingestellt (deutsches Format)
try {
    # Standardversuch mit Semikolon als Trennzeichen (deutsches Format)
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    
    # Wenn keine Spalten gefunden wurden, versuchen wir es mit Komma
    if ($csv.Count -gt 0 -and $csv[0].PSObject.Properties.Name.Count -le 1) {
        Write-Host "Versuche mit Komma als Trennzeichen..." -ForegroundColor Yellow
        $csv = Import-Csv -Path $csvPath
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
Write-Host "Beginne Konvertierung von $($csv.Count) Profilen..."

# Hilfsfunktion für Pipe-getrennte Felder
function Split-PipeIfExists {
    param($string)
    if ([string]::IsNullOrWhiteSpace($string)) { return @() }
    
    # Unterstützt sowohl | als auch \ als Trennzeichen (Excel kann diese ändern)
    # Entfernt zusätzlich Leerzeichen, die Excel möglicherweise hinzufügt
    $values = $string -split "\s*[\|\\]\s*" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    return $values
}

# Lädt die Referenz-JSON für die Strukturvalidierung
$referenceProfiles = @{}
if (Test-Path $referenceJsonPath) {
    try {
        $referenceJson = Get-Content -Path $referenceJsonPath -Raw | ConvertFrom-Json
        foreach ($profile in $referenceJson) {
            if ($profile.id) {
                $referenceProfiles[$profile.id] = $profile
            }
        }
        Write-Host "Referenz-JSON mit $($referenceProfiles.Count) Profilen geladen."
    }
    catch {
        Write-Host "Warnung: Konnte die Referenz-JSON nicht laden: $_" -ForegroundColor Yellow
    }
}

# Hilfsfunktion zum Konvertieren von Werten in passende Typen
function Convert-ToAppropriateType {
    param($fieldName, $value, $id)
    
    # Leerwerte als leere Arrays oder null behandeln
    if ([string]::IsNullOrWhiteSpace($value) -or $value -eq ":") {
        switch ($fieldName) {
            # Felder, die Arrays sein sollten
            { $_ -in @("tests") } { return @() }
            default { return $null }
        }
    }
    
    # Konvertierung je nach Feldtyp
    switch ($fieldName) {
        "tests" { return Split-PipeIfExists $value }
        "sortierNummer" { 
            if ([int]::TryParse($value, [ref]$null)) {
                return [int]$value
            }
            return 999 # Default-Wert falls keine Konvertierung möglich
        }
        default { return $value }
    }
}

# Alle Zeilen in strukturierte Objekte umwandeln
$structured = $csv | ForEach-Object {
    $item = $_
    $profileObject = [ordered]@{}
    
    # Stelle zunächst die id bereit
    $id = $item.id
    
    foreach ($column in $columns) {
        $value = $item.$column
        $convertedValue = Convert-ToAppropriateType -fieldName $column -value $value -id $id
        $profileObject[$column] = $convertedValue
    }
    
    [PSCustomObject]$profileObject
}

# Vorhandene profile.json-Struktur übernehmen
try {
    if (Test-Path $referenceJsonPath) {
        Write-Host "Verwende Referenz-JSON für Strukturvalidierung..."
        
        # Liste von Feldern, die immer Arrays sein sollten
        $arrayFields = @("tests")
        
        # Stelle sicher, dass bestimmte Felder immer als Arrays gespeichert werden
        foreach ($profile in $structured) {
            foreach ($field in $arrayFields) {
                if ($profile.PSObject.Properties.Name -contains $field) {
                    $fieldValue = $profile.$field
                    
                    # Stelle sicher, dass Felder die Arrays sein sollten, auch wirklich Arrays sind
                    if ($null -eq $fieldValue) {
                        $profile.$field = @()
                    }
                    elseif ($fieldValue -isnot [Array]) {
                        $profile.$field = @($fieldValue)
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
$structuredJson = $structured | ConvertTo-Json -Depth 5

# Einige Anpassungen an der JSON-Formatierung
# - Stelle sicher, dass leere Arrays als [] und nicht als {} dargestellt werden
$structuredJson = $structuredJson -replace '"tests":\s*\{\}', '"tests": []'

# Speichere die bereinigte JSON
$structuredJson | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "JSON erfolgreich erstellt unter: $jsonPath"
Write-Host "Statistik:"
Write-Host "   - Profile importiert: $($structured.Count)"
Write-Host "   - Felder pro Profil: $($columns.Count)"
