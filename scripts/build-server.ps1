$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$output = Join-Path $projectRoot 'artifacts\server-win-x64'
Push-Location (Join-Path $projectRoot 'FRONTEND')
try {
    if (!(Test-Path node_modules)) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } }
    npm run typecheck; if ($LASTEXITCODE) { throw 'Vue typecheck failed' }
    npm run build; if ($LASTEXITCODE) { throw 'Vue build failed' }
} finally { Pop-Location }
$apiProject=Join-Path $projectRoot 'DisasterReliefSystem\backend\DisasterReliefSystem.API\DisasterReliefSystem.API.csproj'
dotnet publish $apiProject -c Release -r win-x64 --self-contained true -o $output
if ($LASTEXITCODE) { throw 'Backend publish failed' }
$webRoot=Join-Path $output 'wwwroot'
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'FRONTEND\dist\*') -Destination $webRoot -Recurse -Force
foreach($name in @('START-DEMO.ps1','START-DEMO.cmd','README.md')) { Copy-Item -LiteralPath (Join-Path $projectRoot $name) -Destination $output -Force }
Write-Host "Built server: $output"
Write-Host 'Before sharing a ZIP, exclude .local (database, tokens, mail and keys).'
