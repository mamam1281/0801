#!/usr/bin/env pwsh

Write-Host "🚀 Tailwind CSS V4 마이그레이션 스크립트 시작" -ForegroundColor Cyan

# 1. 불필요한 설정 파일 백업 및 제거
Write-Host "`n📝 1. 불필요한 설정 파일 제거" -ForegroundColor Yellow

# next.config.js 백업
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js") {
    Write-Host "  ✅ next.config.js 백업" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\next.config.js" -Force
    Write-Host "  ✅ next.config.js 제거 완료" -ForegroundColor Green
}

# tailwind.config.js 확인 및 제거
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js") {
    Write-Host "  ✅ tailwind.config.js 백업" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tailwind.config.js" -Force
    Write-Host "  ✅ tailwind.config.js 제거 완료" -ForegroundColor Green
}

# postcss.config.js 확인 및 제거
if (Test-Path -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js") {
    Write-Host "  ✅ postcss.config.js 백업" -ForegroundColor Green
    Copy-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js" -Destination "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js.backup" -Force
    Remove-Item -Path "c:\Users\bdbd\0000\cc-webapp\frontend\postcss.config.js" -Force
    Write-Host "  ✅ postcss.config.js 제거 완료" -ForegroundColor Green
}

# 2. tsconfig.json 수정 - paths 제거
Write-Host "`n📝 2. tsconfig.json 수정 - 경로 별칭 제거" -ForegroundColor Yellow

$tsconfig = Get-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tsconfig.json" -Raw
$tsconfig = $tsconfig -replace '"paths":\s*\{\s*"@/\*"\s*:\s*\["\.\*"\]\s*\},?', ''
$tsconfig = $tsconfig -replace ',\s*}', '}'
$tsconfig | Set-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\tsconfig.json" -Force
Write-Host "  ✅ tsconfig.json 수정 완료" -ForegroundColor Green

# 3. globals.css 확인 (이미 V4 형식임)
Write-Host "`n📝 3. globals.css V4 호환성 확인" -ForegroundColor Yellow

$hasCustomVariant = Select-String -Path "c:\Users\bdbd\0000\cc-webapp\frontend\styles\globals.css" -Pattern "@custom-variant" -Quiet
$hasThemeInline = Select-String -Path "c:\Users\bdbd\0000\cc-webapp\frontend\styles\globals.css" -Pattern "@theme inline" -Quiet

if ($hasCustomVariant -and $hasThemeInline) {
    Write-Host "  ✅ globals.css 이미 V4 호환됨" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ globals.css V4 지시문 확인 필요:" -ForegroundColor Yellow
    Write-Host "    - @custom-variant: $hasCustomVariant" -ForegroundColor Yellow
    Write-Host "    - @theme inline: $hasThemeInline" -ForegroundColor Yellow
}

# 4. 패키지 스크립트 확인
Write-Host "`n📝 4. package.json 스크립트 확인" -ForegroundColor Yellow

# 기존 turbopack 옵션 제거 (V4는 turbopack 필요 없음)
$packageJson = Get-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\package.json" -Raw
if ($packageJson -match '"dev": "next dev --turbopack"') {
    $packageJson = $packageJson -replace '"dev": "next dev --turbopack"', '"dev": "next dev"'
    $packageJson | Set-Content -Path "c:\Users\bdbd\0000\cc-webapp\frontend\package.json" -Force
    Write-Host "  ✅ turbopack 옵션 제거" -ForegroundColor Green
}

# 5. cn() 유틸리티 함수 확인
Write-Host "`n📝 5. cn() 유틸리티 함수 확인" -ForegroundColor Yellow

$utilsPath = "c:\Users\bdbd\0000\cc-webapp\frontend\components\ui\utils.ts"
if (Test-Path $utilsPath) {
    $hasCnFunction = Select-String -Path $utilsPath -Pattern "export function cn" -Quiet
    if ($hasCnFunction) {
        Write-Host "  ✅ cn() 함수 이미 존재함" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ cn() 함수가 없습니다. 추가해야 합니다." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ utils.ts 파일이 없습니다. 생성해야 합니다." -ForegroundColor Yellow
}

# 6. 폴더 구조 확인
Write-Host "`n📝 6. 폴더 구조 확인" -ForegroundColor Yellow

$requiredFolders = @(
    "c:\Users\bdbd\0000\cc-webapp\frontend\styles",
    "c:\Users\bdbd\0000\cc-webapp\frontend\components\ui"
)

foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "  ✅ $folder 존재함" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $folder 없음. 생성 필요" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 마이그레이션 완료!" -ForegroundColor Cyan
Write-Host "`n다음 단계:" -ForegroundColor White
Write-Host "1. 'npm install' 실행 - 필요한 의존성 설치" -ForegroundColor White
Write-Host "2. 'npm run dev' 실행 - 개발 서버 시작" -ForegroundColor White
Write-Host "3. 'npm run build' 실행 - 프로덕션 빌드 검증" -ForegroundColor White
Write-Host "`n❗ 주의 사항:" -ForegroundColor Red
Write-Host "- 설정 파일(tailwind.config.js, postcss.config.js) 생성하지 말 것" -ForegroundColor Red
Write-Host "- 절대 경로(@/) 대신 상대 경로(../components) 사용할 것" -ForegroundColor Red
