<#
    Apaga la API y la web.

        cd C:\dev\apps\UNIVERSIDAD-app
        .\scripts\apagar.ps1
#>
foreach ($p in 4180, 3180) {
    $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($c) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "   apagado :$p (pid $($c.OwningProcess))" -ForegroundColor Green
    }
    else { Write-Host "   :$p ya estaba apagado" -ForegroundColor DarkGray }
}
