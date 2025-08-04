# fix-next-cli.ps1
# This script fixes encoding issues in Next.js CLI files

Write-Host "🔧 Fixing Next.js CLI file encodings..." -ForegroundColor Cyan

$nextCliPath = "cc-webapp/frontend/node_modules/next/dist/cli"
$files = Get-ChildItem -Path $nextCliPath -Filter "*.js" -Recurse

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        
        # Check if the file starts with UTF-8 BOM (EF BB BF)
        $hasBOM = $content.Length -ge 3 -and $content[0] -eq 0xEF -and $content[1] -eq 0xBB -and $content[2] -eq 0xBF
        
        if ($hasBOM) {
            Write-Host "Fixing BOM in $($file.FullName)" -ForegroundColor Yellow
            # Remove BOM
            $content = $content[3..$content.Length]
            
            # Read as UTF8
            $contentStr = [System.Text.Encoding]::UTF8.GetString($content)
            
            # Write back without BOM
            [System.IO.File]::WriteAllText($file.FullName, $contentStr, [System.Text.Encoding]::UTF8)
            
            Write-Host "✅ Fixed BOM: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "✅ Finished fixing Next.js CLI files" -ForegroundColor Green
