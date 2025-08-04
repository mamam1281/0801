# reset-frontend.ps1
# 이 스크립트는 프론트엔드 환경을 완전히 초기화합니다

Write-Host "🧹 프론트엔드 환경을 초기화합니다..." -ForegroundColor Cyan

# node_modules 및 캐시 폴더 제거
if (Test-Path "cc-webapp/frontend/node_modules") {
    Write-Host "🗑️ node_modules 폴더를 제거합니다..." -ForegroundColor Yellow
    Remove-Item -Path "cc-webapp/frontend/node_modules" -Recurse -Force
}

if (Test-Path "cc-webapp/frontend/.next") {
    Write-Host "🗑️ .next 빌드 폴더를 제거합니다..." -ForegroundColor Yellow
    Remove-Item -Path "cc-webapp/frontend/.next" -Recurse -Force
}

# 금지된 설정 파일 제거
$prohibitedFiles = @(
    "cc-webapp/frontend/tailwind.config.js",
    "cc-webapp/frontend/tailwind.config.mjs",
    "cc-webapp/frontend/tailwind.config.ts"
)

foreach ($file in $prohibitedFiles) {
    if (Test-Path $file) {
        Write-Host "⚠️ 금지된 파일 제거: $file" -ForegroundColor Red
        Remove-Item -Path $file -Force
    }
}

# PostCSS 설정 업데이트
Write-Host "✏️ PostCSS 설정을 업데이트합니다..." -ForegroundColor Cyan

$postcssContent = @"
// postcss.config.mjs - Tailwind CSS v4 호환 설정
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
}
"@

Set-Content -Path "cc-webapp/frontend/postcss.config.mjs" -Value $postcssContent -Encoding UTF8

Write-Host "✅ 환경 초기화가 완료되었습니다." -ForegroundColor Green
Write-Host "🔄 다음 단계로 의존성을 재설치하세요: cd cc-webapp/frontend; npm install" -ForegroundColor Cyan
