#!/usr/bin/env pwsh
# TestsJsonUpdaterWithDuckDB.ps1
# Dieses Skript demonstriert, wie DuckDB verwendet werden kann, um tests.json zu aktualisieren
# Autor: Copilot
# Datum: 02.05.2024

# Stellen Sie sicher, dass die erforderlichen Module verfügbar sind
$testsJsonPath = "./public/tests.json"
$backupFolder = "./backups"

# Prüft, ob DuckDB CLI installiert ist
function Test-DuckDBInstalled {
    try {
        $null = Get-Command duckdb -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Wenn DuckDB nicht installiert ist, gibt eine Nachricht aus
if (-not (Test-DuckDBInstalled)) {
    Write-Host "DuckDB ist nicht installiert. Bitte installiere DuckDB über: https://duckdb.org/docs/installation/" -ForegroundColor Red
    Write-Host "Alternativ kannst du es mit 'scoop install duckdb' oder 'winget install duckdb' installieren" -ForegroundColor Yellow
    exit 1
}

# Funktion zur Erstellung einer Sicherungskopie der tests.json
function Backup-TestsJson {
    if (-not (Test-Path $backupFolder)) {
        New-Item -ItemType Directory -Path $backupFolder | Out-Null
        Write-Host "Backup-Verzeichnis erstellt: $backupFolder" -ForegroundColor Green
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $backupFolder "tests_$timestamp.json"
    
    Copy-Item $testsJsonPath $backupFile
    Write-Host "Backup erstellt: $backupFile" -ForegroundColor Green
    
    return $backupFile
}

# Funktion zum Testen der JSON-Struktur nach Änderungen
function Test-JsonStructure {
    param (
        [string]$JsonFile
    )
    
    try {
        $jsonContent = Get-Content $JsonFile -Raw
        $null = $jsonContent | ConvertFrom-Json
        return $true
    }
    catch {
        Write-Host "FEHLER: Die Datei hat keine gültige JSON-Struktur!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Funktion für die Ausführung von SQL-Updates mit DuckDB
function Invoke-DuckDBUpdate {
    param (
        [string]$SqlQuery,
        [string]$OutputFile,
        [string]$Description
    )

    Write-Host "`n$Description" -ForegroundColor Cyan
    Write-Host "SQL: $SqlQuery" -ForegroundColor DarkGray
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
    
    # Führt die SQL-Abfrage direkt aus, ohne temporäre Datei
    duckdb -c "$SqlQuery"
    
    # Prüft, ob die Operation erfolgreich war
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Update erfolgreich durchgeführt." -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "FEHLER bei der Durchführung des Updates." -ForegroundColor Red
        return $false
    }
}

# Funktion für eine einfache Update-Operation für ein einzelnes Testfeld
function Update-TestField {
    param (
        [Parameter(Mandatory=$true)]
        [string]$TestId,
        
        [Parameter(Mandatory=$true)]
        [string]$FieldName,
        
        [Parameter(Mandatory=$true)]
        [string]$NewValue,
        
        [switch]$IsString = $true
    )
      # Backup erstellen
    $backupFile = Backup-TestsJson
    
    # SQL für das Update vorbereiten
    if ($IsString) {
        $newValueSql = "'$NewValue'"
    }
    else {
        $newValueSql = $NewValue
    }
    
    # Pfade mit korrekter Formatierung für DuckDB
    $dbPath = $testsJsonPath.Replace("\", "/")
    $jsonPath = "$FieldName"
    
    # Zeigt den aktuellen Wert an
    $currentValueQuery = "SELECT id, name, $jsonPath AS current_value FROM read_json_auto('$dbPath') WHERE id = '$TestId';"
    Write-Host "`nAktueller Wert:" -ForegroundColor Yellow
    duckdb -c "$currentValueQuery" -ascii | Out-String | Write-Host
    
    # Führt Update durch
    $updateSql = @"
COPY (
    SELECT json_transform(
        json, 
        '{\`"$jsonPath\`": $newValueSql}') AS updated_json
    FROM read_json_auto('$dbPath', auto_detect=false) AS json
    WHERE json->>'id' = '$TestId'
    UNION ALL
    SELECT json AS updated_json
    FROM read_json_auto('$dbPath', auto_detect=false) AS json
    WHERE json->>'id' <> '$TestId'
) TO '$dbPath' (FORMAT JSON);
"@
    
    $success = Invoke-DuckDBUpdate -SqlQuery $updateSql -OutputFile $testsJsonPath -Description "Update $FieldName für Test $TestId auf $NewValue"
    
    if ($success) {
        # Überprüft die JSON-Struktur
        if (-not (Test-JsonStructure -JsonFile $testsJsonPath)) {
            Write-Host "Stelle Backup wieder her..." -ForegroundColor Yellow
            Copy-Item $backupFile $testsJsonPath
            Write-Host "Backup wiederhergestellt." -ForegroundColor Green
            return $false
        }
        
        # Zeigt den neuen Wert an
        Write-Host "`nNeuer Wert:" -ForegroundColor Yellow
        duckdb -c "$currentValueQuery" -ascii | Out-String | Write-Host
        
        return $true
    }
    else {
        Write-Host "Stelle Backup wieder her..." -ForegroundColor Yellow
        Copy-Item $backupFile $testsJsonPath
        Write-Host "Backup wiederhergestellt." -ForegroundColor Green
        return $false
    }
}

# Funktion zum Hinzufügen eines neuen Tests
function Add-NewTest {
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
        
        [double]$MindestmengeMl = 0.5,
        
        [string[]]$Synonyme = @(),
        
        [bool]$Aktiv = $true
    )
      # Backup erstellen
    $backupFile = Backup-TestsJson
      # Material und Synonyme als JSON-Arrays formatieren
    $materialJson = $Material | ConvertTo-Json -Compress
    
    # Für leere Synonyme einen gültigen JSON-Array-String erstellen
    if ($Synonyme.Count -eq 0) {
        $synonymeJson = "[]"
    } else {
        $synonymeJson = $Synonyme | ConvertTo-Json -Compress
    }
    
    # Erstelle Pfad mit korrekter Formatierung für DuckDB
    $dbPath = $testsJsonPath.Replace("\", "/")
    
    # SQL für das Hinzufügen des neuen Tests
    $appendSql = @"
COPY (
    SELECT * FROM read_json_auto('$dbPath')
    UNION ALL
    SELECT * FROM (
        SELECT 
            '$Id' AS id,
            '$Name' AS name,
            '$Kategorie' AS kategorie,
            $materialJson::JSON AS material,            '$Befundzeit' AS befundzeit,
            $MindestmengeMl AS mindestmenge_ml,
            $synonymeJson::JSON AS synonyme,
            $($Aktiv.ToString().ToLower()) AS aktiv
    )
) TO '$dbPath' (FORMAT JSON);
"@
    
    $success = Invoke-DuckDBUpdate -SqlQuery $appendSql -OutputFile $testsJsonPath -Description "Hinzufügen eines neuen Tests mit ID $Id"
    
    if ($success) {
        # Überprüft die JSON-Struktur
        if (-not (Test-JsonStructure -JsonFile $testsJsonPath)) {
            Write-Host "Stelle Backup wieder her..." -ForegroundColor Yellow
            Copy-Item $backupFile $testsJsonPath
            Write-Host "Backup wiederhergestellt." -ForegroundColor Green
            return $false
        }
        
        # Zeigt den neuen Test an
        $showNewTest = "SELECT * FROM read_json_auto('$testsJsonPath') WHERE id = '$Id';"
        Write-Host "`nNeuer Test hinzugefügt:" -ForegroundColor Yellow
        duckdb -c "$showNewTest" -ascii | Out-String | Write-Host
        
        return $true
    }
    else {
        Write-Host "Stelle Backup wieder her..." -ForegroundColor Yellow
        Copy-Item $backupFile $testsJsonPath
        Write-Host "Backup wiederhergestellt." -ForegroundColor Green
        return $false
    }
}

# Beispiele für Verwendung

# 1. Beispiel für einen Menüloop
function Show-Menu {
    Clear-Host
    Write-Host "==== SpecimenOne Tests.json Updater ====" -ForegroundColor Cyan
    Write-Host "1: Einzelnes Feld aktualisieren"
    Write-Host "2: Neuen Test hinzufügen"
    Write-Host "3: Test deaktivieren"
    Write-Host "4: Material eines Tests ändern"
    Write-Host "5: Synonyme eines Tests bearbeiten"
    Write-Host "Q: Beenden"
    Write-Host "========================================"
}

function Start-TestsUpdater {
    $running = $true
    
    while ($running) {
        Show-Menu
        $choice = Read-Host "Wähle eine Option"
        
        switch ($choice) {
            "1" {
                $testId = Read-Host "Test-ID eingeben"
                $fieldName = Read-Host "Feldname eingeben (name, kategorie, befundzeit, mindestmenge_ml, aktiv)"
                $newValue = Read-Host "Neuen Wert eingeben"
                
                $isString = @("name", "kategorie", "befundzeit") -contains $fieldName
                Update-TestField -TestId $testId -FieldName $fieldName -NewValue $newValue -IsString:$isString
                
                Pause
            }
            "2" {
                $id = Read-Host "Neue Test-ID eingeben"
                $name = Read-Host "Name des Tests"
                $kategorie = Read-Host "Kategorie"
                $materialRaw = Read-Host "Material (kommagetrennt, z.B. SE-00,SE-10)"
                $material = $materialRaw -split ',' | ForEach-Object { $_.Trim() }
                
                Add-NewTest -Id $id -Name $name -Kategorie $kategorie -Material $material
                
                Pause
            }
            "3" {
                $testId = Read-Host "ID des zu deaktivierenden Tests"
                Update-TestField -TestId $testId -FieldName "aktiv" -NewValue "false" -IsString:$false
                
                Pause
            }
            "4" {
                $testId = Read-Host "Test-ID eingeben"
                $materialRaw = Read-Host "Neues Material (kommagetrennt, z.B. SE-00,SE-10)"
                $material = $materialRaw -split ',' | ForEach-Object { $_.Trim() }
                $materialJson = $material | ConvertTo-Json -Compress
                
                Update-TestField -TestId $testId -FieldName "material" -NewValue $materialJson -IsString:$false
                
                Pause
            }
            "5" {
                $testId = Read-Host "Test-ID eingeben"
                $synonymeRaw = Read-Host "Neue Synonyme (kommagetrennt)"
                $synonyme = $synonymeRaw -split ',' | ForEach-Object { $_.Trim() }
                $synonymeJson = $synonyme | ConvertTo-Json -Compress
                
                Update-TestField -TestId $testId -FieldName "synonyme" -NewValue $synonymeJson -IsString:$false
                
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
            }        }
    }
}

# Starte das Updater-Tool
Start-TestsUpdater

# Hinweis zur Behebung von Darstellungsproblemen
Write-Host "Bei fehlerhafter Darstellung der Ausgabe in PowerShell folgenden Befehl ausführen:" -ForegroundColor Green
Write-Host "$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8" -ForegroundColor Yellow
