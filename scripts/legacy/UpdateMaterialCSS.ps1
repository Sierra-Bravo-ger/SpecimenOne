# UpdateMaterialCSS.ps1
# Dieses Skript liest die material.json und farben.json Dateien und generiert automatisch 
# die entsprechenden CSS-Klassen in material-badges.css
# Autor: GitHub Copilot
# Datum: 28.04.2025

# Dateipfade
$materialJsonPath = "./public/material.json"
$farbenJsonPath = "./public/farben.json"
$cssPath = "./src/styles/material-badges.css"
$bakPath = "./src/styles/material-badges.css.bak"

# Farbtextmarkierungen
function Write-ColorText($text, $color) {
    Write-Host $text -ForegroundColor $color
}

# Funktion zum Verdunkeln einer Farbe (Ersatz für SCSS darken-Funktion)
function DarkenColor($hex, $percent) {
    # Entferne #-Zeichen und konvertiere in RGB
    $hex = $hex -replace '#', ''
    $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
    
    # Verdunkelung um den angegebenen Prozentsatz
    $factor = 1 - ($percent / 100)
    $r = [Math]::Max(0, [Math]::Min(255, [Math]::Floor($r * $factor)))
    $g = [Math]::Max(0, [Math]::Min(255, [Math]::Floor($g * $factor)))
    $b = [Math]::Max(0, [Math]::Min(255, [Math]::Floor($b * $factor)))
    
    # Zurück in Hex konvertieren
    $newHex = "#{0:X2}{1:X2}{2:X2}" -f [int]$r, [int]$g, [int]$b
    return $newHex
}

# Funktion zur Bereinigung von Strings für CSS-Selektoren
function Get-CSSValidSelector($string) {
    if ([string]::IsNullOrWhiteSpace($string)) {
        return "unbekannt"
    }
    
    # Entferne ungültige Zeichen für CSS-Selektoren (wie ?, :, etc.)
    $validSelector = $string -replace '[^a-zA-Z0-9\-_]', '-'
    
    # Stelle sicher, dass der Selektor nicht mit einer Zahl oder einem Bindestrich beginnt
    if ($validSelector -match '^[0-9-]') {
        $validSelector = "m" + $validSelector
    }
    
    return $validSelector
}

# Header und Footer für die generierte CSS
$cssHeader = @"
/* 
 * Spezielle Styling für Material-Badges 
 * Diese Datei wurde automatisch generiert von UpdateMaterialCSS.ps1 am $(Get-Date)
 * Basiert auf material.json und farben.json
 */

/* Gemeinsame Basis-Stil für alle Material-Badges */
.material-badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  margin: 0.25rem 0;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border-width: 1px;
  border-style: solid;
  border-color: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  will-change: transform;
}

/* Mini-Badge-Variante */
.material-badge-mini {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}

/* Standard-Badge-Variante */
.material-badge-standard {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-right: 0.375rem;
  margin-bottom: 0.25rem;
}

/* Hover-Effekt für alle Badges */
.material-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

/* Fehler-Status */
.material-badge-error {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px dashed #ef4444;
}

/* 
 * Animations-Stil für Ladezustand
 */
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
}
.pulse-animation {
  animation: pulse 1.5s infinite ease-in-out;
}

/* 
 * Material-spezifische Klassen
 * Generiert aus material.json und farben.json
 */
"@

$cssFooter = @"

/* Fallback-Stil für andere Materialien */
.material-default {
  background-color: #9e9e9e;
  border-color: #616161;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

/* Dark Mode Anpassungen */
@media (prefers-color-scheme: dark) {
  .material-badge {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .material-badge:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  }
  
  .material-badge-loading {
    background-color: #424242;
    color: #a0a0a0;
  }
  
  .material-badge-error {
    background-color: rgba(185, 28, 28, 0.2);
    color: #ef4444;
  }
}
"@

Write-ColorText "Material CSS-Generator" "Cyan"
Write-ColorText "--------------------" "Cyan"

# Backup der aktuellen CSS-Datei erstellen
if (Test-Path $cssPath) {
    Copy-Item -Path $cssPath -Destination $bakPath -Force
    Write-ColorText "Backup der CSS-Datei erstellt: $bakPath" "Green"
}

# Laden der Farben aus farben.json
$farbenMap = @{}
if (Test-Path $farbenJsonPath) {
    try {
        $farbenJson = Get-Content -Path $farbenJsonPath -Raw | ConvertFrom-Json
        foreach ($farbe in $farbenJson.farben) {
            $farbenMap[$farbe.id] = @{
                hex = $farbe.hex
                textColor = $farbe.textColor
                bezeichnung = $farbe.bezeichnung
            }
        }
        Write-ColorText "Farben-Definitionen aus farben.json geladen: $($farbenMap.Count) Farben" "Green"
    } catch {
        Write-ColorText "Fehler beim Einlesen der farben.json: $_" "Red"
    }
}

# Laden der Material-Daten aus material.json
$material = @()
if (Test-Path $materialJsonPath) {
    try {
        $materialJson = Get-Content -Path $materialJsonPath -Raw | ConvertFrom-Json
        $material = $materialJson.materialien
        Write-ColorText "Material-Daten aus material.json geladen: $($material.Count) Materialien" "Green"
    } catch {
        Write-ColorText "Fehler beim Einlesen der material.json: $_" "Red"
    }
}

# CSS-Klassen für alle Materialien generieren
$cssMaterialClasses = ""
$processedMaterials = @{}
$cssColorsByFarbenId = @{}

foreach ($item in $material) {
    # Material-ID für CSS bereinigen
    $materialId = $item.material_id
    $cssValidMaterialId = Get-CSSValidSelector -string $materialId
    
    # Nur eindeutige Material-IDs verarbeiten
    if ($processedMaterials.ContainsKey($cssValidMaterialId)) {
        Write-ColorText "Warnung: Doppeltes Material mit CSS-ID '$cssValidMaterialId' gefunden, überspringe..." "Yellow"
        continue
    }
    
    $materialBezeichnung = $item.material_bezeichnung
    $cssValidMaterialBezeichnung = Get-CSSValidSelector -string $materialBezeichnung
    $farbenId = $item.farben_id
    $cssClass = "material-$($cssValidMaterialId.ToLower())"
    
    # CSS für Farben-ID basierte Klassen
    if ($farbenId -and $farbenMap.ContainsKey($farbenId)) {
        $farbe = $farbenMap[$farbenId]
        $hex = $farbe.hex
        $borderColor = DarkenColor -hex $hex -percent 15
        $textColor = $farbe.textColor
        $textShadow = ""
        
        if ($textColor -eq "white") {
            $textShadow = "text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);"
        }
        
        # Hinzufügen einer Farben-ID-basierten Klasse, wenn noch nicht vorhanden
        if (-not $cssColorsByFarbenId.ContainsKey($farbenId)) {
            $cssColorsByFarbenId[$farbenId] = @"
/* Farbe ID: $farbenId - $($farbe.bezeichnung) */
.material-color-$farbenId {
  background-color: $hex;
  border-color: $borderColor;
  color: $textColor;
  $textShadow
}
"@
        }
        
        # Material-spezifische Klasse
        $cssMaterialClasses += @"

/* $materialBezeichnung - $materialId */
.$cssClass {
  background-color: $hex;
  border-color: $borderColor;
  color: $textColor;
  $textShadow
}
"@
    } else {
        # Standard-Farbe für unbekannte Farben-IDs
        $cssMaterialClasses += @"

/* $materialBezeichnung - $materialId */
.$cssClass {
  background-color: #9e9e9e;
  border-color: #616161;
  color: white;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}
"@
    }
    
    $processedMaterials[$cssValidMaterialId] = $true
}

# Farben-ID-basierte Klassen hinzufügen
$cssFarbenIdClasses = "`n/* Farben-ID-basierte Klassen für direkten Zugriff */`n"
foreach ($farbenIdClass in $cssColorsByFarbenId.Values) {
    $cssFarbenIdClasses += "`n$farbenIdClass"
}

# Gesamtes CSS zusammenbauen
$cssContent = $cssHeader + $cssMaterialClasses + $cssFarbenIdClasses + $cssFooter

# CSS-Datei schreiben
Set-Content -Path $cssPath -Value $cssContent
Write-ColorText "CSS-Datei erfolgreich generiert: $cssPath" "Green"
Write-ColorText "$($processedMaterials.Count) Material-Klassen erstellt" "Green"
Write-ColorText "$($cssColorsByFarbenId.Count) Farben-ID-basierte Klassen erstellt" "Green"

Write-ColorText "`nAbgeschlossen." "Cyan"
