$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$scanRoot = Join-Path $projectRoot ('.local-release/strix-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$targetRoot = Join-Path $scanRoot 'source'
New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null

# Allowlisted source only: never give the scanner signing credentials or caches.
$sourceFiles = @('App.tsx', 'index.js', 'app.json', 'package.json', 'package-lock.json', 'tsconfig.json', 'babel.config.js', 'metro.config.js', 'jest.config.js', 'jest.setup.js', 'android/build.gradle', 'android/settings.gradle', 'android/gradle.properties', 'android/app/build.gradle', 'android/app/proguard-rules.pro')
foreach ($folder in @('src', '__tests__', 'android/app/src')) {
    $sourceFiles += Get-ChildItem (Join-Path $projectRoot $folder) -File -Recurse |
        Where-Object { $_.Extension -in @('.ts', '.tsx', '.js', '.json', '.kt', '.java', '.xml', '.svg', '.png', '.webp') } |
        ForEach-Object { $_.FullName.Substring($projectRoot.Length + 1) }
}
foreach ($relative in $sourceFiles) {
    $sourcePath = Join-Path $projectRoot $relative
    if (Test-Path -LiteralPath $sourcePath) {
        $destination = Join-Path $targetRoot $relative
        New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $sourcePath -Destination $destination
    }
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'strix-scope.md') -Destination (Join-Path $scanRoot 'scope.md')
Write-Output "Prepared source snapshot: $targetRoot"
Write-Output 'No scan has run. Configure Strix and its AI provider, then run from this scan directory:'
Write-Output 'strix -n --target ./source --instruction-file ./scope.md --scan-mode quick --scope-mode full --max-budget 5 --max-turns 60'
