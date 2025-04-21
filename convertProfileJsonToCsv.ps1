# Input- und Output-Pfade
$jsonPath = "public\profile.json"
$csvPath = "profile_exportiert-$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).csv"

Write-Host "Starte Export von Profil-JSON-Daten..."

# JSON einlesen
try {
    $jsonContent = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    $profiles = $jsonContent | ConvertFrom-Json
}
catch {
    Write-Host "Fehler beim Lesen der JSON-Datei: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Analysiere Profile-JSON-Struktur..."

# Alle möglichen Feldnamen extrahieren
$allFields = @{}
foreach ($profile in $profiles) {
    $properties = $profile | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    foreach ($prop in $properties) {
        $allFields[$prop] = $true
    }
}
$fieldNames = $allFields.Keys | Sort-Object

Write-Host "Gefundene Felder: $($fieldNames -join ', ')"
Write-Host "Beginne Export von $($profiles.Length) Profilen..."

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

# CSV-Header erstellen mit Semikolon als Trenner (deutsches Format)
$csvHeader = $fieldNames -join ";"
Set-Content -Path $csvPath -Value $csvHeader -Encoding UTF8

# Daten in CSV schreiben
foreach ($profile in $profiles) {
    $csvLine = @()
    foreach ($field in $fieldNames) {
        $value = if ($profile.PSObject.Properties.Name -contains $field) { $profile.$field } else { $null }
        
        # Behandlung je nach Feldtyp
        if ($null -eq $value) {
            $csvLine += '""'
        }
        elseif ($value -is [Array]) {
            $formatted = Format-ArrayForCsv -array $value
            $csvLine += """$formatted"""
        }
        elseif ($value -is [bool]) {
            $csvLine += $value.ToString().ToLower()
        }
        else {
            # String-Werte mit Anführungszeichen umschließen und Semikolons escapen
            $formattedValue = "$value".Replace('"', '""').Replace(';', ',')
            $csvLine += """$formattedValue"""
        }
    }
    
    Add-Content -Path $csvPath -Value ($csvLine -join ";") -Encoding UTF8
}

Write-Host "CSV erfolgreich erstellt unter: $csvPath"
Write-Host "Statistik:"
Write-Host "   - Profile exportiert: $($profiles.Length)"
Write-Host "   - Felder pro Profil: $($fieldNames.Count)"
