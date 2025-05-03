#!/usr/bin/env pwsh
# SimpleTestJsonEditor.ps1
# Ein vereinfachtes Skript zum Hinzufügen von Tests zu tests.json mit DuckDB
# Autor: GitHub Copilot
# Datum: 02.05.2025

# Pfad zur tests.json Datei
$testsJsonPath = "./public/tests.json"
$backupFolder = "./backups"

# Stellt sicher, dass der Backup-Ordner existiert
if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
}

# Erstellt ein Backup der tests.json Datei
function Backup-TestsJson {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $backupFolder "tests_$timestamp.json"
    
    Copy-Item $testsJsonPath $backupPath -Force
    Write-Host "Backup erstellt: $backupPath" -ForegroundColor Green
    
    return $backupPath
}

# Fügt einen neuen Test zur tests.json Datei hinzu
function Add-NewTest {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$Id,
        
        [Parameter(Mandatory=$true)]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        [string]$Kategorie,
        
        [Parameter(Mandatory=$true)]
        [string[]]$Material,
        
        [string]$Befundzeit = "3 Stunden",
        
        [double]$MindestmengeMl = 0.5
    )
    
    # Erstelle Backup
    $backupFile = Backup-TestsJson
    
    try {
        # Lade aktuelle Tests
        $tests = Get-Content -Path $testsJsonPath | ConvertFrom-Json -AsHashtable
        
        # Erstelle neuen Test
        $newTest = @{
            id = $Id
            name = $Name
            kategorie = $Kategorie
            material = $Material
            befundzeit = $Befundzeit
            mindestmenge_ml = $MindestmengeMl
            synonyme = @()
            aktiv = $true
        }
        
        # Füge Test hinzu
        $tests += $newTest
          # Speichere zurück
        $tests | ConvertTo-Json -Depth 5 | Set-Content -Path $testsJsonPath
        
        Write-Host "Test '$Id - $Name' erfolgreich hinzugefügt." -ForegroundColor Green
        
        # Verwende DuckDB zur Überprüfung
        Write-Host "`nDer neue Test:" -ForegroundColor Yellow
        duckdb -c "SELECT id, name, kategorie, material FROM read_json_auto('$testsJsonPath') WHERE id = '$Id';" -ascii | Out-String | Write-Host
        
        return $true
    }
    catch {
        Write-Host "Fehler beim Hinzufügen des Tests: $_" -ForegroundColor Red
        
        # Stelle Backup wieder her
        Copy-Item $backupFile $testsJsonPath -Force
        Write-Host "Backup wiederhergestellt." -ForegroundColor Yellow
        
        return $false
    }
}

# Listet die Tests nach ID oder Namen auf
function Find-Tests {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$Suchbegriff
    )
    
    $query = "SELECT id, name, kategorie, material, befundzeit
              FROM read_json_auto('$testsJsonPath') 
              WHERE id LIKE '%$Suchbegriff%' OR name LIKE '%$Suchbegriff%'
              LIMIT 20;"
    
    Write-Host "Suche nach Tests mit '$Suchbegriff':" -ForegroundColor Yellow
    duckdb -c $query -ascii | Out-String | Write-Host
}

# Beispiel für Menü
function Show-Menu {
    Clear-Host
    Write-Host "==== SpecimenOne Simple Tests.json Editor ====" -ForegroundColor Cyan
    Write-Host "1: Test suchen"
    Write-Host "2: Neuen Test hinzufügen"
    Write-Host "3: Datenbank analysieren"
    Write-Host "Q: Beenden"
    Write-Host "==========================================="
}

function Start-SimpleEditor {
    $running = $true
    
    while ($running) {
        Show-Menu
        $choice = Read-Host "Wähle eine Option"
        
        switch ($choice) {
            "1" {
                $suchbegriff = Read-Host "Suchbegriff eingeben"
                Find-Tests -Suchbegriff $suchbegriff
                Pause
            }
            "2" {
                $id = Read-Host "Test-ID eingeben"
                $name = Read-Host "Name des Tests"
                $kategorie = Read-Host "Kategorie"
                $materialRaw = Read-Host "Material (kommagetrennt, z.B. SE-00,SE-10)"
                $material = $materialRaw -split ',' | ForEach-Object { $_.Trim() }
                
                Add-NewTest -Id $id -Name $name -Kategorie $kategorie -Material $material
                
                Pause
            }
            "3" {
                $query = "SELECT kategorie, COUNT(*) as AnzahlTests 
                          FROM read_json_auto('$testsJsonPath') 
                          GROUP BY kategorie 
                          ORDER BY AnzahlTests DESC;"
                
                Write-Host "Tests pro Kategorie:" -ForegroundColor Yellow
                duckdb -c $query -ascii | Out-String | Write-Host
                
                Pause
            }
            "q" {
                $running = $false
            }
            "Q" {
                $running = $false
            }
            default {
                Write-Host "Ungültige Option. Bitte erneut versuchen." -ForegroundColor Red
                Pause
            }
        }
    }
}

# Starte das Tool
Start-SimpleEditor

# Hinweis zur Behebung von Darstellungsproblemen
Write-Host "Bei fehlerhafter Darstellung der Ausgabe in PowerShell folgenden Befehl ausführen:" -ForegroundColor Green
Write-Host "$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8" -ForegroundColor Yellow
