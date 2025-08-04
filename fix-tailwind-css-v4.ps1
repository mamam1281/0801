# fix-tailwind-css-v4.ps1
# This script fixes issues with Tailwind CSS v4

Write-Host "🔧 Setting up Tailwind CSS v4 compatibility..." -ForegroundColor Cyan

# Create .vscode directory if it doesn't exist
$vscodePath = "cc-webapp/frontend/.vscode"
if (!(Test-Path -Path $vscodePath)) {
    New-Item -ItemType Directory -Path $vscodePath -Force
    Write-Host "✅ Created VS Code settings directory" -ForegroundColor Green
}

# Create VS Code settings.json
$settingsContent = @"
{
  "tailwindCSS.experimental.configFile": null,
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "css.validate": false,
  "postcss.validate": false,
  "editor.quickSuggestions": {
    "strings": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|)([^']*)(?:'|\"|)"],
    ["cva\\(([^)]*)\\)", "[\"']([^\"']*).*?[\"']"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
"@

Set-Content -Path "$vscodePath/settings.json" -Value $settingsContent -Encoding UTF8
Write-Host "✅ Created VS Code settings for Tailwind CSS v4" -ForegroundColor Green

# Create Next.js config
$nextConfigContent = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  }
}

export default nextConfig;
"@

Set-Content -Path "cc-webapp/frontend/next.config.js" -Value $nextConfigContent -Encoding UTF8
Write-Host "✅ Created simplified Next.js config" -ForegroundColor Green

# Install required packages
Write-Host "🔄 Installing required npm packages..." -ForegroundColor Cyan
Push-Location "cc-webapp/frontend"
npm install --save-dev @tailwindcss/postcss
Pop-Location

Write-Host "✅ Frontend setup complete for local development with Tailwind CSS v4!" -ForegroundColor Green
Write-Host "🔑 Key points to remember:" -ForegroundColor Yellow
Write-Host "  1. No tailwind.config.js or postcss.config.js files allowed" -ForegroundColor White
Write-Host "  2. Use relative imports, not @/ imports" -ForegroundColor White
Write-Host "  3. Use cn() function from ./components/ui/utils.ts for class names" -ForegroundColor White
Write-Host "  4. CSS variables and theme defined in globals.css" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Green
Write-Host "  1. cd cc-webapp/frontend" -ForegroundColor White
Write-Host "  2. npm run dev" -ForegroundColor White
