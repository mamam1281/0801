# Backup Files Cleanup Script
# Purpose: Clean up .bak files and duplicates

# 1. Environment Setup
$projectRoot = "c:\Users\bdbd\0000\cc-webapp\frontend"
$backupOutputPath = "$projectRoot\backup-files-info.json"

# 2. Search for Backup Files
Write-Host "1. Searching for backup files..." -ForegroundColor Cyan

# Find .bak files
$bakFiles = Get-ChildItem -Path $projectRoot -Include "*.bak" -Recurse | Select-Object FullName, Name, Length, LastWriteTime

# 3. Save Backup Info (for potential recovery)
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
    Write-Host "   - Backup file info saved to: $backupOutputPath" -ForegroundColor Green
    Write-Host "   - Number of .bak files found: $($bakFiles.Count)" -ForegroundColor Yellow
    
    # 4. Display Each File's Info
    Write-Host "`n2. List of backup files found:" -ForegroundColor Cyan
    $bakFiles | ForEach-Object {
        $originalFileName = $_.Name -replace '\.bak$', ''
        $originalFilePath = $_.FullName -replace '\.bak$', ''
        $hasOriginal = Test-Path -Path $originalFilePath
        
        if ($hasOriginal) {
            Write-Host "   - $($_.Name) (original file exists)" -ForegroundColor Green
        } else {
            Write-Host "   - $($_.Name) (no original file)" -ForegroundColor Yellow
        }
    }
    
    # 5. Confirm and Remove Backup Files
    Write-Host "`n3. Removing backup files" -ForegroundColor Cyan
    Write-Host "   - Backup file information saved to $backupOutputPath" -ForegroundColor Green
    Write-Host "   - Deleting backup files..." -ForegroundColor Yellow
    
    # Remove backup files
    $bakFiles | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        Write-Host "   - Deleted: $($_.Name)" -ForegroundColor Green
    }
    
    Write-Host "`nBackup file cleanup complete!" -ForegroundColor Green
    Write-Host "Total of $($bakFiles.Count) backup files were removed." -ForegroundColor Green
    Write-Host "This improves build stability and cleans up project structure." -ForegroundColor Green
    
} else {
    Write-Host "   - No backup files (.bak) were found." -ForegroundColor Green
    Write-Host "`nBackup file cleanup complete!" -ForegroundColor Green
    Write-Host "No backup files exist in the project. No additional cleanup needed." -ForegroundColor Green
}
