# replaceMaterialField.ps1
# Dieses Skript ersetzt die Material-Felder in tests.json mit Referenzen auf die material.json

# Pfade für die Dateien
$testsJsonPath = ".\public\tests.json"
$materialJsonPath = ".\public\material.json"
$outputPath = ".\public\tests_no_material.json"

# Dateien laden
try {
    Write-Host "Lade tests.json..." -ForegroundColor Cyan
    $testsJson = Get-Content -Path $testsJsonPath -Raw | ConvertFrom-Json
    
    Write-Host "Lade material.json..." -ForegroundColor Cyan
    $materialJson = Get-Content -Path $materialJsonPath -Raw | ConvertFrom-Json
    
    # Erstelle eine Lookup-Tabelle für schnelleren Zugriff
    $materialLookup = @{}
    foreach ($material in $materialJson.materialien) {
        $materialLookup[$material.material_bezeichnung] = $material.material_id
    }
    
    Write-Host "Material-Lookup-Tabelle erstellt mit ${$materialLookup.Count} Einträgen." -ForegroundColor Green
    
    # Zähler für Statistiken
    $totalTests = $testsJson.Count
    $testsModified = 0
    $materialsReplaced = 0
    $materialsNotFound = 0
    $notFoundList = @{}
    
    # Verarbeite jeden Test
    foreach ($test in $testsJson) {
        $materialsArray = $test.material
        
        if ($null -ne $materialsArray -and $materialsArray.Count -gt 0) {
            $newMaterialsArray = @()
            
            foreach ($materialName in $materialsArray) {
                if ($materialLookup.ContainsKey($materialName)) {
                    # Ersetze den Namen durch die ID
                    $newMaterialsArray += $materialLookup[$materialName]
                    $materialsReplaced++
                } else {
                    # Behalte den ursprünglichen Namen und protokolliere ihn
                    $newMaterialsArray += $materialName
                    $materialsNotFound++
                    
                    if (-not $notFoundList.ContainsKey($materialName)) {
                        $notFoundList[$materialName] = 1
                    } else {
                        $notFoundList[$materialName]++
                    }
                }
            }
            
            # Ersetze das Material-Array im Test
            $test.material = $newMaterialsArray
            $testsModified++
        }
    }
    
    # Speichere das Ergebnis
    Write-Host "Speichere Ergebnis in $outputPath..." -ForegroundColor Cyan
    $testsJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding UTF8
    
    # Gib Statistiken aus
    Write-Host "Verarbeitung abgeschlossen." -ForegroundColor Green
    Write-Host "Gesamtzahl Tests: $totalTests" -ForegroundColor Yellow
    Write-Host "Tests mit geänderten Material-Feldern: $testsModified" -ForegroundColor Yellow
    Write-Host "Materialien ersetzt: $materialsReplaced" -ForegroundColor Yellow
    Write-Host "Materialien nicht gefunden: $materialsNotFound" -ForegroundColor Yellow
    
    # Liste der nicht gefundenen Materialien
    if ($materialsNotFound -gt 0) {
        Write-Host "`nFolgende Materialien wurden nicht in material.json gefunden:" -ForegroundColor Red
        foreach ($materialName in $notFoundList.Keys) {
            Write-Host "  - $materialName (Anzahl: $($notFoundList[$materialName]))" -ForegroundColor Red
        }
        
        Write-Host "`nBitte fügen Sie diese Materialien in material.json hinzu oder korrigieren Sie die Schreibweise in tests.json." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Fehler: $_" -ForegroundColor Red
    exit 1
}
