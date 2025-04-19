param(
    [switch]$ExternalAccess,
    [int]$PortNumber = 8090
)

$allowedHosts = @("localhost", "192.168.178.45", "127.0.0.1")

function IsAllowedHost($req) {
    $hostHeader = $req.Headers["Host"]
    return $allowedHosts -contains $hostHeader.Split(":")[0]
}

# Erlaubte Hosts definieren
$allowedHosts = @("localhost", "192.168.178.45", "127.0.0.1")

function IsAllowedHost($req) {
    $hostHeader = $req.Headers["Host"]
    return $allowedHosts -contains $hostHeader.Split(":")[0]
}

# startTestMenu.ps1
# Startet einen lokalen Webserver für Labor Test Menu

# Parameter für den Server

# Funktion zum Finden eines freien Ports
function Find-FirstFreePort {
    param (
        [int]$StartPort = 8080,
        [int]$MaxPort = 8180
    )
    
    for ($port = $StartPort; $port -le $MaxPort; $port++) {
        $tcpListener = $null
        try {
            $tcpListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
            $tcpListener.Start()
            return $port
        } catch {
            # Port ist bereits belegt, nächsten probieren
            continue
        } finally {
            if ($tcpListener -ne $null) {
                $tcpListener.Stop()
            }
        }
    }
    
    throw "Kein freier Port zwischen $StartPort und $MaxPort gefunden"
}

# Freien Port suchen oder blockierenden Prozess beenden
$port = $PortNumber

try {
    # Prüfen, ob der gewünschte Port verfügbar ist
    $ipAddress = if ($ExternalAccess) { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
    $tcpTest = New-Object System.Net.Sockets.TcpListener($ipAddress, $port)
    $tcpTest.Start()
    $tcpTest.Stop()
} catch {
    # Port wird verwendet, einen anderen Port suchen
    Write-Host "Port $port ist nicht verfügbar. Suche einen alternativen Port..." -ForegroundColor Yellow
    $port = Find-FirstFreePort
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Alternative Version mit .NET Framework statt HttpListener
Add-Type @"
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.IO;
using System.Threading;

namespace SimpleWebServer
{
    public class Server
    {
        private TcpListener listener;
        private bool running = false;
        private string rootPath;
        private int port;
        private bool externalAccess;

        public Server(string rootDirectory, int serverPort, bool allowExternalAccess)
        {
            this.rootPath = rootDirectory;
            this.port = serverPort;
            this.externalAccess = allowExternalAccess;
        }

        public void Start()
        {
            if (running) return;
            
            try
            {
                IPAddress bindAddress = externalAccess ? IPAddress.Any : IPAddress.Loopback;
                listener = new TcpListener(bindAddress, port);
                listener.Start();
                running = true;
                
                string hostName = Dns.GetHostName();
                string externalMessage = externalAccess 
                    ? "\nExtern erreichbar über: http://" + hostName + ":" + port + "/index.html"
                    : "\nNur lokal erreichbar. Für externen Zugriff starten Sie mit: -ExternalAccess";
                
                Console.WriteLine("Server gestartet auf http://localhost:" + port + "/");
                Console.WriteLine(externalMessage);
                
                while (running)
                {
                    try
                    {
                        // Anfragen asynchron akzeptieren und verarbeiten
                        TcpClient client = listener.AcceptTcpClient();
                        ThreadPool.QueueUserWorkItem(ProcessClientRequest, client);
                    }
                    catch (Exception ex)
                    {
                        if (running) // Nur ausgeben, wenn nicht beabsichtigt gestoppt
                            Console.WriteLine("Fehler beim Akzeptieren der Verbindung: " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Server-Fehler: " + ex.Message);
            }
            finally
            {
                if (listener != null)
                {
                    listener.Stop();
                }
            }
        }

        public void Stop()
        {
            running = false;
            if (listener != null)
            {
                listener.Stop();
            }
            Console.WriteLine("Server gestoppt.");
        }

        private void ProcessClientRequest(object state)
        {
            TcpClient client = (TcpClient)state;
            
            using (NetworkStream stream = client.GetStream())
            using (StreamReader reader = new StreamReader(stream))
            using (StreamWriter writer = new StreamWriter(stream))
            {
                try
                {
                    // Request-Header einlesen
                    string request = reader.ReadLine();
                    
                    if (string.IsNullOrEmpty(request))
                        return;
                        
                    // Request-Zeile parsen: "GET /path HTTP/1.1"
                    string[] requestParts = request.Split(' ');
                    if (requestParts.Length < 2)
                        return;
                        
                    string method = requestParts[0];
                    string rawPath = requestParts[1];
                    
                    // Host-Header finden
                    string hostHeader = "";
                    string line;
                    while (!string.IsNullOrEmpty(line = reader.ReadLine())) {
                        if (line.StartsWith("Host:", StringComparison.OrdinalIgnoreCase)) {
                            hostHeader = line.Substring(5).Trim();
                            // Host-Header extrahieren (für Logging)
                            Console.WriteLine("Host-Header: " + hostHeader);
                        }
                    }
                    
                    // Pfad dekodieren und normalisieren
                    string path = Uri.UnescapeDataString(rawPath).TrimStart('/');
                    if (string.IsNullOrEmpty(path))
                        path = "index.html";
                    
                    // Spezielle Behandlung für /csv/ Anfragen
                    if (path.StartsWith("csv/", StringComparison.OrdinalIgnoreCase))
                    {
                        string csvFileName = path.Substring(4); // Entferne "csv/"
                        string csvFilePath = Path.Combine(rootPath, csvFileName);
                        
                        // Wenn keine spezifische CSV-Datei angefordert wurde, zeige eine Liste der verfügbaren CSV-Dateien
                        if (string.IsNullOrEmpty(csvFileName))
                        {
                            string[] csvFiles = Directory.GetFiles(rootPath, "*.csv");
                            writer.WriteLine("HTTP/1.1 200 OK");
                            writer.WriteLine("Content-Type: text/html; charset=utf-8");
                            writer.WriteLine();
                            writer.WriteLine("<html><head><title>CSV-Dateien</title></head><body>");
                            writer.WriteLine("<h1>Verfügbare CSV-Dateien</h1>");
                            writer.WriteLine("<ul>");
                            
                            foreach (string csvFile in csvFiles)
                            {
                                string name = Path.GetFileName(csvFile);
                                writer.WriteLine("<li><a href='/csv/" + name + "'>" + name + "</a></li>");
                            }
                            
                            writer.WriteLine("</ul></body></html>");
                            writer.Flush();
                            Console.WriteLine("200: CSV-Dateiliste (Host: " + hostHeader + ")");
                            return;
                        }
                        
                        // Prüfe ob die CSV-Datei existiert
                        if (File.Exists(csvFilePath) && Path.GetExtension(csvFilePath).ToLower() == ".csv")
                        {
                            byte[] fileData = File.ReadAllBytes(csvFilePath);
                            
                            writer.WriteLine("HTTP/1.1 200 OK");
                            writer.WriteLine("Content-Type: text/csv; charset=utf-8");
                            writer.WriteLine("Content-Length: " + fileData.Length);
                            writer.WriteLine("Connection: close");
                            writer.WriteLine();
                            writer.Flush();
                            
                            stream.Write(fileData, 0, fileData.Length);
                            stream.Flush();
                            
                            Console.WriteLine("200: CSV-Datei " + csvFileName + " (Host: " + hostHeader + ", " + fileData.Length + " Bytes)");
                            return;
                        }
                        else
                        {
                            // CSV-Datei nicht gefunden
                            writer.WriteLine("HTTP/1.1 404 Not Found");
                            writer.WriteLine("Content-Type: text/html");
                            writer.WriteLine();
                            writer.WriteLine("<html><body><h1>404 - CSV-Datei nicht gefunden: " + csvFileName + "</h1></body></html>");
                            writer.Flush();
                            Console.WriteLine("404: CSV-Datei " + csvFileName + " (Host: " + hostHeader + ")");
                            return;
                        }
                    }
                    
                    // Lokalen Dateipfad bestimmen
                    string filePath = Path.Combine(rootPath, path.Replace('/', Path.DirectorySeparatorChar));                    
                    if (!File.Exists(filePath))
                    {
                        // 404 Fehler
                        writer.WriteLine("HTTP/1.1 404 Not Found");
                        writer.WriteLine("Content-Type: text/html");
                        writer.WriteLine();
                        writer.WriteLine("<html><body><h1>404 - Datei nicht gefunden: " + path + "</h1></body></html>");
                        writer.Flush();
                        Console.WriteLine("404: " + path + " (Host: " + hostHeader + ")");
                        return;
                    }
                    
                    // Content-Type bestimmen
                    string contentType = "application/octet-stream";
                    string extension = Path.GetExtension(filePath).ToLower();
                    
                    switch (extension)
                    {
                        case ".html": contentType = "text/html; charset=utf-8"; break;
                        case ".css": contentType = "text/css; charset=utf-8"; break;
                        case ".js": contentType = "application/javascript; charset=utf-8"; break;
                        case ".csv": contentType = "text/csv; charset=utf-8"; break;
                        case ".png": contentType = "image/png"; break;
                        case ".jpg": case ".jpeg": contentType = "image/jpeg"; break;
                        case ".gif": contentType = "image/gif"; break;
                        case ".svg": contentType = "image/svg+xml"; break;
                        case ".woff": contentType = "font/woff"; break;
                        case ".woff2": contentType = "font/woff2"; break;
                        case ".ttf": contentType = "font/ttf"; break;
                        case ".eot": contentType = "application/vnd.ms-fontobject"; break;
                    }
                    
                    // Datei lesen und senden
                    byte[] responseData = File.ReadAllBytes(filePath);
                    
                    // HTTP-Antwort senden
                    writer.WriteLine("HTTP/1.1 200 OK");
                    writer.WriteLine("Content-Type: " + contentType);
                    writer.WriteLine("Content-Length: " + responseData.Length);
                    writer.WriteLine("Connection: close");
                    writer.WriteLine();
                    writer.Flush();
                    
                    // Binärdaten schreiben
                    stream.Write(responseData, 0, responseData.Length);
                    stream.Flush();
                    
                    Console.WriteLine("200: " + path + " (Host: " + hostHeader + ", " + responseData.Length + " Bytes)");
                }
                catch (Exception ex)
                {
                    try
                    {
                        // Fehlerantwort senden
                        writer.WriteLine("HTTP/1.1 500 Internal Server Error");
                        writer.WriteLine("Content-Type: text/html");
                        writer.WriteLine();
                        writer.WriteLine("<html><body><h1>500 - Interner Serverfehler</h1><p>" + ex.Message + "</p></body></html>");
                        writer.Flush();
                    }
                    catch
                    {
                        // Ignorieren, wenn wir keine Antwort mehr senden können
                    }
                    
                    Console.WriteLine("Fehler bei der Anfrageverarbeitung: " + ex.Message);
                }
            }
            
            client.Close();
        }
    }
}
"@ -ReferencedAssemblies System.dll

Write-Host "Server wird gestartet..."

# Zugriffstyp anzeigen
$accessType = if ($ExternalAccess) { "extern" } else { "nur lokal" }
$hostname = [System.Net.Dns]::GetHostName()
$ipAddresses = [System.Net.Dns]::GetHostAddresses($hostname) | Where-Object { $_.AddressFamily -eq 'InterNetwork' } | ForEach-Object { $_.IPAddressToString }

Write-Host "Zugriffstyp: $accessType"
if ($ExternalAccess -and $ipAddresses) {
    Write-Host "Dashboard ist erreichbar unter:" -ForegroundColor Green
    Write-Host "  http://localhost:$port/index.html (lokal)" -ForegroundColor Green
    foreach ($ip in $ipAddresses) {
        Write-Host "  http://$ip`:$port/index.html (Netzwerk)" -ForegroundColor Green
    }
    Write-Host "  http://*:$port/index.html (mit korrektem DNS-Eintrag)" -ForegroundColor Green
    Write-Host "`nHinweis: Der Server akzeptiert Anfragen unabhängig vom Host-Header." -ForegroundColor Cyan
    Write-Host "Für HTTPS-Unterstützung verwenden Sie bitte einen externen Reverse Proxy." -ForegroundColor Cyan
} else {
    Write-Host "Dashboard verfügbar unter: http://localhost:$port/index.html" -ForegroundColor Green
    Write-Host "Für EXTERNEN Zugriff starten Sie mit: .\start-AFM-Dashboard.ps1 -ExternalAccess" -ForegroundColor Yellow
}

Write-Host "Drücken Sie Strg+C zum Beenden" -ForegroundColor Yellow

# Browser öffnen
Start-Process "http://localhost:$port/index.html"

# Server-Instanz erstellen und starten
$server = New-Object SimpleWebServer.Server -ArgumentList $root, $port, $ExternalAccess

try {
    Write-Host "Server läuft... (Drücken Sie STRG+C zum Beenden)"
    
    # Server direkt im Hauptthread starten
    $server.Start()
    
    # Dieser Code wird erst erreicht, wenn der Server beendet wird
    Write-Host "Server wurde beendet" -ForegroundColor Yellow
} 
catch {
    Write-Host "Fehler: $_" -ForegroundColor Red
}
finally {
    # Server sauber beenden
    if ($server) {
        $server.Stop()
    }
    
    Write-Host "Webserver wurde beendet." -ForegroundColor Cyan
}