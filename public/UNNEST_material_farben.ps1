# Setze die Pfade
$materialJsonPath = "C:\Projekte\SpecimenOne\public\material.json"
$farbenJsonPath = "C:\Projekte\SpecimenOne\public\farben.json"

# Material.json entnestet
$materialData = Get-Content $materialJsonPath -Raw | ConvertFrom-Json
$materialien = $materialData.materialien
$materialien | ConvertTo-Json -Depth 5 | Out-File "material_flat.json" -Encoding UTF8

# Farben.json entnestet
$farbenData = Get-Content $farbenJsonPath -Raw | ConvertFrom-Json
$farben = $farbenData.farben
$farben | ConvertTo-Json -Depth 5 | Out-File "farben_flat.json" -Encoding UTF8

Write-Host "Material und Farben erfolgreich entnestet in material_flat.json und farben_flat.json"
