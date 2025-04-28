# Input- und Output-Pfade
$csvPath = "material.csv"
$jsonPath = "public/material.json"
$erweiterungCsvPath = "materw_umsetz.csv"

Write-Host "Skript wird ausgeführt in: $(Get-Location)"
Write-Host "Starte Import von Material-CSV-Daten aus $csvPath..."

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    Write-Host "$($csv.Count) Material-Einträge aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Erweiterungen aus materw_umsetz.csv einlesen
$materialErweiterungen = @{}
if (Test-Path $erweiterungCsvPath) {
    try {
        $erweiterungCsv = Import-Csv -Path $erweiterungCsvPath -Delimiter ";"
        Write-Host "$($erweiterungCsv.Count) Material-Erweiterungen aus materw_umsetz.csv eingelesen."
        
        # Mapping von MATERIAL_ID zu MAT_ERWEITERUNG erstellen
        foreach ($erweiterung in $erweiterungCsv) {
            # Handling für Dezimalkomma im Format "1,0" -> "1"
            $materialId = $erweiterung.MATERIAL_ID
            if ($materialId -match '(\d+),\d+') {
                $materialId = $matches[1]
            }
            
            $matErweiterung = $erweiterung.MAT_ERWEITERUNG
            $farbenId = $erweiterung.FARBEN_ID
            if ($farbenId -match '(\d+),\d+') {
                $farbenId = $matches[1]
            }
            
            if (-not [string]::IsNullOrWhiteSpace($materialId) -and -not [string]::IsNullOrWhiteSpace($matErweiterung)) {
                # Erstelle Zuordnung von Material-ID zu Erweiterung und Farbe
                if (-not $materialErweiterungen.ContainsKey($materialId)) {
                    $materialErweiterungen[$materialId] = @()
                }
                
                # Jede Erweiterung als Objekt mit MAT_ERWEITERUNG und FARBEN_ID speichern
                $materialErweiterungen[$materialId] += @{
                    MAT_ERWEITERUNG = $matErweiterung
                    FARBEN_ID = $farbenId
                }
            }
        }
        
        # Debug-Ausgabe
        Write-Host "Erweiterungen geladen für Material-IDs: $($materialErweiterungen.Keys -join ', ')"
        Write-Host "Material-Erweiterungen für $($materialErweiterungen.Count) verschiedene Materialien geladen."
    } catch {
        Write-Host "Warnung: Konnte Material-Erweiterungen nicht laden: $_" -ForegroundColor Yellow
    }
}

# Farben-Mapping gemäß Vorgaben
$farbenMapping = @{
    "1" = "Gelb"
    "2" = "Grün"
    "3" = "Rot"
    "4" = "Blau"
    "8" = "Braun"
    "12" = "Lila"
    "124" = "Orange"
    "128" = "Weiß"
}

# Lagerungs-Mapping
$lagerungsMapping = @{
    "Serum" = "5 Tage im Kühlarchiv"
    "Citratplasma" = "3 Tage im Kühlarchiv"
    "EDTA" = "3 Tage im Kühlarchiv"
    "EDTA-Blut" = "3 Tage im Kühlarchiv"
    "Urin" = "3 Tage im Kühlarchiv"
    "Sammelurin" = "3 Tage im Kühlarchiv"
    "Lithium-Heparin-Plasma" = "3 Tage im Kühlarchiv"
    "Heparinplasma" = "3 Tage im Kühlarchiv"
}

# Hilfsfunktion für Materialkürzel
function Get-MaterialKuerzel {
    param($materialName, $kuerzel)
    
    # Wenn Kürzel vorhanden, dieses verwenden
    if (-not [string]::IsNullOrWhiteSpace($kuerzel)) {
        return $kuerzel
    }
    
    # Ansonsten aus dem Namen ableiten
    if (-not [string]::IsNullOrWhiteSpace($materialName)) {
        $materialKurzName = $materialName -replace '[^A-Za-z]', ''
        if ($materialKurzName.Length -ge 2) {
            return $materialKurzName.Substring(0, [Math]::Min(2, $materialKurzName.Length)).ToUpper()
        }
    }
    
    # Fallback
    return "XX"
}

# Umwandlung in die gewünschte JSON-Struktur
$alleMaterialien = @()

foreach ($row in $csv) {
    # Material-ID normalisieren (Dezimalzeichen entfernen)
    $materialId = $row.MATERIAL_ID
    if ($materialId -match '(\d+),\d+') {
        $materialId = $matches[1]
    }
    
    # Materialcode aus dem Kürzel erstellen - JETZT AUS MAT_KUERZEL
    $materialKurz = Get-MaterialKuerzel -materialName $row.MATERIAL_ANZ -kuerzel $row.MAT_KUERZEL
    
    # Erweiterungen für dieses Material finden
    $erweiterungen = @()
    if ($materialErweiterungen.ContainsKey($materialId)) {
        $erweiterungen = $materialErweiterungen[$materialId]
    }
    
    # Wenn keine explizite Erweiterungen gefunden wurden, nichts erstellen
    if ($erweiterungen.Count -eq 0) {
        continue
    }
    
    # Für jede Erweiterung ein eigenes Material-Objekt erstellen
    foreach ($erweiterung in $erweiterungen) {
        $matErweiterung = $erweiterung.MAT_ERWEITERUNG
        $farbenId = $erweiterung.FARBEN_ID
        
        # Farbe bestimmen
        $farbe = "Weiß"  # Standard-Farbe
        if (-not [string]::IsNullOrWhiteSpace($farbenId) -and $farbenMapping.ContainsKey($farbenId)) {
            $farbe = $farbenMapping[$farbenId]
        }
        
        # Lagerung bestimmen
        $lagerung = "Standard, siehe Handbuch"  # Standard-Lagerung
        if ($lagerungsMapping.ContainsKey($row.MATERIAL_ANZ)) {
            $lagerung = $lagerungsMapping[$row.MATERIAL_ANZ]
        }
        
        # Material-Objekt erstellen
        $materialVariante = [ordered]@{
            material_id = "$materialKurz-$matErweiterung"
            material_bezeichnung = $row.MATERIAL_ANZ
            material_kurz = $materialKurz
            material_farbe = $farbe
            farben_id = $farbenId  # Hinzugefügt: farben_id für Farbzuordnung
            material_erweiterung = $matErweiterung
            lagerung = $lagerung
            probenroehre = "$($row.MATERIAL_ANZ)-Röhrchen"
            praekanalytik = "noch keine Angabe"
            db_material_id = $materialId
        }
        
        # Material zur Liste hinzufügen
        $alleMaterialien += $materialVariante
    }
}

# Anzahl der generierten Material-Einträge ausgeben
$countStandard = ($alleMaterialien | Where-Object { $_.material_erweiterung -eq "00" }).Count
Write-Host "Konvertierung abgeschlossen."
Write-Host "$countStandard Standard-Materialien und insgesamt $($alleMaterialien.Count) Material-Varianten wurden nach $jsonPath exportiert."

# Als JSON speichern
$materialObj = @{
    materialien = $alleMaterialien
}

$json = $materialObj | ConvertTo-Json -Depth 10
$json | Set-Content -Path $jsonPath -Encoding UTF8
