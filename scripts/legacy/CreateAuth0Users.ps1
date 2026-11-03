# CreateAuth0Users.ps1
# Skript zum Anlegen von Benutzern in Auth0 über die Management API

# Konfiguration
$domain = "dev-5shoy21cytn3t52n.eu.auth0.com"
$clientId = "YOUR_MANAGEMENT_API_CLIENT_ID" # Nicht der gleiche wie für die SPA
$clientSecret = "YOUR_MANAGEMENT_API_CLIENT_SECRET"
$connection = "Username-Password-Authentication" # Standard-Verbindung für Benutzername/Passwort

# Funktion zum Abrufen des Management API-Tokens
function Get-Auth0Token {
    $body = @{
        client_id     = $clientId
        client_secret = $clientSecret
        audience      = "https://$domain/api/v2/"
        grant_type    = "client_credentials"
    }

    $response = Invoke-RestMethod -Uri "https://$domain/oauth/token" -Method Post -Body $body -ContentType "application/json"
    return $response.access_token
}

# Funktion zum Erstellen eines Benutzers
function New-Auth0User {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Email,
        
        [Parameter(Mandatory = $true)]
        [string]$Password,
        
        [Parameter(Mandatory = $false)]
        [string]$FirstName,
        
        [Parameter(Mandatory = $false)]
        [string]$LastName,
        
        [Parameter(Mandatory = $false)]
        [string]$Role
    )

    $token = Get-Auth0Token
    
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
      $userData = @{
        email = $Email
        password = $Password
        connection = $connection
        email_verified = $true  # E-Mail als verifiziert markieren, auch wenn sie nicht gültig ist
        verify_email = $false   # Keine Verifizierungs-E-Mail senden
        username = $Email.Split('@')[0]  # Optional: Benutzernamen aus dem Teil vor dem @-Zeichen erstellen
    }
    
    # Füge Benutzermetadaten hinzu, wenn vorhanden
    if ($FirstName -or $LastName) {
        $userData.user_metadata = @{}
        
        if ($FirstName) { $userData.user_metadata.first_name = $FirstName }
        if ($LastName) { $userData.user_metadata.last_name = $LastName }
    }

    # Konvertiere Daten zu JSON
    $userDataJson = $userData | ConvertTo-Json -Depth 4

    try {
        $response = Invoke-RestMethod -Uri "https://$domain/api/v2/users" -Method Post -Headers $headers -Body $userDataJson
        Write-Host "Benutzer $Email erfolgreich angelegt" -ForegroundColor Green
        
        # Wenn eine Rolle zugewiesen werden soll, müssen wir die Benutzer-ID haben und dann einen weiteren API-Call machen
        if ($Role) {
            # Hier würde die Rollenzuweisung erfolgen
            # Dies erfordert die ID der Rolle und einen separaten API-Aufruf
        }
        
        return $response
    }
    catch {
        Write-Host "Fehler beim Anlegen des Benutzers $Email" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode.Value__
        Write-Host $_.Exception.Response.StatusDescription
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
}

# Beispiel für die Benutzererstellung
# New-Auth0User -Email "labor@example.com" -Password "StrongP@ssw0rd!" -FirstName "Labor" -LastName "Mitarbeiter"

# Um mehrere Benutzer aus einer CSV-Datei zu importieren:
function Import-UsersFromCsv {
    param(
        [string]$CsvPath
    )
    
    $users = Import-Csv -Path $CsvPath
    
    foreach ($user in $users) {
        New-Auth0User -Email $user.Email -Password $user.Password `
                      -FirstName $user.FirstName -LastName $user.LastName
        
        # Kurze Pause, um Rate-Limiting zu vermeiden
        Start-Sleep -Milliseconds 200
    }
}

# Beispiel für die Verwendung der CSV-Import-Funktion:
# Import-UsersFromCsv -CsvPath "C:\Projekte\SpecimenOne\auth0_users.csv"

# Anleitung für die CSV-Datei:
Write-Host @"
Anleitung zur Verwendung dieses Skripts:

1. Erstellen Sie ein Management API Client in Auth0:
   - Gehen Sie zum Auth0 Dashboard > Applications > APIs
   - Wählen Sie 'Auth0 Management API'
   - Gehen Sie zu 'Machine to Machine Applications'
   - Authorisieren Sie eine Anwendung oder erstellen Sie eine neue
   - Aktivieren Sie die Berechtigungen für 'create:users' und 'read:users'

2. Aktualisieren Sie die Variablen am Anfang dieses Skripts:
   - $clientId = "Ihr Management API Client ID"
   - $clientSecret = "Ihr Management API Client Secret"

3. Erstellen Sie eine CSV-Datei mit den folgenden Spalten:
   Email,Password,FirstName,LastName

4. Führen Sie die Import-Funktion aus:
   Import-UsersFromCsv -CsvPath "Pfad/zu/ihrer/users.csv"
"@ -ForegroundColor Cyan

# Beispiel für eine CSV-Struktur:
$csvExample = @"
Email,Password,FirstName,LastName
arzt1@example.com,SecurePass1!,Thomas,Müller
labor1@example.com,SecurePass2!,Maria,Schmidt
admin@example.com,AdminPass123!,Admin,User
"@

Write-Host "`nBeispiel für CSV-Format:" -ForegroundColor Yellow
Write-Host $csvExample
