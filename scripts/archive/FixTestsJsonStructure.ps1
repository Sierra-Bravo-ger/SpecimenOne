# Skript zum Korrigieren der tests.json Struktur
# Entfernt den "value"-Wrapper und stellt die ursprüngliche Array-Struktur wieder her

# Pfad zur Datei
$testsJsonPath = ".\public\tests.json"

# Ergebnispfad (gleicher Pfad, überschreibt die Datei)
$outputJsonPath = ".\public\tests.json"

# Backup erstellen
$datumZeit = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$backupPath = ".\public\tests_backup_fix_$datumZeit.json"

# Ausgabefunktion für bessere Lesbarkeit
function Write-ColoredOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

try {
    # Originaldatei einlesen
    Write-ColoredOutput "Lese tests.json..." "Cyan"
    $testsJson = Get-Content -Path $testsJsonPath -Raw -Encoding UTF8
    
    # Backup erstellen
    Write-ColoredOutput "Erstelle Backup unter $backupPath" "Yellow"
    Set-Content -Path $backupPath -Value $testsJson -Encoding UTF8
    
    # JSON deserialisieren
    $testsObj = ConvertFrom-Json -InputObject $testsJson
    
    # Prüfen, ob die Struktur einen "value"-Wrapper hat
    if ($testsObj.PSObject.Properties.Name -contains "value") {
        Write-ColoredOutput "Value-Wrapper gefunden, extrahiere die eigentlichen Tests..." "Cyan"
        
        # Nur das Array aus dem "value"-Feld nehmen
        $testsArray = $testsObj.value
        
        # Array zurück in JSON konvertieren (mit Formatierung für bessere Lesbarkeit)
        $correctedJson = ConvertTo-Json -InputObject $testsArray -Depth 10
        
        # JSON in Datei schreiben
        Write-ColoredOutput "Schreibe korrigierte JSON-Struktur..." "Green"
        Set-Content -Path $outputJsonPath -Value $correctedJson -Encoding UTF8
        
        Write-ColoredOutput "Korrektur erfolgreich abgeschlossen!" "Green"
        Write-ColoredOutput "Die tests.json hat jetzt wieder die richtige Array-Struktur." "Green"
    } else {
        Write-ColoredOutput "Die JSON-Datei hat bereits die richtige Struktur (kein 'value'-Wrapper)." "Yellow"
    }
    
} catch {
    Write-ColoredOutput "FEHLER: $_" "Red"
    Write-ColoredOutput $_.ScriptStackTrace "Red"
}
