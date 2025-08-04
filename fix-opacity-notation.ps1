// fix-opacity-notation.ps1
# Fix opacity notation for Tailwind CSS v4
# In Tailwind v4, opacity notation has changed from bg-black/50 to bg-black:50

Write-Host "🔧 Fixing opacity notation for Tailwind CSS v4..." -ForegroundColor Cyan

$directory = "cc-webapp/frontend"
$fileTypes = @("*.tsx", "*.jsx", "*.ts", "*.js")
$count = 0

# Define regex pattern to match opacity notation
$pattern = '(?<=\s|")([a-zA-Z0-9-]+)\/([0-9]+)(?=\s|")'
$replacement = '$1:$2'

foreach ($fileType in $fileTypes) {
    $files = Get-ChildItem -Path $directory -Filter $fileType -Recurse
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        $newContent = $content -replace $pattern, $replacement
        
        if ($content -ne $newContent) {
            Set-Content -Path $file.FullName -Value $newContent
            Write-Host "✅ Fixed: $($file.FullName)" -ForegroundColor Green
            $count++
        }
    }
}

Write-Host "✅ Fixed $count files with opacity notation updates" -ForegroundColor Green
