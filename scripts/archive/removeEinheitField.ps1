# filepath: c:\Projekte\SpecimenOne\removeEinheitField.ps1
# Dieses Skript entfernt das Feld "Einheit" aus allen Einträgen in der referenzwerte.json

# Pfade definieren
$referenzwertePath = "public\referenzwerte.json"
$backupPath = "public\referenzwerte_backup_$(Get-Date -Format yyyy-MM-dd-HH-mm-ss).json"

Write-Host "Starte Bereinigung der Referenzwerte..."

# Backup erstellen
try {
    Copy-Item -Path $referenzwertePath -Destination $backupPath
    Write-Host "Backup erstellt unter: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "Fehler beim Erstellen des Backups: $_" -ForegroundColor Red
    exit 1
}

# JSON-Datei einlesen
try {
    $jsonContent = Get-Content -Path $referenzwertePath -Raw | ConvertFrom-Json
    Write-Host "Referenzwerte erfolgreich geladen." -ForegroundColor Green
} catch {
    Write-Host "Fehler beim Lesen der Referenzwerte: $_" -ForegroundColor Red
    exit 1
}

# Zähler für bearbeitete Einträge
$modifiedCount = 0
$testCount = 0

# Über alle Tests iterieren
foreach ($testId in $jsonContent.PSObject.Properties.Name) {
    $testCount++
    $referenzwerte = $jsonContent.$testId
    
    # Über alle Referenzwerte des Tests iterieren
    for ($i = 0; $i -lt $referenzwerte.Count; $i++) {
        if ($referenzwerte[$i].PSObject.Properties.Name -contains "Einheit") {
            # Einheit-Feld entfernen
            $referenzwerte[$i].PSObject.Properties.Remove("Einheit")
            $modifiedCount++
        }
    }
}

# Veränderte JSON zurückschreiben
try {
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $referenzwertePath
    Write-Host "Referenzwerte erfolgreich aktualisiert." -ForegroundColor Green
    Write-Host "Statistik:"
    Write-Host "   - Tests bearbeitet: $testCount" -ForegroundColor Cyan
    Write-Host "   - 'Einheit' Felder entfernt: $modifiedCount" -ForegroundColor Cyan
} catch {
    Write-Host "Fehler beim Schreiben der aktualisierten Referenzwerte: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nDie Operation wurde erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host "Die Einheiten werden nun dynamisch aus der tests.json geladen." -ForegroundColor Green
