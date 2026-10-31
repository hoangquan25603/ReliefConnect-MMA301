param([switch]$Remove)
$ErrorActionPreference='Stop'
$ruleName='ReliefConnect-iPhone-Preview-8083'
$resultFile=Join-Path $PSScriptRoot '..\qa\iphone-firewall-result.json'
try {
    if($Remove) {
        Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
        @{status='removed';rule=$ruleName} | ConvertTo-Json | Set-Content -LiteralPath $resultFile
        exit 0
    }
    $nodeProgram='C:\Program Files\nodejs\node.exe'
    if(!(Test-Path -LiteralPath $nodeProgram)){throw 'Node executable not found.'}
    $wifi=Get-NetIPAddress -InterfaceAlias 'Wi-Fi' -AddressFamily IPv4 |
        Where-Object {$_.IPAddress -notmatch '^(127\.|169\.254\.)'} | Select-Object -First 1
    if(!$wifi){throw 'No IPv4 Wi-Fi connection found.'}
    $old=Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    if($old){$old | Remove-NetFirewallRule}
    New-NetFirewallRule -Name $ruleName -DisplayName 'ReliefConnect iPhone preview (local Wi-Fi only)' `
        -Direction Inbound -Action Allow -Enabled True -Profile Any -Protocol TCP -LocalPort 8083 `
        -LocalAddress $wifi.IPAddress -RemoteAddress LocalSubnet -InterfaceAlias 'Wi-Fi' `
        -Program $nodeProgram | Out-Null
    @{status='allowed';rule=$ruleName;port=8083;localAddress=$wifi.IPAddress;remoteScope='LocalSubnet';program=$nodeProgram} |
        ConvertTo-Json | Set-Content -LiteralPath $resultFile
} catch {
    @{status='error';message=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath $resultFile
    exit 1
}
