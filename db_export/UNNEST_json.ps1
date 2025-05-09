# Setze die Pfade
$materialJsonPath = "empfaenger.json"

# Material.json entnestet
$materialData = Get-Content $materialJsonPath -Raw | ConvertFrom-Json
$materialien = $materialData.materialien
$materialien | ConvertTo-Json -Depth 5 | Out-File "empfänger_flat.json" -Encoding UTF8


Write-Host "Empfänger erfolgreich entnestet"
