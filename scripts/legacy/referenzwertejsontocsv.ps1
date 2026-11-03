# Pfad zur Originaldatei
$inputPath = "C:\Projekte\specimenone\public\referenzwerte.json"
$outputPath = "referenzwerte_flat.json"

# JSON laden
$json = Get-Content $inputPath -Raw | ConvertFrom-Json

# Leere Liste für flache Einträge
$flach = @()

# Durchlaufe alle Keys (= Test-IDs)
foreach ($test_id in $json.PSObject.Properties.Name) {
    foreach ($eintrag in $json.$test_id) {
        # Neuen Eintrag manuell zusammensetzen, um test_id hinzuzufügen
        $obj = [PSCustomObject]@{
			test_id               = $test_id
            Alter_bis             = $eintrag.Alter_bis
            Anzeige_Label         = $eintrag.Anzeige_Label
            Besondere_Bedingung   = $eintrag.Besondere_Bedingung
            Schwangerschaft       = $eintrag.Schwangerschaft
            Alter_von             = $eintrag.Alter_von
            Geschlecht            = $eintrag.Geschlecht
            Wert_untere_Grenze    = $eintrag.Wert_untere_Grenze
            Wert_obere_Grenze     = $eintrag.Wert_obere_Grenze
        }
        $flach += $obj
    }
}

# JSON exportieren
$flach | ConvertTo-Json -Depth 5 | Out-File $outputPath -Encoding utf8
