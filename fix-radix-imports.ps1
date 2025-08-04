# Radix UI 임포트 버전 제거 스크립트
Write-Host "🔧 Radix UI 임포트 버전 번호 제거 시작..." -ForegroundColor Cyan

# UI 컴포넌트 디렉토리
$uiPath = "cc-webapp\frontend\components\ui"

# 모든 .tsx 파일 찾기
$files = Get-ChildItem -Path $uiPath -Filter "*.tsx" -Recurse

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # 버전 번호가 포함된 임포트 패턴 수정
    $content = $content -replace '@radix-ui/([^@"]+)@[\d\.]+', '@radix-ui/$1'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        Write-Host "✅ 수정됨: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "⏭️  변경없음: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 완료! 총 $totalFiles 파일 중 $modifiedFiles 파일 수정됨" -ForegroundColor Yellow
Write-Host "이제 Docker 빌드를 다시 시도해주세요!" -ForegroundColor Cyan
