<#
    Enciende UNIVERSIDAD-app y abre el navegador.

    Levanta la API y la web como procesos independientes de Windows: siguen
    corriendo aunque cierres esta terminal. Es idempotente — si ya estaban
    arriba, no hace nada.

        cd C:\dev\apps\UNIVERSIDAD-app
        .\scripts\encender.ps1

    Opciones:
        -Reconstruir   compila antes de arrancar (tras cambiar codigo)
        -SinNavegador  no abre el navegador
#>
[CmdletBinding()]
param(
    [switch]$Reconstruir,
    [switch]$SinNavegador
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

$PUERTO_API = 4180
$PUERTO_WEB = 3180
$logs = Join-Path $raiz 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null

# Rotacion simple: un log que crece sin fin acaba siendo inservible.
foreach ($f in Get-ChildItem $logs -Filter '*.log' -ErrorAction SilentlyContinue) {
    if ($f.Length -gt 5MB) {
        Move-Item $f.FullName "$($f.FullName).1" -Force
        Write-Host "   rotado $($f.Name) ($([math]::Round($f.Length/1MB,1)) MB)" -ForegroundColor DarkGray
    }
}

function Escuchando($puerto) {
    [bool](Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue)
}

# En C:\devpps conviven varios proyectos y todos son Next: sin esto, otro
# proyecto puede quedarse con el puerto y la app parece rota sin motivo.
function DuenoDelPuerto($puerto) {
    $c = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $c) { return $null }
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($c.OwningProcess)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmd -match 'dev\apps\([A-Za-z0-9-]+)') { return $Matches[1] }
    return 'desconocido'
}

function VerificarPuerto($puerto, $nombre) {
    $dueno = DuenoDelPuerto $puerto
    if ($dueno -and $dueno -ne 'UNIVERSIDAD-app') {
        Write-Host ''
        Write-Host "   El puerto $puerto lo tiene $dueno, no esta app." -ForegroundColor Red
        Write-Host "   Cambia $nombre en .env, o apaga $dueno." -ForegroundColor Yellow
        exit 1
    }
    return $dueno -eq 'UNIVERSIDAD-app'
}

function Esperar($puerto, $nombre, $segundos = 45) {
    foreach ($i in 1..$segundos) {
        if (Escuchando $puerto) { Write-Host "   $nombre listo en :$puerto" -ForegroundColor Green; return $true }
        Start-Sleep -Seconds 1
    }
    Write-Host "   $nombre no levanto. Revisa $logs" -ForegroundColor Red
    return $false
}

if ($Reconstruir) {
    Write-Host 'Compilando...' -ForegroundColor Cyan
    pnpm --filter @universidad/shared build
    pnpm --filter @universidad/api build
    pnpm --filter @universidad/web build
}

# --- API ---------------------------------------------------------------
if (VerificarPuerto $PUERTO_API 'PORT') {
    Write-Host "   API ya estaba arriba en :$PUERTO_API" -ForegroundColor DarkGray
}
else {
    if (-not (Test-Path "$raiz\apps\api\dist\main.js")) {
        Write-Host 'Falta el build de la API, compilando...' -ForegroundColor Cyan
        pnpm --filter @universidad/api build
    }
    Start-Process -FilePath 'node' -ArgumentList 'dist\main.js' `
        -WorkingDirectory "$raiz\apps\api" -WindowStyle Hidden `
        -RedirectStandardOutput "$logs\api.log" -RedirectStandardError "$logs\api.err"
    if (-not (Esperar $PUERTO_API 'API')) { exit 1 }
}

# --- Web ---------------------------------------------------------------
if (VerificarPuerto $PUERTO_WEB 'el puerto de la web') {
    Write-Host "   Web ya estaba arriba en :$PUERTO_WEB" -ForegroundColor DarkGray
}
else {
    if (-not (Test-Path "$raiz\apps\web\.next\BUILD_ID")) {
        Write-Host 'Falta el build de la web, compilando...' -ForegroundColor Cyan
        pnpm --filter @universidad/web build
    }
    # pnpm aisla dependencias: next vive dentro de apps/web, no en la raiz.
    $next = "$raiz\apps\web\node_modules\next\dist\bin\next"
    Start-Process -FilePath 'node' -ArgumentList "`"$next`" start -p $PUERTO_WEB" `
        -WorkingDirectory "$raiz\apps\web" -WindowStyle Hidden `
        -RedirectStandardOutput "$logs\web.log" -RedirectStandardError "$logs\web.err"
    if (-not (Esperar $PUERTO_WEB 'Web')) { exit 1 }
}

# --- Diagnostico -------------------------------------------------------
try {
    $s = (Invoke-WebRequest "http://localhost:$PUERTO_API/api/salud" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
    Write-Host ''
    Write-Host ("   {0} - {1} materias, {2} sesiones, {3} documentos" -f `
        $s.estado, $s.conteos.materias, $s.conteos.sesiones, $s.conteos.documentos) -ForegroundColor Green
    if ($s.problemas.Count) { $s.problemas | ForEach-Object { Write-Host "   aviso: $_" -ForegroundColor Yellow } }
}
catch { Write-Host '   La API no contesta /api/salud' -ForegroundColor Yellow }

Write-Host ''
Write-Host "   http://localhost:$PUERTO_WEB" -ForegroundColor Cyan
if (-not $SinNavegador) { Start-Process "http://localhost:$PUERTO_WEB" }
