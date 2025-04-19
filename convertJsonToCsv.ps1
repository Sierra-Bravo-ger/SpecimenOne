# filepath: c:\Projekte\convertJsonToCsv.ps1
# Input- und Output-Pfade
$jsonPath = "tests_orig.json"
$csvPath = "tests_exportiert-$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).csv"

Write-Host "Starte Export von JSON-Daten..."

# JSON einlesen
try {
    $jsonContent = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    $tests = $jsonContent | ConvertFrom-Json
}
catch {
    Write-Host "Fehler beim Lesen der JSON-Datei: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Analysiere JSON-Struktur..."

# Alle möglichen Feldnamen extrahieren
$allFields = @{}
foreach ($test in $tests) {
    $properties = $test | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    foreach ($prop in $properties) {
        $allFields[$prop] = $true
    }
}
$fieldNames = $allFields.Keys | Sort-Object

Write-Host "Gefundene Felder: $($fieldNames -join ', ')"
Write-Host "Beginne Export von $($tests.Length) Tests..."

# Hilfsfunktion zum Formatieren von Arrays für CSV-Export
function Format-ArrayForCsv {
    param($array)
    if ($null -eq $array -or $array.Length -eq 0) { return "" }
    
    $result = ""
    foreach ($item in $array) {
        if ($result -ne "") { $result += "|" }
        $result += "$item"
    }
    return $result
}

# Hilfsfunktion zum Formatieren von Dokumenten für CSV-Export
function ConvertTo-DokumenteString {
    param($dokumente)
    if ($null -eq $dokumente -or $dokumente.Length -eq 0) { return "" }
    
    $result = ""
    foreach ($dok in $dokumente) {
        if ($result -ne "") { $result += "|" }
        $result += "$($dok.titel):$($dok.url)"
    }
    return $result
}

# CSV-Header erstellen
$csvHeader = $fieldNames -join ","
Set-Content -Path $csvPath -Value $csvHeader -Encoding UTF8

# Daten in CSV schreiben
foreach ($test in $tests) {
    $csvLine = @()
    foreach ($field in $fieldNames) {
        $value = if ($test.PSObject.Properties.Name -contains $field) { $test.$field } else { $null }
        
        # Behandlung je nach Feldtyp
        if ($null -eq $value) {
            $csvLine += '""'
        }
        elseif ($field -eq "dokumente") {
            $formatted = ConvertTo-DokumenteString -dokumente $value
            $csvLine += """$formatted"""
        }
        elseif ($value -is [Array]) {
            $formatted = Format-ArrayForCsv -array $value
            $csvLine += """$formatted"""
        }
        elseif ($value -is [bool]) {
            $csvLine += $value.ToString().ToLower()
        }
        else {
            # String-Werte mit Anführungszeichen umschließen und Kommas escapen
            $formattedValue = "$value".Replace('"', '""')
            $csvLine += """$formattedValue"""
        }
    }
    
    Add-Content -Path $csvPath -Value ($csvLine -join ",") -Encoding UTF8
}

Write-Host "CSV erfolgreich erstellt unter: $csvPath"
Write-Host "Statistik:"
Write-Host "   - Tests exportiert: $($tests.Length)"
Write-Host "   - Felder pro Test: $($fieldNames.Count)"
