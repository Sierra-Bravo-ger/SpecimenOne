# GenerateMaterialExtensionMapping.ps1
# Dieses Skript generiert ein Material-Erweiterungs-Mapping basierend auf der material.csv

Write-Host "Material-Erweiterungs-Mapping Generator"
Write-Host "======================================"

# Input- und Output-Pfade
$materialCsvPath = "material.csv"
$outputCsvPath = "materw_umsetz.csv"

# Prüfen, ob die Ausgabedatei bereits existiert
if (Test-Path $outputCsvPath) {
    Write-Host "Die Datei $outputCsvPath existiert bereits. Generierung wird übersprungen."
    exit 0
}

# Material CSV einlesen
try {
    $materialCsv = Import-Csv -Path $materialCsvPath -Delimiter ";"
    Write-Host "$($materialCsv.Count) Material-Einträge aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der Material-CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Erstellte eine leere Struktur für die materw_umsetz.csv
$materialExtensions = @()

# Für jedes Material in material.csv
foreach ($material in $materialCsv) {
    # MATERIAL_ID extrahieren und bereinigen
    $materialId = $material.MATERIAL_ID
    if ($materialId -match '(\d+),\d+') {
        $materialId = $matches[1]
    }
    
    # Standard-Erweiterung ist "00" für die meisten Materialien
    $materialExtension = "00"
    
    # Hier können spezielle Regeln für bestimmte Material-IDs hinzugefügt werden
    # Beispiel: Material-ID 1 (Serum) kann verschiedene Erweiterungen haben (00, 10, etc.)
    
    # Neues Objekt für die CSV-Datei erstellen
    $extensionEntry = [PSCustomObject]@{
        material_id = $materialId
        mat_erweiterung = $materialExtension
        beschreibung = $material.MATERIAL_NAME
    }
    
    # Zum Array hinzufügen
    $materialExtensions += $extensionEntry
}

# Zusätzliche spezielle Material-Erweiterungen hinzufügen
# Dies sind Beispiele und sollten angepasst werden basierend auf den tatsächlichen Daten
$specialExtensions = @(
    [PSCustomObject]@{ material_id = "1"; mat_erweiterung = "10"; beschreibung = "Infektserum" },
    [PSCustomObject]@{ material_id = "1"; mat_erweiterung = "20"; beschreibung = "Spezialserum" },
    [PSCustomObject]@{ material_id = "2"; mat_erweiterung = "10"; beschreibung = "Spezialurin" }
    # Hier können weitere Einträge hinzugefügt werden
)

# Spezielle Erweiterungen dem Haupt-Array hinzufügen
$materialExtensions += $specialExtensions

# Als CSV-Datei speichern
$materialExtensions | Export-Csv -Path $outputCsvPath -Delimiter ";" -NoTypeInformation -Encoding UTF8

Write-Host "Material-Erweiterungs-Mapping wurde erfolgreich in $outputCsvPath gespeichert."
Write-Host "$($materialExtensions.Count) Einträge wurden generiert."
