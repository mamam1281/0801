# fix-opacity-notation-v4.ps1
# This script fixes opacity notation for Tailwind CSS v4 (from bg-black/50 to bg-black:50)

Write-Host "🔧 Fixing opacity notation for Tailwind CSS v4..." -ForegroundColor Cyan

$directory = "cc-webapp/frontend"
$fileTypes = @("*.tsx", "*.jsx", "*.ts", "*.js")
$count = 0

foreach ($fileType in $fileTypes) {
    $files = Get-ChildItem -Path $directory -Filter $fileType -Recurse -Exclude "*node_modules*" | 
             Where-Object { $_.FullName -notlike "*node_modules*" }
    
    foreach ($file in $files) {
        try {
            $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            
            # Replace bg-black/50 with bg-black:50 (handling all color formats)
            $newContent = $content -replace '(className=".+?)([a-zA-Z0-9-]+)\/([0-9]+)(.+?")', '$1$2:$3$4'
            
            if ($content -ne $newContent) {
                Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
                Write-Host "✅ Fixed opacity notation in: $($file.FullName)" -ForegroundColor Green
                $count++
            }
        }
        catch {
            Write-Host "❌ Error processing file $($file.FullName): $_" -ForegroundColor Red
        }
    }
}

Write-Host "✅ Fixed opacity notation in $count files" -ForegroundColor Green
Write-Host "🔄 Please restart your development server now" -ForegroundColor Cyan
