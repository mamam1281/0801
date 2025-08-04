# 파일의 import 문 수정하기
$uiComponentsDir = "C:\Users\bdbd\0000\cc-webapp\frontend\components\ui"
$files = Get-ChildItem -Path $uiComponentsDir -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # @로 끝나는 모든 버전 정보 제거
    $updatedContent = $content -replace '@\d+\.\d+\.\d+', ''
    
    # 파일에 변경사항이 있으면 업데이트
    if ($content -ne $updatedContent) {
        Set-Content -Path $file.FullName -Value $updatedContent
        Write-Host "Updated imports in $($file.Name)"
    }
}

Write-Host "All component imports updated successfully!"
