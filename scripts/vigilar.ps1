<#
    Vigilante de procesos.

    Comprueba que la API y la web sigan de pie y las revive si se cayeron.
    Pensado para correr cada pocos minutos desde el Programador de tareas.
    No imprime nada si todo esta bien, para no ensuciar la bitacora.

        .\scripts\vigilar.ps1
#>
[CmdletBinding()]
param([switch]$Verboso)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $raiz 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null
$bitacora = Join-Path $logs 'vigilante.log'

function Anotar($texto) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $texto" | Add-Content $bitacora -Encoding utf8
    if ($Verboso) { Write-Host "   $texto" }
}

function Responde($url) {
    try { (Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 8).StatusCode -eq 200 }
    catch { $false }
}

$apiViva = Responde 'http://localhost:4180/api/salud'
$webViva = Responde 'http://localhost:3180/'

if ($apiViva -and $webViva) {
    if ($Verboso) { Write-Host '   todo en pie' -ForegroundColor Green }
    exit 0
}

# Algo se cayo: se levanta lo que falte. encender.ps1 es idempotente, asi que
# no toca lo que ya este arriba.
if (-not $apiViva) { Anotar 'API caida, reviviendo' }
if (-not $webViva) { Anotar 'Web caida, reviviendo' }

& (Join-Path $PSScriptRoot 'encender.ps1') -SinNavegador *> $null

Start-Sleep -Seconds 8
$apiViva = Responde 'http://localhost:4180/api/salud'
$webViva = Responde 'http://localhost:3180/'

if ($apiViva -and $webViva) { Anotar 'revividas correctamente' }
else { Anotar "NO se pudo revivir (api=$apiViva web=$webViva); revisa $logs" }
