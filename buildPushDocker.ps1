#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build und Push eines Docker-Images für SpecimenOne
.DESCRIPTION
    Dieses Skript baut ein Docker-Image für SpecimenOne und pusht es in die Container-Registry
.PARAMETER Registry
    Der Registry-Benutzername
.PARAMETER Tag
    Der Tag für das Docker-Image (Standard: 'latest')
.EXAMPLE
    ./buildPushDocker.ps1 -Registry "meinbenutzername"
    ./buildPushDocker.ps1 -Registry "meinbenutzername" -Tag "v1.0"
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$Registry,
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

# Variablen festlegen
$imageName = "specimenone"
$fullImageName = "${Registry}/${imageName}:${Tag}"
$localImageName = "${imageName}:${Tag}"

# Build
Write-Host "Docker-Image wird gebaut mit korrigiertem Dockerfile..." -ForegroundColor Cyan
docker build -t $localImageName -f Dockerfile.fixed . --progress=plain

if($LASTEXITCODE -ne 0) {
    Write-Host "Build fehlgeschlagen!" -ForegroundColor Red
    Write-Host "Versuche mit --no-cache flag..." -ForegroundColor Yellow
    docker build -t $localImageName -f Dockerfile.fixed . --no-cache --progress=plain
    
    if($LASTEXITCODE -ne 0) {
        Write-Host "Build fehlgeschlagen! Überprüfen Sie die Logs auf Details." -ForegroundColor Red
        exit 1
    }
}

# Tag
Write-Host "Image wird getaggt als $fullImageName..." -ForegroundColor Cyan
docker tag $localImageName $fullImageName

if($LASTEXITCODE -ne 0) {
    Write-Host "Tagging fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# Push
Write-Host "Image wird zur Registry gepusht..." -ForegroundColor Cyan
docker push $fullImageName

if($LASTEXITCODE -ne 0) {
    Write-Host "Push fehlgeschlagen! Sind Sie eingeloggt in der Registry?" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Fertig! Image wurde erfolgreich zur Registry gepusht." -ForegroundColor Green
    Write-Host "$fullImageName" -ForegroundColor Green
}
