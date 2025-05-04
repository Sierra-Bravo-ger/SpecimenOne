# API-Testskript für SpecimenOne
# Dieses Skript prüft, ob alle API-Endpunkte korrekt funktionieren

function Write-StatusMessage {
    param (
        [string]$Message,
        [string]$Status = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Status) {
        "SUCCESS" { 
            Write-Host "[$timestamp] [SUCCESS] $Message" -ForegroundColor Green 
        }
        "ERROR" { 
            Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red 
        }
        "WARNING" { 
            Write-Host "[$timestamp] [WARNING] $Message" -ForegroundColor Yellow 
        }
        default { 
            Write-Host "[$timestamp] [INFO] $Message" -ForegroundColor Cyan 
        }
    }
}

function Test-ApiEndpoint {
    param (
        [string]$Endpoint,
        [string]$Description
    )
    
    $url = "http://localhost:3001/api/$Endpoint"
    Write-StatusMessage "Teste $Description ($url)..."
    
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec 5
        
        if ($response) {
            Write-StatusMessage "Endpunkt $Description funktioniert!" -Status "SUCCESS"
            return $true
        } else {
            Write-StatusMessage "Endpunkt $Description liefert leere Antwort" -Status "WARNING"
            return $false
        }
    } catch {
        Write-StatusMessage "Fehler beim Testen von $Description: $($_.Exception.Message)" -Status "ERROR"
        return $false
    }
}

# Titelausgabe
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "    SpecimenOne API-Integration Tests    " -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host ""

# Teste ob der Server überhaupt läuft
Write-StatusMessage "Prüfe API-Server-Verbindung..."
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-StatusMessage "API-Server ist erreichbar!" -Status "SUCCESS"
} catch {
    Write-StatusMessage "API-Server ist nicht erreichbar! Bitte starten Sie den Server." -Status "ERROR"
    Write-StatusMessage "Server starten mit: cd c:\Projekte\SpecimenOne\server; npm run dev" -Status "INFO"
    exit 1
}

# Teste alle API-Endpunkte
$endpointTests = @(
    @{ Endpoint = "material"; Description = "Materialien" },
    @{ Endpoint = "einheiten"; Description = "Einheiten" },
    @{ Endpoint = "farben"; Description = "Farben" },
    @{ Endpoint = "tests?limit=5"; Description = "Tests (mit Limit)" },
    @{ Endpoint = "tests/T0003"; Description = "Einzelner Test mit Referenzwerten" },
    @{ Endpoint = "profile?limit=5"; Description = "Profile (mit Limit)" }
)

$allTestsPassed = $true
foreach ($test in $endpointTests) {
    $success = Test-ApiEndpoint -Endpoint $test.Endpoint -Description $test.Description
    if (-not $success) {
        $allTestsPassed = $false
    }
}

# Abschluss und Zusammenfassung
Write-Host ""
Write-Host "=========================================" -ForegroundColor Blue
if ($allTestsPassed) {
    Write-StatusMessage "Alle API-Tests erfolgreich!" -Status "SUCCESS"
    Write-StatusMessage "Sie können mit der Integration fortfahren." -Status "SUCCESS"
} else {
    Write-StatusMessage "Es gibt Probleme mit der API. Bitte beheben Sie diese, bevor Sie fortfahren." -Status "WARNING"
    Write-StatusMessage "Siehe API-INTEGRATION-GUIDE.md für Hilfe." -Status "INFO"
}
Write-Host "=========================================" -ForegroundColor Blue
