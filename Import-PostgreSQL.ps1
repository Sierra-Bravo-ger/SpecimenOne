#!/usr/bin/env pwsh
# Import-PostgreSQL.ps1
# Skript zum Import von JSON-Dateien in PostgreSQL-Datenbank
# Erstellt am 04.05.2025

# Verbindungsparameter
$dbHost = "192.168.178.43"
$port = "5433"
$database = "specimenone"
$user = "specimen"
$password = "specimenpw"

# Funktion zum Ausführen von SQL-Skripten
function Invoke-SqlScript {
    param (
        [string]$scriptPath
    )
      Write-Host "Führe SQL-Skript aus: $scriptPath" -ForegroundColor Cyan
    psql -h $dbHost -p $port -d $database -U $user -f $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SQL-Skript erfolgreich ausgeführt." -ForegroundColor Green
    }
    else {
        Write-Host "Fehler beim Ausführen des SQL-Skripts." -ForegroundColor Red
        exit 1
    }
}

# Hauptprogramm
Write-Host "=== SpecimenOne PostgreSQL-Import-Tool ===" -ForegroundColor Yellow
Write-Host "Verbindungsdetails:" -ForegroundColor Yellow
Write-Host "Host: $dbHost" -ForegroundColor Cyan
Write-Host "Port: $port" -ForegroundColor Cyan
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host "User: $user" -ForegroundColor Cyan
Write-Host ""

# Umgebungsvariable für PostgreSQL-Passwort setzen
$env:PGPASSWORD = $password

# Verbindungstest
Write-Host "Teste Datenbankverbindung..." -ForegroundColor Cyan
$connectionTest = psql -h $dbHost -p $port -d $database -U $user -c "SELECT 1" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Datenbankverbindung erfolgreich!" -ForegroundColor Green
}
else {
    Write-Host "Fehler bei der Datenbankverbindung: $connectionTest" -ForegroundColor Red
    exit 1
}

# SQL-Skripte ausführen
Write-Host ""
Write-Host "1. Erstelle Tabellen..." -ForegroundColor Yellow
Invoke-SqlScript -scriptPath "c:\Projekte\SpecimenOne\import_tables.sql"

Write-Host ""
Write-Host "2. Importiere Daten..." -ForegroundColor Yellow
Invoke-SqlScript -scriptPath "c:\Projekte\SpecimenOne\import_data.sql"

Write-Host ""
Write-Host "Import abgeschlossen!" -ForegroundColor Green

# PGPASSWORD zurücksetzen
$env:PGPASSWORD = ""
