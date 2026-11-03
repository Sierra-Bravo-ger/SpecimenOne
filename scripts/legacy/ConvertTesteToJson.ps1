# Input- und Output-Pfade
$csvPath = "teste.csv"
$jsonPath = "tests_importiert$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).json"
$materialJsonPath = "public/material.json"
$originalJsonPath = "public/tests_ORIG.json" # Falls existierende Tests ergänzt werden sollen

Write-Host "Skript wird ausgeführt in: $(Get-Location)"

Write-Host "Starte Import von CSV-Daten aus $csvPath..."

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    Write-Host "$($csv.Count) Zeilen aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Einlesen der Material-JSON für besseres Mapping
$materialMapping = @{}
if (Test-Path $materialJsonPath) {
    try {
        $materialJson = Get-Content -Path $materialJsonPath -Raw | ConvertFrom-Json
        foreach ($material in $materialJson.materialien) {
            # Erstelle ein Mapping von DB-ID auf material_id (z.B. "1" -> "SER-00")
            if ($material.material_id -match "^([A-Z]+)-") {
                $materialType = $matches[1]
                $materialMapping[$materialType] = $material.material_id
            }
        }
        Write-Host "Material-Mapping geladen: $($materialMapping.Count) Materialtypen"
    } catch {
        Write-Host "Warnung: Konnte Material-JSON nicht laden: $_" -ForegroundColor Yellow
    }
}

# Hilfsfunktion: Kategorien basierend auf TESTGRUPPE_ID zuweisen
function Get-TestKategorie {
    param($testgruppeId)
    
    # Entferne Dezimalstellen, falls vorhanden (z.B. "1,0" -> "1")
    if ($testgruppeId -match '(\d+),\d+') {
        $testgruppeId = $matches[1]
    } elseif ($testgruppeId -match '(\d+)\.0') {
        $testgruppeId = $matches[1]
    }
    
    # Hier eine Mapping-Tabelle für die Testgruppen
    $testgruppenMapping = @{
        "1" = "Klinische Chemie"
        "2" = "Hämatologie"
        "3" = "Endokrinologie"
        "4" = "Liquordiagnostik"
        "5" = "Serologie"
        "6" = "Immunologie"
        "7" = "Enzymdiagnostik"
        "13" = "Immunologie"
        "16" = "Archivierung"
        "17" = "Proteindiagnostik"
        "20" = "Urindiagnostik"
        "33" = "Elektrolyte"
        "36" = "Medikamentenspiegel"
        "42" = "Serologie"
        "4444" = "Immunologie"
        "4445" = "Labordiagnostik"
    }
    
    if ($testgruppenMapping.ContainsKey($testgruppeId)) {
        return $testgruppenMapping[$testgruppeId]
    } else {
        return "Sonstiges"
    }
}

# Funktion zum Umwandeln von Material-IDs in Material-Codes
function Convert-MaterialId {
    param($materialId)
    
    # Entferne Dezimalstellen, falls vorhanden (z.B. "1,0" -> "1")
    if ($materialId -match '(\d+),\d+') {
        $materialId = $matches[1]
    }
    
    # Mapping von Material-IDs auf Material-Codes
    $materialIdMapping = @{
        "1" = "SER"  # Serum
        "2" = "URI"  # Urin
        "4" = "LIQ"  # Liquor
        "5" = "EDTA" # EDTA-Blut
        "42" = "SER" # Serum (alternative ID)
    }
    
    # Materialtyp übersetzen
    $materialType = $materialIdMapping[$materialId]
    if (-not $materialType) {
        return @() # Leeres Array zurückgeben, wenn keine Zuordnung gefunden wurde
    }
    
    # Standard-Material-ID konstruieren (z.B. "SER-00")
    if ($materialMapping.ContainsKey($materialType)) {
        return @($materialMapping[$materialType])
    } else {
        return @("$materialType-00") # Standard-ID mit -00 suffix
    }
}

# Hilfsfunktion zur Generierung besserer IDs aus den bestehenden
function Get-ImprovedId {
    param($testeId, $nameKurz)
    
    # Wenn die ID numerisch ist, formatiere sie als 'T' + vierstellige Zahl
    if ($testeId -match '^\d+$') {
        return "T" + $testeId.PadLeft(4, '0')
    }
    
    # Ansonsten verwende die vorhandene ID
    return $testeId
}

# Bestehende Tests laden, falls wir sie beibehalten wollen
$existingTests = @()
if (Test-Path $originalJsonPath) {
    try {
        $existingTests = Get-Content -Path $originalJsonPath -Raw | ConvertFrom-Json
        Write-Host "Bestehende Tests geladen: $($existingTests.Count) Tests"
    } catch {
        Write-Host "Warnung: Konnte bestehende Tests nicht laden: $_" -ForegroundColor Yellow
    }
}

# Umwandlung in die gewünschte JSON-Struktur
$tests = @()
foreach ($row in $csv) {
    # Neue ID mit besserem Format generieren
    $improvedId = Get-ImprovedId -testeId $row.TESTE_ID -nameKurz $row.NAME_KURZ
    
    # Kategorie basierend auf TESTGRUPPE_ID bestimmen
    $kategorie = Get-TestKategorie -testgruppeId $row.TESTGRUPPE_ID
    if (-not $kategorie) {
        $kategorie = Get-TestKategorie -testgruppeId $row.MATERIAL_ID
    }
    
    # Name bestimmen (bevorzugt NAME_BEFUND_LANG, sonst NAME_LANG, dann NAME_BEFUND)
    $name = $row.NAME_BEFUND_LANG
    if (-not $name) {
        $name = $row.NAME_LANG
        if (-not $name) {
            $name = $row.NAME_BEFUND
            if (-not $name) {
                $name = $row.NAME_KURZ
            }
        }
    }
    
    # Material-ID aus MATERIAL_ID ableiten
    $material = Convert-MaterialId -materialId $row.MATERIAL_ID
    
    # Neues Test-Objekt erstellen
    $test = [ordered]@{
        id = $improvedId
        name = $name
        kategorie = $kategorie
        material = $material
        aktiv = $true
        einheit_id = $row.EINHEIT_ID
        befundzeit = "24 Stunden"
        dokumente = @()
        durchführung = "Mo-Fr"
        ebm = ""
        goae = ""
        hinweise = @()
        lagerung = "Standard"
        loinc = ""
        mindestmenge_ml = 0.5
        sortierNummer = $row.ANZEIGE_NR
    }
    
    # Synonyme zusammenführen (ohne leere Werte und Duplikate)
    $synonymCandidates = @(
        $row.NAME_KURZ,
        $row.NAME_KURZ_10,
        $row.NAME_LANG,
        $row.NAME_STATISTIK,
        $row.NAME_BEFUND,
        $row.NAME_KURZ_FREMD,
        $row.NAME_LANG_FREMD
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and $_ -ne $test.name } | Select-Object -Unique
    
    $test.synonyme = $synonymCandidates
    
    # Nur Tests mit gültiger ID und Namen hinzufügen
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
