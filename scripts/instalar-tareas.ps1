<#
    Registra la app en el Programador de tareas de Windows.

    Deja tres tareas, todas bajo la carpeta \UNIVERSIDAD-app:

      Encender    al iniciar sesion    levanta API y web
      Vigilar     cada 10 minutos      revive lo que se haya caido
      Avisar      diario 20:00         notifica que hay que poner al corriente
      Respaldar   diario 21:00         copia la base y rota a 14 dias

    No pide permisos de administrador: las tareas quedan a nombre del usuario
    actual y solo corren cuando la sesion esta iniciada, que es justo lo que
    hace falta para una app de escritorio.

        .\scripts\instalar-tareas.ps1
        .\scripts\instalar-tareas.ps1 -Quitar
#>
[CmdletBinding()]
param(
    [switch]$Quitar,
    [string]$HoraAviso = '20:00',
    [string]$HoraRespaldo = '21:00'
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$carpeta = '\UNIVERSIDAD-app'
$usuario = "$env:USERDOMAIN\$env:USERNAME"

$TAREAS = @(
    @{ nombre = 'Encender'; script = 'encender.ps1'; args = '-SinNavegador' }
    @{ nombre = 'Vigilar'; script = 'vigilar.ps1'; args = '' }
    @{ nombre = 'Avisar'; script = 'avisar.ps1'; args = '' }
    @{ nombre = 'Respaldar'; script = 'respaldar.ps1'; args = '' }
)

# --- quitar -----------------------------------------------------------
if ($Quitar) {
    foreach ($t in $TAREAS) {
        $existe = Get-ScheduledTask -TaskPath "$carpeta\" -TaskName $t.nombre -ErrorAction SilentlyContinue
        if ($existe) {
            Unregister-ScheduledTask -TaskPath "$carpeta\" -TaskName $t.nombre -Confirm:$false
            Write-Host "   quitada: $($t.nombre)" -ForegroundColor Yellow
        }
    }
    Write-Host 'Tareas eliminadas. La app sigue funcionando a mano.' -ForegroundColor Green
    exit 0
}

function Accion($script, $extra) {
    $ruta = Join-Path $raiz "scripts\$script"
    $argumentos = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ruta`""
    if ($extra) { $argumentos += " $extra" }
    New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argumentos -WorkingDirectory $raiz
}

# Sin limite de duracion: la app corre todo el dia, no es un proceso por lotes.
$opciones = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited

Write-Host "Registrando tareas para $usuario" -ForegroundColor Cyan

# 1) Encender al iniciar sesion, con 30 s de gracia para que Windows respire.
$d = New-ScheduledTask -Action (Accion 'encender.ps1' '-SinNavegador') `
    -Trigger (New-ScheduledTaskTrigger -AtLogOn -User $usuario) `
    -Settings $opciones -Principal $principal `
    -Description 'Levanta la API y la web de UNIVERSIDAD-app al iniciar sesion.'
$d.Triggers[0].Delay = 'PT30S'
Register-ScheduledTask -TaskPath $carpeta -TaskName 'Encender' -InputObject $d -Force | Out-Null
Write-Host '   Encender    -> al iniciar sesion (+30 s)' -ForegroundColor Green

# 2) Vigilar cada 10 minutos, indefinidamente.
$disparo = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) `
    -RepetitionInterval (New-TimeSpan -Minutes 10) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskPath $carpeta -TaskName 'Vigilar' -Force `
    -InputObject (New-ScheduledTask -Action (Accion 'vigilar.ps1' '') -Trigger $disparo `
        -Settings $opciones -Principal $principal `
        -Description 'Revive la API o la web si se cayeron.') | Out-Null
Write-Host '   Vigilar     -> cada 10 minutos' -ForegroundColor Green

# 3) Avisar a diario de lo que falta por poner al corriente.
Register-ScheduledTask -TaskPath $carpeta -TaskName 'Avisar' -Force `
    -InputObject (New-ScheduledTask -Action (Accion 'avisar.ps1' '') `
        -Trigger (New-ScheduledTaskTrigger -Daily -At $HoraAviso) `
        -Settings $opciones -Principal $principal `
        -Description 'Notifica notas pendientes y entregas proximas.') | Out-Null
Write-Host "   Avisar      -> diario a las $HoraAviso" -ForegroundColor Green

# 4) Respaldar a diario.
Register-ScheduledTask -TaskPath $carpeta -TaskName 'Respaldar' -Force `
    -InputObject (New-ScheduledTask -Action (Accion 'respaldar.ps1' '') `
        -Trigger (New-ScheduledTaskTrigger -Daily -At $HoraRespaldo) `
        -Settings $opciones -Principal $principal `
        -Description 'Respalda la base de UNIVERSIDAD-app y rota a 14 dias.') | Out-Null
Write-Host "   Respaldar   -> diario a las $HoraRespaldo" -ForegroundColor Green

Write-Host ''
Write-Host 'Listo. Ya no hay que encender nada a mano.' -ForegroundColor Green
Write-Host '   Ver:     Get-ScheduledTask -TaskPath "\UNIVERSIDAD-app\"'
Write-Host '   Quitar:  .\scripts\instalar-tareas.ps1 -Quitar'
