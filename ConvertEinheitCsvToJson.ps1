# Input- und Output-Pfade
$csvPath = "einheit.csv"
$jsonPath = "public/einheiten.json"

Write-Host "Skript wird ausgeführt in: $(Get-Location)"
Write-Host "Starte Import von Einheiten-CSV-Daten aus $csvPath..."

# CSV einlesen mit Semikolon als Trennzeichen (deutsches Format)
try {
    $csv = Import-Csv -Path $csvPath -Delimiter ";"
    Write-Host "$($csv.Count) Einheiten aus CSV eingelesen."
} catch {
    Write-Host "Fehler beim Einlesen der CSV-Datei: $_" -ForegroundColor Red
    exit 1
}

# Umwandlung in die gewünschte JSON-Struktur
$einheiten = @()

foreach ($row in $csv) {
    # Überspringe leere Zeilen
    if ([string]::IsNullOrWhiteSpace($row.EINHEIT_ID)) {
        continue
    }
    
    # Einheit-ID normalisieren (Dezimalzeichen entfernen)
    $einheitId = $row.EINHEIT_ID
    if ($einheitId -match '(\d+),\d+') {
        $einheitId = $matches[1]
    }
    
    # Einheiten-Objekt erstellen mit den neuen Mapping-Vorgaben
    $einheit = [ordered]@{
        einheit_id = "E$einheitId"
        einheit_id_db = $einheitId
        bezeichnung = $row.EINHEIT_ANZ  # Neu: EINHEIT_ANZ statt EINHEIT_NAME
        beschreibung = "noch keine Angabe"  # Neu: Standardtext
        kategorie = "noch keine Angabe"  # Neu: Standardtext
    }
    
    # Einheit zur Liste hinzufügen
    $einheiten += $einheit
}

# Nach einheit_id sortieren
$sortedEinheiten = $einheiten | Sort-Object -Property einheit_id

# Als JSON speichern
$json = $sortedEinheiten | ConvertTo-Json -Depth 10
$json | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "Konvertierung abgeschlossen. $($einheiten.Count) Einheiten wurden nach $jsonPath exportiert."
