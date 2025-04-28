# Input- und Output-Pfade
$csvPath = "teste_db.csv"
$jsonPath = "public/tests.json"
$materialJsonPath = "public/material.json"
$einheitenJsonPath = "public/einheiten.json"

Write-Host "Skript wird ausgeführt in: $(Get-Location)"
Write-Host "Starte Import von Tests-CSV-Daten aus $csvPath..."

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
$einheitenMapping = @{}
$validMaterialIds = @{}         # Liste aller gültigen Material-IDs

# Material-Mapping laden
if (Test-Path $materialJsonPath) {
    try {
        $materialJson = Get-Content -Path $materialJsonPath -Raw | ConvertFrom-Json
        foreach ($material in $materialJson.materialien) {
            # Validiere, dass alle Material-Attribute vorhanden sind
            if (-not $material.material_id -or -not $material.material_kurz -or -not $material.db_material_id) {
                continue
            }
            
            # Gültige Material-IDs sammeln
            $validMaterialIds[$material.material_id] = $true
            
            # Mapping nach Material-Kürzel
            $kuerzel = $material.material_kurz
            if (-not $materialMapping.ContainsKey($kuerzel)) {
                $materialMapping[$kuerzel] = @()
            }
            $materialMapping[$kuerzel] += $material.material_id
            
            # Mapping nach DB-Material-ID
            $dbMaterialId = $material.db_material_id
            if (-not $materialDbIdMapping.ContainsKey($dbMaterialId)) {
                $materialDbIdMapping[$dbMaterialId] = @()
            }
            $materialDbIdMapping[$dbMaterialId] += $material.material_id
        }
        Write-Host "Material-Mapping geladen: $($materialMapping.Count) Materialtypen mit $($validMaterialIds.Count) Varianten"
        
        # Debug-Ausgabe der ersten Material-Mappings
        $dbIdKeys = $materialDbIdMapping.Keys | Select-Object -First 5
        foreach ($key in $dbIdKeys) {
            $materials = $materialDbIdMapping[$key] -join ", "
            Write-Host "DB-Material-ID $key -> $materials"
        }
    } catch {
        Write-Host "Warnung: Konnte Material-JSON nicht laden: $_" -ForegroundColor Yellow
    }
}

# Einheiten-Mapping laden
if (Test-Path $einheitenJsonPath) {
    try {
        $einheitenJson = Get-Content -Path $einheitenJsonPath -Raw | ConvertFrom-Json
        foreach ($einheit in $einheitenJson) {
            # Mapping von EINHEIT_ID auf einheit_id
            if ($einheit.einheit_id_db) {
                $einheitenMapping[$einheit.einheit_id_db] = $einheit.einheit_id
            }
        }
        Write-Host "Einheiten-Mapping geladen: $($einheitenMapping.Count) Einheiten"
    } catch {
        Write-Host "Warnung: Konnte Einheiten-JSON nicht laden: $_" -ForegroundColor Yellow
    }
}

# Funktionen für die Konvertierung
# Funktion: Kategorie basierend auf ARBEITSPLATZ_ID zuweisen
function Get-TestKategorie {
    param($arbeitsplatzId)
    
    # Entferne Dezimalstellen, falls vorhanden (z.B. "1,0" -> "1")
    if ($arbeitsplatzId -match '(\d+),\d+') {
        $arbeitsplatzId = $matches[1]
    } elseif ($arbeitsplatzId -match '(\d+)\.0') {
        $arbeitsplatzId = $matches[1]
    }
    
    # Mapping-Tabelle für die Arbeitsplätze gemäß Vorgabe
    $arbeitsplatzMapping = @{
        "5" = "Klinische Chemie"
        "3" = "Gerinnung"
        "10" = "Hämatologie"
        "8" = "Elektrophorese"
        "11" = "Gerinnung"
        "12" = "Gerinnung"
        "13" = "Immunologie"
        "14" = "Hämatologie"
        "15" = "Hämatologie"
        "16" = "Infektionsdiagnostik"
        "17" = "Toxikologie"
        "18" = "Molekulargenetik"
        "19" = "Klinische Chemie"
        "20" = "Urinarbeitsplatz"
        "22" = "Versand"
        "23" = "Versand"
        "25" = "Toxikologie"
        "26" = "Toxikologie"
        "27" = "Toxikologie"
        "28" = "Elektrophorese"
        "30" = "Hämatologie"
        "138" = "Blutbank"
        "139" = "POCT"
        "140" = "Gerinnung"
        "142" = "TDM"
    }
    
    if ($arbeitsplatzMapping.ContainsKey($arbeitsplatzId)) {
        return $arbeitsplatzMapping[$arbeitsplatzId]
    } else {
        return "Sonstiges"
    }
}

# Funktion: Material-ID für ein bestimmtes Material finden
function Get-MaterialId {
    param($materialId)
    
    # Normalisiere Material-ID (entferne Dezimalstellen)
    if ($materialId -match '(\d+),\d+') {
        $materialId = $matches[1]
    } elseif ($materialId -match '(\d+)\.0') {
        $materialId = $matches[1]
    }
    
    # Versuche über die DB-ID ein Material zu finden
    if ($materialDbIdMapping.ContainsKey($materialId)) {
        # Wenn es nur ein Material gibt, nimm dieses
        $materials = $materialDbIdMapping[$materialId]
        if ($materials.Count -eq 1) {
            return $materials[0]
        }
        
        # Sonst nimm bevorzugt das mit Erweiterung "00"
        foreach ($mat in $materials) {
            if ($mat -match '-00$') {
                return $mat
            }
        }
        
        # Wenn kein "00", dann nimm das erste Material
        return $materials[0]
    }
    
    # Wenn keine Zuordnung gefunden
    return $null
}

# Funktion: Formatiere die Test-ID aus TEST_NR
function Format-TestId {
    param($testNr)
    
    # Entferne Dezimalstellen, falls vorhanden
    if ($testNr -match '(\d+),\d+') {
        $testNr = $matches[1]
    } elseif ($testNr -match '(\d+)\.0') {
        $testNr = $matches[1]
    }
    
    # Formatiere als 'T' + vierstellige Zahl
    return "T" + $testNr.PadLeft(4, '0')
}

# Funktion: Generiere zufällige Befundzeit
function Get-RandomBefundzeit {
    $stunden = Get-Random -Minimum 1 -Maximum 6
    return "$stunden Stunden"
}

# Umwandlung in die gewünschte JSON-Struktur
$tests = @()
foreach ($row in $csv) {
    # Test-ID formatieren basierend auf TEST_NR gemäß Mapping
    $testId = Format-TestId -testNr $row.TEST_NR
    
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
    
    # Kategorie bestimmen aus ARBEITSPLATZ_ID gemäß Mapping
    $kategorie = Get-TestKategorie -arbeitsplatzId $row.ARBEITSPLATZ_ID
    
    # Material bestimmen basierend auf der Material-ID gemäß Mapping
    $materialId = Get-MaterialId -materialId $row.MATERIAL_ID
    $material = @()
    if (-not [string]::IsNullOrWhiteSpace($materialId)) {
        $material = @($materialId)
    }
    
    # Synonyme aus NAME_KURZ_10 gemäß Mapping
    $synonyme = @()
    if (-not [string]::IsNullOrWhiteSpace($row.NAME_KURZ_10)) {
        $synonyme = @($row.NAME_KURZ_10)
    }
    
    # Stelle sicher, dass Synonyme immer ein Array ist
    if ($null -eq $synonyme) {
        $synonyme = @()
    } elseif ($synonyme -isnot [Array]) {
        $synonyme = @($synonyme)
    }
    
    # Einheit-ID aus EINHEIT_ID gemäß Mapping
    $einheitId = $null
    if (-not [string]::IsNullOrWhiteSpace($row.EINHEIT_ID)) {
        $dbEinheitId = $row.EINHEIT_ID
        if ($dbEinheitId -match '(\d+),\d+') {
            $dbEinheitId = $matches[1]
        }
        
        if ($einheitenMapping.ContainsKey($dbEinheitId)) {
            $einheitId = $einheitenMapping[$dbEinheitId]
        }
    }
    
    # Aktiv-Status aus NICHTANFORDERBAR gemäß Mapping
    $aktiv = $true
    if (-not [string]::IsNullOrWhiteSpace($row.NICHTANFORDERBAR)) {
        $aktiv = $false
    }
    
    # Zufällige Befundzeit gemäß Mapping
    $befundzeit = Get-RandomBefundzeit
    
    # Neues Test-Objekt erstellen gemäß Mapping
    $test = [ordered]@{
        id = $testId
        name = $name
        kategorie = $kategorie
        material = $material
        synonyme = $synonyme
        aktiv = $aktiv
        einheit_id = $einheitId
        befundzeit = $befundzeit
        durchfuehrung = "Mo-Fr"  # Standardwert gemäß Mapping
        loinc = "folgt"  # Gemäß Mapping
        mindestmenge_ml = 0.5  # Standardwert gemäß Mapping
        lagerung = "Standard"  # Standardwert gemäß Mapping
        dokumente = @()  # Leeres Array gemäß Mapping
        hinweise = @()  # Leeres Array gemäß Mapping
        ebm = ""  # Leerer String gemäß Mapping
        goae = ""  # Leerer String gemäß Mapping
    }
    
    # Test zur Liste hinzufügen, wenn gültige ID und Name vorhanden
    if (-not [string]::IsNullOrWhiteSpace($test.id) -and -not [string]::IsNullOrWhiteSpace($test.name)) {
        $tests += $test
    }
}

# Tests nach ID sortieren
$sortedTests = $tests | Sort-Object -Property id

# Als JSON speichern
$json = $sortedTests | ConvertTo-Json -Depth 10
$json | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "Konvertierung abgeschlossen. $($tests.Count) Tests wurden nach $jsonPath exportiert."
