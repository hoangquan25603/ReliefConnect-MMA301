param([string]$JavaHome = $env:JAVA_HOME, [string]$AndroidSdk = $env:ANDROID_HOME)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (!$JavaHome -and (Test-Path 'C:\Program Files\Java\jdk-17')) { $JavaHome = 'C:\Program Files\Java\jdk-17' }
if (!$AndroidSdk) { $AndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!(Test-Path (Join-Path $JavaHome 'bin\java.exe'))) { throw 'Can JDK 17. Truyen -JavaHome hoac dat JAVA_HOME.' }
if (!(Test-Path $AndroidSdk)) { throw 'Can Android SDK. Truyen -AndroidSdk hoac dat ANDROID_HOME.' }
$env:JAVA_HOME=$JavaHome; $env:ANDROID_HOME=$AndroidSdk; $env:CI='1'
Push-Location (Join-Path $projectRoot 'MOBILE')
try {
    if (!(Test-Path node_modules)) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } }
    npm run typecheck; if ($LASTEXITCODE) { throw 'TypeScript failed' }
    Push-Location android
    try { .\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=arm64-v8a' --no-daemon --max-workers=2; if ($LASTEXITCODE) { throw 'Gradle failed' } }
    finally { Pop-Location }
    $output = Join-Path $projectRoot 'artifacts'
    New-Item -ItemType Directory -Force $output | Out-Null
    Copy-Item -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk' -Destination (Join-Path $output 'ReliefConnect-MMA301-arm64.apk')
    Get-FileHash (Join-Path $output 'ReliefConnect-MMA301-arm64.apk') -Algorithm SHA256
} finally { Pop-Location }
