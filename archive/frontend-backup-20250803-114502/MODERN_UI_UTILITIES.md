# Modern UI/UX Utility Classes

이 문서는 Casino-Club 프로젝트에서 사용할 수 있는 모든 현대적인 UI/UX 유틸리티 클래스들을 설명합니다.

## 🧊 Glassmorphism Effects

### Basic Glassmorphism
```html
<div class="glassmorphism-dark">
  <!-- 기본 글래스모피즘 효과 -->
</div>
```

### Ice Glassmorphism (Enhanced Frost Effect)
```html
<div class="ice-glassmorphism">
  <!-- 완전 얼음 효과의 글래스모피즘 -->
</div>
```
- 더 밝고 투명한 흰색 기반
- 강화된 백드롭 블러 효과
- 호버 시 더욱 선명한 효과

### Frost Glassmorphism
```html
<div class="frost-glassmorphism">
  <!-- 부드러운 프로스트 글래스 효과 -->
</div>
```

## 🎨 Neumorphism Effects

### Light Theme Neumorphism
```html
<div class="neumorphism-light">
  <!-- 밝은 테마용 네오모피즘 -->
</div>
```

### Dark Theme Neumorphism
```html
<div class="neumorphism-dark">
  <!-- 어두운 테마용 네오모피즘 -->
</div>
```

### Inset Neumorphism
```html
<div class="neumorphism-dark-inset">
  <!-- 눌린 듯한 인셋 효과 -->
</div>
```

## 🌟 Metallic Glass Effect

```html
<div class="metallic-glass">
  <!-- 메탈릭 글래스 효과 -->
</div>
```
- 그라데이션 배경과 백드롭 블러
- 메탈릭 테두리 효과
- 내부 글로우와 외부 그림자

## 🔲 Brutalism Effects

### Brutalism Card
```html
<div class="brutalism-card">
  <!-- 브루탈리즘 카드 효과 -->
</div>
```
- 두꺼운 테두리
- 그림자 오프셋
- 호버 시 이동 애니메이션

### Brutalism Button
```html
<button class="brutalism-button">
  <!-- 브루탈리즘 버튼 효과 -->
</button>
```

## 🌈 Blurry Gradient Blob

```html
<div class="blurry-gradient-blob">
  <!-- 블러리 그라데이션 블롭 배경 -->
</div>
```
- 애니메이션되는 블러리 배경
- 그라데이션 색상 변화
- 부유하는 블롭 효과

## 📝 Text Effects

### Gradient Text
```html
<span class="text-gradient">
  <!-- 네온 그라데이션 텍스트 -->
</span>
```

### Neon Purple Text Colors
```html
<span class="text-neon-purple-1">Level 1 Neon</span>
<span class="text-neon-purple-2">Level 2 Neon</span>
<span class="text-neon-purple-3">Level 3 Neon</span>
<span class="text-neon-purple-4">Level 4 Neon</span>
```

## 🎭 Animation Classes

### Neon Pulse Animation
```html
<div class="animate-neon-pulse">
  <!-- 네온 펄스 애니메이션 -->
</div>
```

### Float Animation
```html
<div class="animate-float">
  <!-- 부유 애니메이션 -->
</div>
```

### Glow Animation
```html
<div class="animate-glow">
  <!-- 글로우 애니메이션 -->
</div>
```

### Blob Animation
```html
<div class="animate-blob">
  <!-- 블롭 이동 애니메이션 -->
</div>
```

## 🎨 Background and Border Utilities

### Neon Purple Backgrounds
```html
<div class="bg-neon-purple-1">Level 1 Background</div>
<div class="bg-neon-purple-2">Level 2 Background</div>
<div class="bg-neon-purple-3">Level 3 Background</div>
<div class="bg-neon-purple-4">Level 4 Background</div>
```

### Neon Purple Borders
```html
<div class="border-neon-purple-1">Level 1 Border</div>
<div class="border-neon-purple-2">Level 2 Border</div>
<div class="border-neon-purple-3">Level 3 Border</div>
<div class="border-neon-purple-4">Level 4 Border</div>
```

## 🎯 Usage Examples

### Modern Game Card
```html
<div class="ice-glassmorphism animate-float p-6 rounded-lg">
  <h3 class="text-gradient font-bold text-xl mb-4">Game Title</h3>
  <p class="text-foreground/80">Game description...</p>
  <button class="brutalism-button mt-4 px-6 py-2">
    Play Now
  </button>
</div>
```

### Floating Action Button
```html
<button class="metallic-glass animate-glow p-4 rounded-full fixed bottom-8 right-8">
  <svg class="w-6 h-6 text-neon-purple-1">...</svg>
</button>
```

### Background Decoration
```html
<div class="relative">
  <div class="blurry-gradient-blob animate-blob"></div>
  <div class="frost-glassmorphism relative z-10 p-8">
    <!-- Main content -->
  </div>
</div>
```

## 🛠️ Development Notes

- 모든 클래스는 CSS Variables를 사용하여 테마 시스템과 완전 통합됨
- 애니메이션은 성능 최적화를 위해 GPU 가속 속성 사용
- 접근성을 위해 `prefers-reduced-motion` 미디어 쿼리 고려 필요
- 모든 효과는 반응형 디자인과 호환됨

## 🎨 Design Token Integration

모든 유틸리티 클래스는 `globals.css`의 CSS Variables를 참조하며, 다음과 같은 디자인 토큰 시스템과 연동됩니다:

- **Colors**: `--neon-purple-*`, `--accent`, `--card`, `--foreground`
- **Spacing**: `--radius-*`, `--container-padding-*`
- **Transitions**: `--transition-*`
- **Typography**: `--font-*`

이를 통해 일관된 디자인 시스템을 유지하면서도 현대적인 UI 트렌드를 적용할 수 있습니다.
