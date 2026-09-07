param([switch]$ReuseNativeBinaries)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$signingDir = Join-Path $projectRoot '.local-release'
New-Item -ItemType Directory -Force -Path $signingDir | Out-Null
$credentialPath = Join-Path $signingDir 'signing.json'
$keystorePath = Join-Path $signingDir 'moonlight-preview.jks'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:GRADLE_USER_HOME = Join-Path $projectRoot '.gradle-user'
$env:ANDROID_USER_HOME = Join-Path $signingDir 'android-user'
New-Item -ItemType Directory -Force -Path $env:ANDROID_USER_HOME | Out-Null
if (!(Test-Path -LiteralPath $credentialPath)) {
    $bytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $random.GetBytes($bytes)
    $random.Dispose()
    $password = [Convert]::ToBase64String($bytes)
    @{ password = $password } | ConvertTo-Json | Set-Content -LiteralPath $credentialPath
}
$credentials = Get-Content -LiteralPath $credentialPath -Raw | ConvertFrom-Json
$env:MOONLIGHT_UPLOAD_STORE_FILE = $keystorePath
$env:MOONLIGHT_UPLOAD_STORE_PASSWORD = $credentials.password
$env:MOONLIGHT_UPLOAD_KEY_PASSWORD = $credentials.password
$env:MOONLIGHT_UPLOAD_KEY_ALIAS = 'moonlight-preview'
try {
    if (!(Test-Path -LiteralPath $keystorePath)) {
        & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $keystorePath -storepass:env MOONLIGHT_UPLOAD_STORE_PASSWORD -keypass:env MOONLIGHT_UPLOAD_KEY_PASSWORD -alias moonlight-preview -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Moonlight Preview, O=Moonlight, C=IN'
        if ($LASTEXITCODE -ne 0) { throw 'Signing key creation failed.' }
    }
    Push-Location (Join-Path $projectRoot 'android')
    try {
        $buildArguments = @(':app:assembleRelease', '-PmoonlightPreview=true', '-PreactNativeArchitectures=arm64-v8a', '--console=plain', '--max-workers=2', '--no-daemon')
        if ($ReuseNativeBinaries) {
            if (!(Test-Path (Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'))) { throw 'Build a full release before reusing native binaries.' }
            # Reuse unchanged C/C++ outputs. Kotlin/Java/resources and JS still compile normally.
            foreach ($module in @('app', 'llama.rn', 'react-native-mmkv', 'react-native-nitro-modules', 'react-native-screens')) {
                $buildArguments += @('-x', ":${module}:buildCMakeRelWithDebInfo[arm64-v8a]")
            }
        }
        & .\gradlew.bat @buildArguments
        if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    } finally { Pop-Location }
    $outputDir = Join-Path $projectRoot 'releases'
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    $apkPath = Join-Path $outputDir 'Moonlight-1.3.3-Preview-arm64.apk'
    Copy-Item -LiteralPath (Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk') -Destination $apkPath
    & "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat" verify --verbose $apkPath
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    Get-FileHash -LiteralPath $apkPath -Algorithm SHA256
} finally {
    Remove-Item Env:MOONLIGHT_UPLOAD_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:MOONLIGHT_UPLOAD_KEY_PASSWORD -ErrorAction SilentlyContinue
}
