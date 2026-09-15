# Ensure GRADLE_USER_HOME uses user profile to avoid Windows MAX_PATH (260 char) Ninja errors
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle"

$keystorePath = Join-Path $PSScriptRoot "android\app\moonlight-upload.jks"
if (-not (Test-Path $keystorePath)) {
    Write-Error "Keystore not found at $keystorePath"
    exit 1
}
$env:MOONLIGHT_UPLOAD_STORE_FILE = $keystorePath

$alias = Read-Host "Enter Key Alias (default 'my-key-alias')"
if (-not $alias) { $alias = "my-key-alias" }
$env:MOONLIGHT_UPLOAD_KEY_ALIAS = $alias

$storePass = Read-Host "Enter Keystore Password (typing hidden)" -AsSecureString
$keyPass = Read-Host "Enter Key Password (leave blank if same as keystore password)" -AsSecureString

try {
    $env:MOONLIGHT_UPLOAD_STORE_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePass))
    $plainKeyPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPass))
    if ([string]::IsNullOrEmpty($plainKeyPass)) {
        $env:MOONLIGHT_UPLOAD_KEY_PASSWORD = $env:MOONLIGHT_UPLOAD_STORE_PASSWORD
    } else {
        $env:MOONLIGHT_UPLOAD_KEY_PASSWORD = $plainKeyPass
    }

    Write-Host "`nCredentials loaded into memory securely." -ForegroundColor Green
    Write-Host "Building the release Android App Bundle (AAB) for Moonlight 1.6.1 (code 17)..." -ForegroundColor Cyan

    Push-Location (Join-Path $PSScriptRoot "android")
    try {
        .\gradlew.bat bundleRelease
    } finally {
        Pop-Location
    }

    if ($LASTEXITCODE -eq 0) {
        $sourceAab = Join-Path $PSScriptRoot "android\app\build\outputs\bundle\release\app-release.aab"
        $releasesDir = Join-Path $PSScriptRoot "releases"
        if (-not (Test-Path $releasesDir)) { New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null }
        $targetAab = Join-Path $releasesDir "Moonlight-1.6.1-release.aab"
        Copy-Item -LiteralPath $sourceAab -Destination $targetAab -Force

        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $targetAab).Hash
        $sizeMb = [math]::Round((Get-Item -LiteralPath $targetAab).Length / 1MB, 2)

        Write-Host "`n========================================================" -ForegroundColor Green
        Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "App Bundle: $targetAab ($sizeMb MB)" -ForegroundColor Yellow
        Write-Host "SHA-256:    $hash" -ForegroundColor Gray
        Write-Host "Ready for Google Play Console Closed Testing rollout!" -ForegroundColor Green
        Write-Host "========================================================" -ForegroundColor Green
    } else {
        Write-Host "`nBuild Failed. Check Gradle logs above." -ForegroundColor Red
    }
} finally {
    # Always clear credentials from memory
    $env:MOONLIGHT_UPLOAD_STORE_PASSWORD = $null
    $env:MOONLIGHT_UPLOAD_KEY_PASSWORD = $null
    $plainKeyPass = $null
    Write-Host "`nCredentials purged from memory." -ForegroundColor Gray
}

