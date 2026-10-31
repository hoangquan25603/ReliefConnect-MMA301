param([ValidateRange(1024,65535)][int]$Port = 5092)
$ErrorActionPreference = 'Stop'
$packageRoot = Join-Path $PSScriptRoot 'artifacts\server-win-x64'
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'DisasterReliefSystem.API.exe')) { $packageRoot = $PSScriptRoot }
$serverExe = Join-Path $packageRoot 'DisasterReliefSystem.API.exe'
if (!(Test-Path -LiteralPath $serverExe)) { throw 'Khong tim thay server. Giai nen bo server-win-x64 hoac build theo README.md.' }
try {
    $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 2
    if ($health.application -eq 'ReliefConnect') {
        Write-Host "ReliefConnect dang chay o cong $Port. Web: http://localhost:$Port"
        return
    }
} catch { }
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:SeedDemo = 'true'
Write-Host "ReliefConnect MMA301 - demo LAN. Web: http://localhost:$Port"
Write-Host "Dien thoai cung Wi-Fi: nhap http://IP-LAPTOP:$Port trong app. Ctrl+C de dung."
try {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
        ForEach-Object { Write-Host "Dia chi mang: http://$($_.IPAddress):$Port" }
} catch { Write-Host 'Dung ipconfig de xem IPv4 cua Wi-Fi.' }
Push-Location $packageRoot
try { & $serverExe --urls "http://0.0.0.0:$Port" --contentRoot $packageRoot }
finally { Pop-Location }
