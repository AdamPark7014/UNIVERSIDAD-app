<#
    Arranque de UNIVERSIDAD-app.

    Crea la base SQLite, la siembra e importa los .docx. Es idempotente:
    se puede volver a correr sin romper nada.

        cd C:\dev\apps\UNIVERSIDAD-app
        .\scripts\arrancar.ps1
#>
[CmdletBinding()]
param([switch]$SinImportar)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Paso($t) { Write-Host ""; Write-Host "-- $t" -ForegroundColor Cyan }

if (-not (Test-Path .env)) {
    Paso 'Creando .env'
    Copy-Item .env.example .env
    Write-Host '   Revisa DOCS_ROOT antes de seguir.' -ForegroundColor Yellow
}
if (-not (Test-Path apps\api\.env)) { Copy-Item apps\api\.env.example apps\api\.env }

Paso 'Instalando dependencias'
pnpm install

Paso 'Preparando la base (SQLite, sin demonio ni contrasena)'
pnpm prisma:generate
pnpm --filter @universidad/api exec prisma migrate deploy

Paso 'Sembrando el semestre'
pnpm db:seed

if (-not $SinImportar) {
    Paso 'Importando los .docx del disco'
    pnpm sync
}

Write-Host ''
Write-Host 'Listo.' -ForegroundColor Green
Write-Host '  pnpm dev:api    -> http://localhost:4180/api'
Write-Host '  pnpm dev:web    -> http://localhost:3180'
