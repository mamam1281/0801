# setup-frontend-v4.ps1
# Tailwind CSS v4와 Next.js 15를 위한 로컬 프론트엔드 개발 환경 설정

Write-Host "🚀 Tailwind CSS v4 로컬 개발 환경 설정을 시작합니다..." -ForegroundColor Cyan

# 1. 필수 폴더 생성
if (-not (Test-Path "cc-webapp/frontend/.vscode")) {
    New-Item -Path "cc-webapp/frontend/.vscode" -ItemType Directory -Force
    Write-Host "📁 VS Code 설정 디렉토리 생성됨" -ForegroundColor Green
}

# 2. VS Code 설정 생성
$settingsContent = @"
{
  "tailwindCSS.experimental.configFile": null,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\\\(([^)]*)\\\\)", "(?:'|\\\"|)([^']*)(?:'|\\\"|)"],
    ["cva\\\\(([^)]*)\\\\)", "[\\\"']([^\\\"']*).*?[\\\"']"]
  ],
  "css.validate": false,
  "postcss.validate": false,
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
"@

Set-Content -Path "cc-webapp/frontend/.vscode/settings.json" -Value $settingsContent -Encoding UTF8
Write-Host "⚙️ VS Code 설정이 Tailwind CSS v4에 맞게 생성되었습니다." -ForegroundColor Green

# 3. Tailwind CSS v4용 VS Code 지원 파일
$tailwindJsonContent = @"
{
  "version": 1.1,
  "atDirectives": [
    {
      "name": "@theme",
      "description": "Tailwind CSS v4 테마 설정 지시문"
    }
  ],
  "properties": [
    {
      "name": "--color-primary",
      "description": "주 색상 변수"
    },
    {
      "name": "--color-background",
      "description": "배경 색상 변수"
    }
  ]
}
"@

Set-Content -Path "cc-webapp/frontend/.vscode/tailwind.json" -Value $tailwindJsonContent -Encoding UTF8
Write-Host "📝 VS Code Tailwind 지원 파일이 생성되었습니다." -ForegroundColor Green

# 4. globals.css 확인
$globalsPath = "cc-webapp/frontend/styles/globals.css"
if (Test-Path $globalsPath) {
    $globalsContent = Get-Content -Path $globalsPath -Raw
    
    # @theme inline 지시문 확인
    if ($globalsContent -match "@theme\s+inline") {
        Write-Host "✅ globals.css에 이미 @theme inline 지시문이 있습니다." -ForegroundColor Green
    } else {
        Write-Host "⚠️ globals.css에 @theme inline 지시문이 없습니다. 수동으로 추가해야 합니다." -ForegroundColor Yellow
    }
}

Write-Host "✅ Tailwind CSS v4 로컬 개발 환경 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "🔄 프런트엔드 개발 서버 실행: cd cc-webapp/frontend; npm run dev" -ForegroundColor Cyan
