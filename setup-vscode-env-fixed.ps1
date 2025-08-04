# setup-vscode-env-fixed.ps1
# VSCode 개발 환경 완전 설정 스크립트 (수정된 버전)

Write-Host "🚀 VSCode 개발 환경 설정을 시작합니다..." -ForegroundColor Cyan

# 1. 필수 확장 프로그램 설치
Write-Host "📦 필수 확장 프로그램을 설치합니다..." -ForegroundColor Yellow

$extensions = @(
    "bradlc.vscode-tailwindcss",          # Tailwind CSS IntelliSense
    "pmneo.tsimporter",                   # TypeScript Importer
    "esbenp.prettier-vscode",             # Prettier
    "ms-vscode.vscode-eslint",            # ESLint
    "usernamehw.errorlens",               # Error Lens
    "ms-vscode.vscode-typescript-next",   # TypeScript
    "ms-vscode.vscode-json",              # JSON support
    "christian-kohler.path-intellisense", # Path IntelliSense
    "formulahendry.auto-rename-tag"       # Auto Rename Tag
)

foreach ($extension in $extensions) {
    Write-Host "  📋 설치 중: $extension" -ForegroundColor Cyan
    & code --install-extension $extension --force
}

Write-Host "✅ 확장 프로그램 설치 완료!" -ForegroundColor Green

# 2. 프로젝트 루트에 .vscode 디렉토리 생성
if (-not (Test-Path ".vscode")) {
    New-Item -Path ".vscode" -ItemType Directory -Force
    Write-Host "📁 .vscode 디렉토리 생성됨" -ForegroundColor Green
}

# 3. VSCode 설정 파일 생성
Write-Host "⚙️ VSCode 설정 파일을 생성합니다..." -ForegroundColor Yellow

# settings.json - 직접 JSON 생성 방식으로 변경
$settingsJson = [ordered]@{
    "typescript.preferences.importModuleSpecifier" = "relative"
    "typescript.suggest.autoImports" = $true
    "typescript.preferences.includePackageJsonAutoImports" = "off"
    "editor.formatOnSave" = $true
    "editor.codeActionsOnSave" = @{
        "source.fixAll.eslint" = "explicit"
    }
    "files.associations" = @{
        "*.css" = "tailwindcss"
    }
    "tailwindCSS.experimental.configFile" = $null
    "tailwindCSS.experimental.classRegex" = @(
        @("cva\(([^)]*)\)", "[\"'`]([^\"'`]*).*?[\"'`]"),
        @("cx\(([^)]*)\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"),
        @("cn\(([^)]*)\)", "(?:'|\"|)([^']*)(?:'|\"|)"),
        @("clsx\(([^)]*)\)", "(?:'|\"|)([^']*)(?:'|\"|)")
    )
    "tailwindCSS.files.exclude" = @(
        "**/.git/**",
        "**/node_modules/**",
        "**/.hg/**",
        "**/.svn/**"
    )
    "emmet.includeLanguages" = @{
        "typescript" = "html"
        "typescriptreact" = "html"
    }
    "editor.quickSuggestions" = @{
        "strings" = $true
    }
    "css.validate" = $false
    "less.validate" = $false
    "scss.validate" = $false
    "postcss.validate" = $false
    "editor.inlineSuggest.enabled" = $true
    "typescript.updateImportsOnFileMove.enabled" = "always"
    "editor.tabSize" = 2
    "editor.insertSpaces" = $true
    "editor.detectIndentation" = $false
    "tailwindCSS.includeLanguages" = @{
        "typescript" = "javascript"
        "typescriptreact" = "javascript"
    }
    "files.exclude" = @{
        "**/node_modules" = $true
        "**/.next" = $true
        "**/.git" = $true
        "**/dist" = $true
        "**/.turbo" = $true
    }
    "errorLens.enabledDiagnosticLevels" = @(
        "error",
        "warning",
        "info"
    )
    "errorLens.fontSize" = "12px"
}

$settingsContent = $settingsJson | ConvertTo-Json -Depth 10
Set-Content -Path ".vscode/settings.json" -Value $settingsContent -Encoding UTF8
Write-Host "✅ settings.json 생성 완료" -ForegroundColor Green

# 4. 확장 프로그램 추천 파일 생성
$extensionsJson = @{
    "recommendations" = @(
        "bradlc.vscode-tailwindcss",
        "pmneo.tsimporter",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "usernamehw.errorlens",
        "ms-vscode.vscode-typescript-next",
        "ms-vscode.vscode-json",
        "christian-kohler.path-intellisense",
        "formulahendry.auto-rename-tag"
    )
}

$extensionsContent = $extensionsJson | ConvertTo-Json -Depth 5
Set-Content -Path ".vscode/extensions.json" -Value $extensionsContent -Encoding UTF8
Write-Host "✅ extensions.json 생성 완료" -ForegroundColor Green

# 5. 코드 스니펫 생성 - 이 부분은 here-string을 작은 따옴표 형식으로 변경
$snippetsContent = @'
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "export function ${1:ComponentName}({ $3 }: ${1:ComponentName}Props) {",
      "  return (",
      "    <div className=\"glass-metal\">",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Create a React functional component"
  },
  "Game Component": {
    "prefix": "gc",
    "body": [
      "interface ${1:GameName}Props {",
      "  user: User;",
      "  onBack: () => void;",
      "  onUpdateUser: (user: User) => void;",
      "  onAddNotification: (message: string) => void;",
      "}",
      "",
      "export function ${1:GameName}({ user, onBack, onUpdateUser, onAddNotification }: ${1:GameName}Props) {",
      "  return (",
      "    <motion.div",
      "      initial={{ opacity: 0, scale: 0.9 }}",
      "      animate={{ opacity: 1, scale: 1 }}",
      "      exit={{ opacity: 0, scale: 0.9 }}",
      "      transition={{ duration: 0.3 }}",
      "      className=\"glass-metal card-hover-float\"",
      "    >",
      "      $0",
      "    </motion.div>",
      "  );",
      "}"
    ],
    "description": "Create a game component with animations"
  },
  "Motion Div": {
    "prefix": "mdiv",
    "body": [
      "<motion.div",
      "  initial={{ opacity: 0, scale: 0.9 }}",
      "  animate={{ opacity: 1, scale: 1 }}",
      "  exit={{ opacity: 0, scale: 0.9 }}",
      "  transition={{ duration: 0.3 }}",
      "  className=\"$1\"",
      ">",
      "  $0",
      "</motion.div>"
    ],
    "description": "Create a motion div with default animations"
  },
  "Glass Metal Card": {
    "prefix": "gmc",
    "body": [
      "<div className=\"glass-metal card-hover-float p-6\">",
      "  $0",
      "</div>"
    ],
    "description": "Create a glass metal card"
  }
}
'@

if (-not (Test-Path ".vscode/snippets")) {
    New-Item -Path ".vscode/snippets" -ItemType Directory -Force
}
Set-Content -Path ".vscode/snippets/typescriptreact.json" -Value $snippetsContent -Encoding UTF8
Write-Host "✅ 코드 스니펫 생성 완료" -ForegroundColor Green

# 6. 태스크 구성 파일 생성
$tasksJson = [ordered]@{
    "version" = "2.0.0"
    "tasks" = @(
        @{
            "label" = "dev"
            "type" = "shell"
            "command" = "npm run dev"
            "group" = "build"
            "presentation" = @{
                "echo" = $true
                "reveal" = "always"
                "focus" = $false
                "panel" = "shared"
            }
            "problemMatcher" = @()
        },
        @{
            "label" = "build"
            "type" = "shell"
            "command" = "npm run build"
            "group" = "build"
            "presentation" = @{
                "echo" = $true
                "reveal" = "always"
                "focus" = $false
                "panel" = "shared"
            }
            "problemMatcher" = @()
        },
        @{
            "label" = "type-check"
            "type" = "shell"
            "command" = "npx tsc --noEmit"
            "group" = "test"
            "presentation" = @{
                "echo" = $true
                "reveal" = "always"
                "focus" = $false
                "panel" = "shared"
            }
            "problemMatcher" = '$tsc'
        },
        @{
            "label" = "lint"
            "type" = "shell"
            "command" = "npm run lint"
            "group" = "test"
            "presentation" = @{
                "echo" = $true
                "reveal" = "always"
                "focus" = $false
                "panel" = "shared"
            }
            "problemMatcher" = @()
        }
    )
}

$tasksContent = $tasksJson | ConvertTo-Json -Depth 10
Set-Content -Path ".vscode/tasks.json" -Value $tasksContent -Encoding UTF8
Write-Host "✅ tasks.json 생성 완료" -ForegroundColor Green

# 7. 런치 구성 파일 생성
$launchJson = @{
    "version" = "0.2.0"
    "configurations" = @(
        @{
            "name" = "Next.js: debug server-side"
            "type" = "node"
            "request" = "launch"
            "program" = '${workspaceFolder}/node_modules/.bin/next'
            "args" = @("dev")
            "cwd" = '${workspaceFolder}'
            "console" = "integratedTerminal"
            "skipFiles" = @("<node_internals>/**")
        },
        @{
            "name" = "Next.js: debug client-side"
            "type" = "chrome"
            "request" = "launch"
            "url" = "http://localhost:3000"
            "webRoot" = '${workspaceFolder}'
        },
        @{
            "name" = "Next.js: debug full stack"
            "type" = "node"
            "request" = "launch"
            "program" = '${workspaceFolder}/node_modules/.bin/next'
            "args" = @("dev")
            "cwd" = '${workspaceFolder}'
            "console" = "integratedTerminal"
            "skipFiles" = @("<node_internals>/**")
            "serverReadyAction" = @{
                "action" = "debugWithChrome"
                "killOnServerStop" = $true
                "pattern" = "- Local:.*https?://localhost:([0-9]+)"
                "uriFormat" = "http://localhost:%s"
                "webRoot" = '${workspaceFolder}'
            }
        }
    )
}

$launchContent = $launchJson | ConvertTo-Json -Depth 10
Set-Content -Path ".vscode/launch.json" -Value $launchContent -Encoding UTF8
Write-Host "✅ launch.json 생성 완료" -ForegroundColor Green

# 8. Prettier 설정 파일 생성
$prettierJson = @{
    "semi" = $true
    "trailingComma" = "es5"
    "singleQuote" = $true
    "printWidth" = 100
    "tabWidth" = 2
    "useTabs" = $false
    "quoteProps" = "as-needed"
    "bracketSpacing" = $true
    "bracketSameLine" = $false
    "arrowParens" = "always"
    "endOfLine" = "lf"
    "embeddedLanguageFormatting" = "auto"
    "htmlWhitespaceSensitivity" = "css"
    "insertPragma" = $false
    "jsxSingleQuote" = $false
    "proseWrap" = "preserve"
    "requirePragma" = $false
    "vueIndentScriptAndStyle" = $false
}

$prettierContent = $prettierJson | ConvertTo-Json -Depth 5
Set-Content -Path ".prettierrc" -Value $prettierContent -Encoding UTF8
Write-Host "✅ .prettierrc 생성 완료" -ForegroundColor Green

# 9. ESLint 설정 파일 생성
$eslintJson = @{
    "extends" = @(
        "next/core-web-vitals",
        "prettier"
    )
    "rules" = @{
        "prefer-const" = "error"
        "no-unused-vars" = "off"
        "@typescript-eslint/no-unused-vars" = @("error", @{ "argsIgnorePattern" = "^_" })
        "no-console" = "warn"
        "react-hooks/exhaustive-deps" = "warn"
        "react/display-name" = "off"
    }
    "parser" = "@typescript-eslint/parser"
    "parserOptions" = @{
        "ecmaVersion" = 2021
        "sourceType" = "module"
        "ecmaFeatures" = @{
            "jsx" = $true
        }
    }
    "env" = @{
        "browser" = $true
        "es2021" = $true
        "node" = $true
    }
}

$eslintContent = $eslintJson | ConvertTo-Json -Depth 10
Set-Content -Path ".eslintrc.json" -Value $eslintContent -Encoding UTF8
Write-Host "✅ .eslintrc.json 생성 완료" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 VSCode 개발 환경 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계를 진행하세요:" -ForegroundColor Cyan
Write-Host "1. VSCode를 재시작하세요 (설정 적용)" -ForegroundColor White
Write-Host "2. Ctrl+Shift+P → 'Developer: Reload Window' 실행" -ForegroundColor White
Write-Host "3. Tailwind CSS IntelliSense가 활성화되는지 확인" -ForegroundColor White
Write-Host "4. 확장 프로그램이 모두 설치되었는지 확인" -ForegroundColor White
Write-Host ""
Write-Host "🚀 개발 시작:" -ForegroundColor Yellow
Write-Host "- Ctrl+Shift+P → 'Tasks: Run Task' → 'dev' 선택" -ForegroundColor White
Write-Host "- 또는 터미널에서: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🎯 유용한 단축키:" -ForegroundColor Yellow
Write-Host "- rfc + Tab: React 컴포넌트 생성" -ForegroundColor White
Write-Host "- gc + Tab: 게임 컴포넌트 생성" -ForegroundColor White
Write-Host "- mdiv + Tab: Motion div 생성" -ForegroundColor White
Write-Host "- gmc + Tab: Glass metal card 생성" -ForegroundColor White
