# fix-encoding.ps1
# This script fixes encoding issues by converting files to UTF-8 without BOM

Write-Host "🔧 Fixing file encodings in the frontend project..." -ForegroundColor Cyan

$directory = "cc-webapp/frontend"
$fileTypes = @("*.tsx", "*.jsx", "*.ts", "*.js", "*.css", "*.json")
$fixedCount = 0

foreach ($fileType in $fileTypes) {
    $files = Get-ChildItem -Path $directory -Filter $fileType -Recurse
    
    foreach ($file in $files) {
        try {
            # Try to read the file content
            $content = [System.IO.File]::ReadAllBytes($file.FullName)
            
            # Check if the file starts with UTF-8 BOM (EF BB BF)
            $hasBOM = $content.Length -ge 3 -and $content[0] -eq 0xEF -and $content[1] -eq 0xBB -and $content[2] -eq 0xBF
            
            # Convert the file to UTF-8 without BOM
            if ($hasBOM) {
                $content = $content[3..$content.Length]
            }
            
            try {
                # Try to decode as UTF-8
                $contentStr = [System.Text.Encoding]::UTF8.GetString($content)
                
                # Save the file as UTF-8 without BOM
                [System.IO.File]::WriteAllText($file.FullName, $contentStr, [System.Text.Encoding]::UTF8)
                
                $fixedCount++
                Write-Host "✅ Fixed encoding: $($file.FullName)" -ForegroundColor Green
            }
            catch {
                # If decoding as UTF-8 fails, the file might be in a different encoding
                Write-Host "⚠️ Could not decode as UTF-8: $($file.FullName)" -ForegroundColor Yellow
                
                # Try reading with default encoding and save as UTF-8
                try {
                    $content = Get-Content -Path $file.FullName -Raw
                    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
                    $fixedCount++
                    Write-Host "✅ Fixed encoding with fallback method: $($file.FullName)" -ForegroundColor Green
                }
                catch {
                    Write-Host "❌ Failed to fix encoding: $($file.FullName)" -ForegroundColor Red
                    Write-Host "   Error: $_" -ForegroundColor Red
                }
            }
        }
        catch {
            Write-Host "❌ Failed to read file: $($file.FullName)" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
            
            # Try a more direct approach for problematic files
            try {
                $tempFile = "$($file.FullName).tmp"
                Copy-Item -Path $file.FullName -Destination $tempFile
                $content = Get-Content -Path $tempFile -Encoding Byte
                $utf8Content = [System.Text.Encoding]::UTF8.GetString($content)
                Set-Content -Path $file.FullName -Value $utf8Content -Encoding UTF8 -NoNewline
                Remove-Item -Path $tempFile -Force
                $fixedCount++
                Write-Host "✅ Fixed severely corrupted file: $($file.FullName)" -ForegroundColor Green
            }
            catch {
                Write-Host "💔 Unable to recover file: $($file.FullName)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "✅ Fixed encoding for $fixedCount files" -ForegroundColor Green
Write-Host "🔄 Please restart your development server now" -ForegroundColor Cyan
