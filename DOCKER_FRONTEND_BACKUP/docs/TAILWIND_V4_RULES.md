# Tailwind CSS V4 Development Guidelines

## 🚨 Critical Rules for All Developers

### ❌ FORBIDDEN - Never Create These Files:
```
tailwind.config.js    # ❌ NEVER CREATE
tailwind.config.ts    # ❌ NEVER CREATE  
postcss.config.js     # ❌ NEVER CREATE
```

### ❌ FORBIDDEN - Import Patterns:
```tsx
// ❌ NEVER USE
import { Button } from '@/components/ui/button'
import clsx from 'clsx'

// ✅ ALWAYS USE
import { Button } from './components/ui/button'
import { cn } from './components/ui/utils'
```

### ✅ REQUIRED - File Structure:
```
frontend/
├── styles/
│   └── globals.css          # ✅ ONLY place for styles
├── components/ui/
│   ├── utils.ts            # ✅ cn() function here
│   └── *.tsx              # ✅ UI components
└── app/                    # ✅ Next.js App Router
```

### ✅ REQUIRED - CSS Pattern:
```css
/* ✅ ONLY in globals.css */
:root {
  --primary: #e6005e;
  --background: #0a0a0f;
}

@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
}
```

### ✅ REQUIRED - Component Pattern:
```tsx
// ✅ Always use cn() function
<div className={cn(
  "bg-primary", 
  "text-primary-foreground",
  className
)}>
```

## 🎮 Casino-Club Specific Classes

### Neon Effects:
```tsx
<div className="glass-metal glass-metal-hover">
<h1 className="text-gradient-primary">
<div className="btn-hover-lift metal-shine">
```

### Color Variables:
```css
--neon-cyan: #00FFFF;
--neon-pink: #FF00FF;
--casino-gold: #FFD700;
--game-bg: #111827;
```

## 🔧 VS Code Setup Required

**File: `.vscode/settings.json`**
```json
{
  "tailwindCSS.experimental.configFile": null,
  "css.validate": false,
  "postcss.validate": false
}
```

---
**⚠️ Violation of these rules will break the build!**
