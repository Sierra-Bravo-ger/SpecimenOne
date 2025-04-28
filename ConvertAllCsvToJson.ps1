# ConvertAllCsvToJson.ps1
# Dieses Skript führt alle Konvertierungen von CSV zu JSON aus

Write-Host "SpecimenOne CSV zu JSON Konverter" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Backup der bestehenden JSON-Dateien erstellen
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$backupDir = "backups_$timestamp"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Funktionen für die Sicherung
function Backup-JsonFile {
    param($jsonPath)
    
    if (Test-Path $jsonPath) {
        $fileName = Split-Path $jsonPath -Leaf
        $backupPath = Join-Path $backupDir $fileName
        Copy-Item -Path $jsonPath -Destination $backupPath
        Write-Host "Backup erstellt: $backupPath" -ForegroundColor Gray
    }
}

# Backup der bestehenden JSON-Dateien
Backup-JsonFile -jsonPath "public/material.json"
Backup-JsonFile -jsonPath "public/einheiten.json"
Backup-JsonFile -jsonPath "public/tests.json"

Write-Host ""
Write-Host "0. Material-Erweiterungs-Mapping wird generiert (falls noetig)..." -ForegroundColor Cyan
& .\GenerateMaterialExtensionMapping.ps1

Write-Host ""
Write-Host "1. Material-Konvertierung wird ausgefuehrt..." -ForegroundColor Cyan
& .\ConvertMaterialCsvToJson.ps1

Write-Host ""
Write-Host "2. Einheiten-Konvertierung wird ausgefuehrt..." -ForegroundColor Cyan
& .\ConvertEinheitCsvToJson.ps1

Write-Host ""
Write-Host "3. Tests-Konvertierung wird ausgefuehrt..." -ForegroundColor Cyan
& .\ConvertTesteCsvToJson.ps1

Write-Host ""
Write-Host "Alle Konvertierungen abgeschlossen." -ForegroundColor Green
Write-Host "Die JSON-Dateien wurden in den public/ Ordner exportiert."
