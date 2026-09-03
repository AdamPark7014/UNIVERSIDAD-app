<#
    Respaldo de la base.

    Los .docx no se respaldan aqui: viven en OneDrive y ya estan replicados.
    Lo que si se perderia sin esto es lo que SOLO existe en la base:

      - el estado de cada tarea propia y sus notas de resultado
      - el estado y la calificacion de cada evaluacion
      - las referencias de libros sin PDF (ISBN, editorial, enlaces)
      - la bitacora de sincronizaciones

    Usa la API de respaldo de SQLite (VACUUM INTO), que produce una copia
    consistente aunque la aplicacion este escribiendo en ese momento.

        .\scripts\respaldar.ps1
        .\scripts\respaldar.ps1 -Conservar 30
#>
[CmdletBinding()]
param(
    # Cuantos respaldos diarios conservar.
    [int]$Conservar = 14,
    # Carpeta destino. Por omision, dentro del propio proyecto.
    [string]$Destino
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
if (-not $Destino) { $Destino = Join-Path $raiz 'respaldos' }
New-Item -ItemType Directory -Force $Destino | Out-Null

$base = Join-Path $raiz 'apps\api\prisma\universidad.db'
if (-not (Test-Path $base)) {
    Write-Host "No existe la base en $base" -ForegroundColor Red
    exit 1
}

$sello = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$salida = Join-Path $Destino "universidad_$sello.db"
# VACUUM INTO se niega a sobrescribir; dos corridas en el mismo segundo son
# raras, pero el script debe ser idempotente para el Programador de tareas.
if (Test-Path $salida) { Remove-Item $salida -Force }

# VACUUM INTO deja una copia integra y compactada, sin detener la aplicacion.
# Si el cliente de sqlite3 no esta disponible, se cae a una copia directa.
$hecho = $false
if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
    try {
        $rutaSql = $salida -replace '\\', '/'
        "VACUUM INTO '$rutaSql';" | sqlite3 $base
        $hecho = $true
    }
    catch { $hecho = $false }
}
if (-not $hecho) {
    Copy-Item $base $salida -Force
    foreach ($sufijo in '-wal', '-shm') {
        if (Test-Path "$base$sufijo") { Copy-Item "$base$sufijo" "$salida$sufijo" -Force }
    }
}

$mb = [math]::Round((Get-Item $salida).Length / 1MB, 2)
Write-Host "   respaldo: $(Split-Path $salida -Leaf)  ($mb MB)" -ForegroundColor Green

# --- rotacion ---------------------------------------------------------
$viejos = Get-ChildItem $Destino -Filter 'universidad_*.db' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $Conservar
foreach ($v in $viejos) {
    Remove-Item $v.FullName -Force
    foreach ($sufijo in '-wal', '-shm') {
        if (Test-Path "$($v.FullName)$sufijo") { Remove-Item "$($v.FullName)$sufijo" -Force }
    }
    Write-Host "   rotado: $($v.Name)" -ForegroundColor DarkGray
}

$total = (Get-ChildItem $Destino -Filter 'universidad_*.db').Count
Write-Host "   $total respaldos en $Destino" -ForegroundColor DarkGray
