<#
    Aviso de lo que hay que poner al corriente.

    Consulta /api/alertas y lanza una notificacion de Windows si hay algo
    pendiente. Si no hay nada, no molesta: un aviso que sale siempre deja de
    leerse a los tres dias.

    Pensado para el Programador de tareas, una o dos veces al dia.

        .\scripts\avisar.ps1
        .\scripts\avisar.ps1 -Forzar     (avisa aunque este todo al dia)
        .\scripts\avisar.ps1 -SoloTexto  (imprime, no notifica)
#>
[CmdletBinding()]
param(
    [switch]$Forzar,
    [switch]$SoloTexto
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$PUERTO_API = 4180

# --- consultar --------------------------------------------------------
try {
    $a = (Invoke-WebRequest "http://localhost:$PUERTO_API/api/alertas" `
            -UseBasicParsing -TimeoutSec 12).Content | ConvertFrom-Json
}
catch {
    # La API apagada no es motivo de notificacion: de eso se encarga vigilar.ps1
    Write-Host 'La API no responde; no hay nada que avisar.' -ForegroundColor DarkGray
    exit 0
}

$n = $a.notas
$lineas = @()

if ($n.pendientes -gt 0) {
    $detalle = @()
    if ($n.vacias -gt 0) { $detalle += "$($n.vacias) sin nada" }
    if ($n.cortas -gt 0) { $detalle += "$($n.cortas) muy cortas" }
    $lineas += "Notas: $($n.pendientes) clases pendientes ($($detalle -join ', '))"

    # Las tres materias mas atrasadas, que es lo accionable
    $peores = $n.porMateria | Select-Object -First 3 |
        ForEach-Object { "$($_.clave) x$($_.total)" }
    if ($peores) { $lineas += "  " + ($peores -join '  ') }
}

$entregas = $a.alertas | Where-Object { $_.tipo -like 'entrega-*' }
foreach ($e in $entregas | Select-Object -First 3) {
    $lineas += "$($e.materia.clave): $($e.titulo) — $($e.detalle)"
}

if ($lineas.Count -eq 0) {
    $titulo = 'Universidad — todo al dia'
    $cuerpo = "Las $($n.cursadas) clases dadas tienen apuntes de $($n.umbral)+ palabras."
    if (-not $Forzar) {
        Write-Host $cuerpo -ForegroundColor Green
        exit 0
    }
}
else {
    $criticas = if ($a.criticas -gt 0) { " ($($a.criticas) urgentes)" } else { '' }
    $titulo = "Universidad — ponerse al corriente$criticas"
    $cuerpo = ($lineas | Select-Object -First 5) -join "`n"
}

Write-Host $titulo -ForegroundColor Cyan
Write-Host $cuerpo
if ($SoloTexto) { exit 0 }

# --- notificar --------------------------------------------------------
# Se intenta el toast nativo de Windows; si no esta disponible (sesiones sin
# escritorio, versiones viejas), se cae al globo del area de notificacion.
$enlace = "http://localhost:3180/notas-pendientes"
$notificado = $false

try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    $plantilla = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
        [Windows.UI.Notifications.ToastTemplateType]::ToastText02)

    $textos = $plantilla.GetElementsByTagName('text')
    $textos.Item(0).AppendChild($plantilla.CreateTextNode($titulo)) > $null
    $textos.Item(1).AppendChild($plantilla.CreateTextNode($cuerpo)) > $null

    # Al hacer clic abre la pantalla de puesta al dia
    $plantilla.DocumentElement.SetAttribute('launch', $enlace)

    $toast = [Windows.UI.Notifications.ToastNotification]::new($plantilla)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier(
        '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
    ).Show($toast)
    $notificado = $true
}
catch {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $icono = New-Object System.Windows.Forms.NotifyIcon
        $icono.Icon = [System.Drawing.SystemIcons]::Information
        $icono.BalloonTipTitle = $titulo
        $icono.BalloonTipText = $cuerpo
        $icono.Visible = $true
        $icono.ShowBalloonTip(15000)
        Start-Sleep -Seconds 16
        $icono.Dispose()
        $notificado = $true
    }
    catch { $notificado = $false }
}

# Queda constancia aunque la notificacion no se haya podido mostrar.
$bitacora = Join-Path $raiz 'logs\avisos.log'
New-Item -ItemType Directory -Force (Split-Path $bitacora) | Out-Null
"$(Get-Date -Format 'yyyy-MM-dd HH:mm')  $titulo | $($cuerpo -replace "`n", ' / ')" |
    Add-Content $bitacora -Encoding utf8

if (-not $notificado) {
    Write-Host '   (no se pudo mostrar la notificacion; quedo en logs\avisos.log)' -ForegroundColor Yellow
}
