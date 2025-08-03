# Fix import versions in frontend components - Enhanced version
$frontendPath = "cc-webapp/frontend"
$files = Get-ChildItem -Path $frontendPath -Include "*.tsx", "*.ts", "*.js", "*.jsx" -Recurse

Write-Host "🔧 Fixing versioned imports in frontend files..." -ForegroundColor Cyan

$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName
    $modified = $false
    
    for ($i = 0; $i -lt $content.Length; $i++) {
        $line = $content[$i]
        
        # Fix specific versioned imports
        if ($line -match '@radix-ui/react-[a-z-]+@[\d\.]+') {
            $content[$i] = $line -replace '@radix-ui/react-([a-z-]+)@[\d\.]+', '@radix-ui/react-$1'
            $modified = $true
        }
        
        if ($line -match 'lucide-react@[\d\.]+') {
            $content[$i] = $line -replace 'lucide-react@[\d\.]+', 'lucide-react'
            $modified = $true
        }
        
        if ($line -match 'class-variance-authority@[\d\.]+') {
            $content[$i] = $line -replace 'class-variance-authority@[\d\.]+', 'class-variance-authority'
            $modified = $true
        }
        
        if ($line -match 'cmdk@[\d\.]+') {
            $content[$i] = $line -replace 'cmdk@[\d\.]+', 'cmdk'
            $modified = $true
        }
        
        if ($line -match 'recharts@[\d\.]+') {
            $content[$i] = $line -replace 'recharts@[\d\.]+', 'recharts'
            $modified = $true
        }
        
        if ($line -match 'react-day-picker@[\d\.]+') {
            $content[$i] = $line -replace 'react-day-picker@[\d\.]+', 'react-day-picker'
            $modified = $true
        }
        
        if ($line -match 'embla-carousel-react@[\d\.]+') {
            $content[$i] = $line -replace 'embla-carousel-react@[\d\.]+', 'embla-carousel-react'
            $modified = $true
        }
        
        # Fix regex patterns that got inserted accidentally
        if ($line -match '@\\d\+\\\.\\d\+\\\.\\d\+') {
            $content[$i] = $line -replace '@\\d\+\\\.\\d\+\\\.\\d\+', ''
            $modified = $true
        }
        
        if ($line -match '\[a-z-\]\+@\\d\+\\\.\\d\+\\\.\\d\+') {
            $content[$i] = $line -replace '\[a-z-\]\+@\\d\+\\\.\\d\+\\\.\\d\+', ''
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "🎉 Fixed $totalFixed files total!" -ForegroundColor Green
Write-Host "✨ All versioned imports have been cleaned up!" -ForegroundColor Cyan
