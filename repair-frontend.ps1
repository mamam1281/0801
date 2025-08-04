# Frontend Auto-Repair Script
param(
    [switch]$Force = $false
)

$frontendPath = ".\cc-webapp\frontend"
Write-Host "`n Starting Frontend Auto-Repair..." -ForegroundColor Cyan

# 1. postcss.config.js 수정 (Tailwind v4 호환)
Write-Host "`n=== Fixing postcss.config.js ===" -ForegroundColor Yellow
$postcssContent = @"
// postcss.config.js - Tailwind CSS v4 configuration
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
"@

if ($Force -or (Read-Host "Fix postcss.config.js? (Y/N)") -eq 'Y') {
    $postcssContent | Out-File -FilePath "$frontendPath\postcss.config.js" -Encoding UTF8
    Write-Host " postcss.config.js updated" -ForegroundColor Green
}

# 2. next.config.js 기본 설정 확인 및 수정
Write-Host "`n=== Checking next.config.js ===" -ForegroundColor Yellow
if (-not (Test-Path "$frontendPath\next.config.js")) {
    $nextConfigContent = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

module.exports = nextConfig
"@
    
    if ($Force -or (Read-Host "Create next.config.js? (Y/N)") -eq 'Y') {
        $nextConfigContent | Out-File -FilePath "$frontendPath\next.config.js" -Encoding UTF8
        Write-Host " next.config.js created" -ForegroundColor Green
    }
}

# 3. 필수 디렉토리 생성
Write-Host "`n=== Creating required directories ===" -ForegroundColor Yellow
$requiredDirs = @("app", "components", "styles", "public", "utils", "hooks", "types")
foreach ($dir in $requiredDirs) {
    if (-not (Test-Path "$frontendPath\$dir")) {
        New-Item -ItemType Directory -Path "$frontendPath\$dir" -Force | Out-Null
        Write-Host " Created directory: $dir" -ForegroundColor Green
    }
}

# 4. app/layout.tsx 복구
if (-not (Test-Path "$frontendPath\app\layout.tsx")) {
    Write-Host "`n=== Creating app/layout.tsx ===" -ForegroundColor Yellow
    $layoutContent = @"
import '../styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Casino-Club F2P',
  description: 'Casino-Club F2P Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
"@
    
    if ($Force -or (Read-Host "Create app/layout.tsx? (Y/N)") -eq 'Y') {
        $layoutContent | Out-File -FilePath "$frontendPath\app\layout.tsx" -Encoding UTF8
        Write-Host " app/layout.tsx created" -ForegroundColor Green
    }
}

# 5. app/page.tsx 복구
if (-not (Test-Path "$frontendPath\app\page.tsx")) {
    Write-Host "`n=== Creating app/page.tsx ===" -ForegroundColor Yellow
    $pageContent = @"
'use client'

import App from '../App'

export default function HomePage() {
  return <App />
}
"@
    
    if ($Force -or (Read-Host "Create app/page.tsx? (Y/N)") -eq 'Y') {
        $pageContent | Out-File -FilePath "$frontendPath\app\page.tsx" -Encoding UTF8
        Write-Host " app/page.tsx created" -ForegroundColor Green
    }
}

# 6. 환경 변수 파일 생성
if (-not (Test-Path "$frontendPath\.env.local")) {
    Write-Host "`n=== Creating .env.local ===" -ForegroundColor Yellow
    $envContent = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=true
"@
    
    if ($Force -or (Read-Host "Create .env.local? (Y/N)") -eq 'Y') {
        $envContent | Out-File -FilePath "$frontendPath\.env.local" -Encoding UTF8
        Write-Host " .env.local created" -ForegroundColor Green
    }
}

Write-Host "`n Auto-repair completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd .\cc-webapp\frontend" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
