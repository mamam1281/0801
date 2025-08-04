#!/usr/bin/env pwsh

Write-Host "🚀 Tailwind CSS V4 Migration Script Starting" -ForegroundColor Cyan

# 1. Backup and remove unnecessary config files
Write-Host "`n📝 1. Removing unnecessary config files" -ForegroundColor Yellow

# Backup next.config.js
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js") {
    Write-Host "  ✅ Backing up next.config.js" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js" -Force
    Write-Host "  ✅ next.config.js removed successfully" -ForegroundColor Green
}

# Check and remove tailwind.config.js
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js") {
    Write-Host "  ✅ Backing up tailwind.config.js" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js" -Force
    Write-Host "  ✅ tailwind.config.js removed successfully" -ForegroundColor Green
}

# Check and remove postcss.config.js
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js") {
    Write-Host "  ✅ Backing up postcss.config.js" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js" -Force
    Write-Host "  ✅ postcss.config.js removed successfully" -ForegroundColor Green
}

# 2. Modify tsconfig.json - remove paths
Write-Host "`n📝 2. Modifying tsconfig.json - removing path aliases" -ForegroundColor Yellow

$tsconfig = Get-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tsconfig.json" -Raw
$tsconfig = $tsconfig -replace '"paths":\s*\{\s*"@/\*"\s*:\s*\["\.\*"\]\s*\},?', ''
$tsconfig = $tsconfig -replace ',\s*}', '}'
$tsconfig | Set-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tsconfig.json" -Force
Write-Host "  ✅ tsconfig.json modification complete" -ForegroundColor Green

# 3. Check globals.css (already in V4 format)
Write-Host "`n📝 3. Verifying globals.css V4 compatibility" -ForegroundColor Yellow

$hasCustomVariant = Select-String -Path "c:\Users\bdbd\0000\cc-webapp\frontend\styles\globals.css" -Pattern "@custom-variant" -Quiet
$hasThemeInline = Select-String -Path "c:\Users\bdbd\0000\cc-webapp\frontend\styles\globals.css" -Pattern "@theme inline" -Quiet

if ($hasCustomVariant -and $hasThemeInline) {
    Write-Host "  ✅ globals.css is already V4 compatible" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ globals.css requires V4 directives check:" -ForegroundColor Yellow
    Write-Host "    - @custom-variant: $hasCustomVariant" -ForegroundColor Yellow
    Write-Host "    - @theme inline: $hasThemeInline" -ForegroundColor Yellow
}

# 4. Check package scripts
Write-Host "`n📝 4. Checking package.json scripts" -ForegroundColor Yellow

# Remove existing turbopack option (V4 doesn't need turbopack)
$packageJson = Get-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\package.json" -Raw
if ($packageJson -match '"dev": "next dev --turbopack"') {
    $packageJson = $packageJson -replace '"dev": "next dev --turbopack"', '"dev": "next dev"'
    $packageJson | Set-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\package.json" -Force
    Write-Host "  ✅ Removed turbopack option" -ForegroundColor Green
}

# 5. Verify cn() utility function
Write-Host "`n📝 5. Verifying cn() utility function" -ForegroundColor Yellow

$utilsPath = "c:\Users\bdbd\0000\cc-webapp\frontend\components\ui\utils.ts"
if (Test-Path $utilsPath) {
    $hasCnFunction = Select-String -Path $utilsPath -Pattern "export function cn" -Quiet
    if ($hasCnFunction) {
        Write-Host "  ✅ cn() function already exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ cn() function is missing and needs to be added" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ utils.ts file doesn't exist and needs to be created" -ForegroundColor Yellow
}

# 6. Check folder structure
Write-Host "`n📝 6. Checking folder structure" -ForegroundColor Yellow

$requiredFolders = @(
    "c:\Users\bdbd\0000\cc-webapp\frontend\styles",
    "c:\Users\bdbd\0000\cc-webapp\frontend\components\ui"
)

foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "  ✅ $folder exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $folder is missing and needs to be created" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Migration complete!" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Run 'npm install' - Install required dependencies" -ForegroundColor White
Write-Host "2. Run 'npm run dev' - Start development server" -ForegroundColor White
Write-Host "3. Run 'npm run build' - Verify production build" -ForegroundColor White
Write-Host "`n❗ Important notes:" -ForegroundColor Red
Write-Host "- Do NOT create config files (tailwind.config.js, postcss.config.js)" -ForegroundColor Red
Write-Host "- Use relative paths (../components) instead of absolute paths (@/)" -ForegroundColor Red
