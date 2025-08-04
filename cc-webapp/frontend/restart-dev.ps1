Write-Host "🧹 .next 캐시 삭제 중..." -ForegroundColor Cyan
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🚀 개발 서버 재시작 중..." -ForegroundColor Green
npm run dev
