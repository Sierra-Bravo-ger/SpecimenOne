# ConvertTesteToJson.ps1
# Einfaches und robustes Skript zum Konvertieren von teste.csv zu tests.json

# Pfade definieren
$csvPath = "teste.csv"
$jsonPath = "tests_importiert$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).json"
Write-Host "Konvertiere $csvPath zu $jsonPath"

# CSV einlesen
try {
    Write-Host "Versuche CSV zu lesen..."
    $csvContent = Get-Content -Path $csvPath -Raw
    Write-Host "$($csvContent.Length) Zeichen aus CSV gelesen."
    
    # CSV-Header ermitteln
    $csvLines = $csvContent -split "`n"
    $header = $csvLines[0] -split ";"
    Write-Host "CSV-Header gefunden: $($header.Count) Spalten"
    
    # CSV manuell parsen
    $tests = @()
    for ($i = 1; $i -lt $csvLines.Count; $i++) {
        $line = $csvLines[$i].Trim()
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        $columns = $line -split ";"
        
        # Einfaches Test-Objekt erstellen
        $test = @{
            id = "T" + $columns[0].PadLeft(4, '0')
            name = $columns[12] # NAME_BEFUND_LANG
            kategorie = "Labordiagnostik"
            material = @()
            aktiv = $true
            befundzeit = "24 Stunden"
            synonyme = @($columns[7], $columns[8], $columns[9]) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
            einheit_id = $columns[15]
        }
        
        # Material-ID mappen (vereinfacht)
        $materialId = $columns[22] # MATERIAL_ID
        if (-not [string]::IsNullOrWhiteSpace($materialId)) {
            switch ($materialId) {
                "1" { $test.material = @("SER-00") } # Serum
                "2" { $test.material = @("URI-00") } # Urin
                "4" { $test.material = @("LIQ-00") } # Liquor
                "42" { $test.material = @("SER-00") } # Serum (alternative ID)
                Default { $test.material = @() }
            }
        }
        
        # Füge den Test hinzu
        $tests += $test
    }
    
    # Als JSON speichern
    Write-Host "Speichere $($tests.Count) Tests als JSON..."
    $jsonContent = $tests | ConvertTo-Json -Depth 5
    $jsonContent | Set-Content $jsonPath -Encoding UTF8
    
    Write-Host "Konvertierung abgeschlossen. JSON-Datei: $jsonPath"
    
} catch {
    Write-Host "Fehler: $_" -ForegroundColor Red
    Write-Host "Stacktrace: $($_.ScriptStackTrace)" -ForegroundColor Red
}
