# Konvertiert die Einheiten in tests.json von direkten Werten zu einheit_id-Referenzen
# Verwendet die einheiten.json als Referenz für die Zuordnung

# Pfad zu den Dateien
$testsJsonPath = ".\public\tests.json"
$einheitenJsonPath = ".\public\einheiten.json"

# Erstelle einen Backup der tests.json mit Zeitstempel
$datumZeit = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$backupPath = ".\public\tests_backup_einheiten_$datumZeit.json"

# Fortschrittsanzeige-Funktionen
function Write-ColoredOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Show-Progress {
    param(
        [int]$Current,
        [int]$Total,
        [string]$Activity,
        [string]$Status
    )
    $percentComplete = [math]::Round(($Current / $Total) * 100)
    Write-Progress -Activity $Activity -Status "$Status - $percentComplete% fertig" -PercentComplete $percentComplete
}

# Hauptfunktion
function Convert-EinheitToId {
    try {
        # Dateien einlesen
        Write-ColoredOutput "Lese tests.json..." "Cyan"
        $testsJson = Get-Content -Path $testsJsonPath -Raw -Encoding UTF8
        $tests = ConvertFrom-Json -InputObject $testsJson
        
        Write-ColoredOutput "Lese einheiten.json..." "Cyan"
        $einheitenJson = Get-Content -Path $einheitenJsonPath -Raw -Encoding UTF8
        $einheiten = ConvertFrom-Json -InputObject $einheitenJson
        
        # Backup erstellen
        Write-ColoredOutput "Erstelle Backup von tests.json unter $backupPath" "Yellow"
        Set-Content -Path $backupPath -Value $testsJson -Encoding UTF8
        
        # Mapping von Einheiten zu IDs erstellen
        $einheitenMapping = @{}
        foreach ($einheit in $einheiten) {
            if ($einheit.bezeichnung -ne $null) {
                $einheitenMapping[$einheit.bezeichnung] = $einheit.einheit_id
            }
        }
        
        # Ausgabe der gefundenen Einheiten
        Write-ColoredOutput "Gefundene Einheiten in einheiten.json:" "Green"
        $einheitenMapping.Keys | ForEach-Object { Write-Host "$_ => $($einheitenMapping[$_])" }
        
        # Liste der nicht gefundenen Einheiten
        $nichtGefundeneEinheiten = New-Object System.Collections.Generic.HashSet[string]
        
        # Tests aktualisieren
        Write-ColoredOutput "`nStarte Konvertierung von tests.json..." "Cyan"
        $totalTests = $tests.Count
        $modifiedTests = 0
        
        for ($i = 0; $i -lt $totalTests; $i++) {
            $test = $tests[$i]
            
            # Zeige Fortschritt
            if ($i % 10 -eq 0) {
                Show-Progress -Current $i -Total $totalTests -Activity "Konvertiere Tests" -Status "Test $i von $totalTests"
            }
            
            # Einheit in einheit_id umwandeln, wenn vorhanden
            if ($test.PSObject.Properties.Name -contains "einheit" -and $test.einheit -ne $null) {
                $einheitWert = $test.einheit
                
                if ($einheitenMapping.ContainsKey($einheitWert)) {
                    # Neue Eigenschaft einheit_id hinzufügen
                    $test | Add-Member -MemberType NoteProperty -Name "einheit_id" -Value $einheitenMapping[$einheitWert] -Force
                    
                    # Alte Eigenschaft einheit entfernen
                    $test.PSObject.Properties.Remove("einheit")
                    $modifiedTests++
                } else {
                    # Einheit nicht im Mapping gefunden
                    $nichtGefundeneEinheiten.Add($einheitWert) | Out-Null
                }
            } elseif ($test.PSObject.Properties.Name -contains "einheit" -and $test.einheit -eq $null) {
                # Für Tests mit explizitem null-Wert
                $test | Add-Member -MemberType NoteProperty -Name "einheit_id" -Value "NULL" -Force
                $test.PSObject.Properties.Remove("einheit")
                $modifiedTests++
            }
        }
        
        Write-Progress -Activity "Konvertiere Tests" -Completed
        
        # Warnung ausgeben, wenn nicht alle Einheiten gefunden wurden
        if ($nichtGefundeneEinheiten.Count -gt 0) {
            Write-ColoredOutput "`nWARNUNG: Folgende Einheiten wurden nicht gefunden:" "Yellow"
            $nichtGefundeneEinheiten | ForEach-Object { Write-Host "- $_" -ForegroundColor Yellow }
            Write-ColoredOutput "Bitte fügen Sie diese Einheiten zur einheiten.json hinzu und führen Sie das Skript erneut aus." "Yellow"
        }
        
        # Aktualisierte tests.json speichern
        Write-ColoredOutput "`nSpeichere aktualisierte tests.json..." "Cyan"
        $modifiedTestsJson = ConvertTo-Json -InputObject $tests -Depth 10
        Set-Content -Path $testsJsonPath -Value $modifiedTestsJson -Encoding UTF8
        
        Write-ColoredOutput "`nKonvertierung abgeschlossen! $modifiedTests von $totalTests Tests wurden aktualisiert." "Green"
        Write-ColoredOutput "Backup gespeichert unter: $backupPath" "White"
        
    } catch {
        Write-ColoredOutput "FEHLER bei der Konvertierung: $_" "Red"
        Write-ColoredOutput $_.ScriptStackTrace "Red"
    }
}

# Script ausführen
Convert-EinheitToId
