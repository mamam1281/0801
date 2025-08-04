# 백업 파일 정리 스크립트
# 목적: .bak 확장자 파일 및 중복 파일 정리

# PowerShell 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. 환경 설정
$projectRoot = "c:\Users\bdbd\0000\cc-webapp\frontend"
$backupOutputPath = "$projectRoot\backup-files-info.json"

# 2. 백업 파일 검색
Write-Host "1. 백업 파일 검색 중..." -ForegroundColor Cyan

# .bak 파일 검색
$bakFiles = Get-ChildItem -Path $projectRoot -Include "*.bak" -Recurse | Select-Object FullName, Name, Length, LastWriteTime

# 3. 백업 정보 저장 (나중에 복구 필요할 경우를 대비)
if ($bakFiles.Count -gt 0) {
    $bakFilesInfo = $bakFiles | ForEach-Object {
        @{
            Path = $_.FullName
            Name = $_.Name
            Size = $_.Length
            LastModified = $_.LastWriteTime.ToString()
        }
    }
    
    $bakFilesInfo | ConvertTo-Json | Out-File -FilePath $backupOutputPath -Encoding utf8
    Write-Host "   - 백업 파일 정보가 저장됨: $backupOutputPath" -ForegroundColor Green
    Write-Host "   - 발견된 .bak 파일 수: $($bakFiles.Count)" -ForegroundColor Yellow
    
    # 4. 각 파일 정보 표시
    Write-Host "`n2. 발견된 백업 파일 목록:" -ForegroundColor Cyan
    $bakFiles | ForEach-Object {
        $originalFileName = $_.Name -replace '\.bak$', ''
        $originalFilePath = $_.FullName -replace '\.bak$', ''
        $hasOriginal = Test-Path -Path $originalFilePath
        
        if ($hasOriginal) {
            Write-Host "   - $($_.Name) (원본 파일 존재)" -ForegroundColor Green
        } else {
            Write-Host "   - $($_.Name) (원본 파일 없음)" -ForegroundColor Yellow
        }
    }
    
    # 5. 백업 파일 제거 확인
    Write-Host "`n3. 백업 파일 제거 진행" -ForegroundColor Cyan
    Write-Host "   - 백업 파일 정보가 $backupOutputPath 에 저장되었습니다." -ForegroundColor Green
    Write-Host "   - 백업 파일을 삭제합니다..." -ForegroundColor Yellow
    
    # 백업 파일 제거
    $bakFiles | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        Write-Host "   - 삭제됨: $($_.Name)" -ForegroundColor Green
    }
    
    Write-Host "`n백업 파일 정리 완료!" -ForegroundColor Green
    Write-Host "총 $($bakFiles.Count)개의 백업 파일이 제거되었습니다." -ForegroundColor Green
    Write-Host "이 작업은 빌드 안정성 향상 및 프로젝트 구조 정리에 도움이 됩니다." -ForegroundColor Green
    
} else {
    Write-Host "   - 백업 파일(.bak)이 발견되지 않았습니다." -ForegroundColor Green
    Write-Host "`n백업 파일 정리 완료!" -ForegroundColor Green
    Write-Host "프로젝트에 백업 파일이 없습니다. 추가 정리가 필요하지 않습니다." -ForegroundColor Green
}
