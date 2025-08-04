# 🎨 Casino-Club F2P 핵심 색감 가이드

## 📊 현재 클론한 레포의 핵심 컬러 시스템

### 🌈 **메인 컬러 팔레트**

#### **1. 네온 컬러 (Cyberpunk 테마)**
```css
/* 네온 컬러 - 사이버펑크 느낌 */
--neon-cyan: #00FFFF      /* 네온 시안 */
--neon-pink: #FF00FF      /* 네온 핑크 */
--neon-green: #00FF00     /* 네온 그린 */
--neon-blue: #0080FF      /* 네온 블루 */
--neon-purple: #8000FF    /* 네온 퍼플 */
--neon-orange: #FF8000    /* 네온 오렌지 */
--neon-yellow: #FFFF00    /* 네온 옐로우 */
```

#### **2. 카지노 컬러 (게임 테마)**
```css
/* 카지노 컬러 - 게임 분위기 */
--casino-gold: #FFD700    /* 카지노 골드 */
--casino-red: #DC143C     /* 카지노 레드 */
--casino-green: #228B22   /* 카지노 그린 */
--casino-blue: #1E90FF    /* 카지노 블루 */
```

#### **3. 브랜드 기본 컬러 (실제 커밋 기준)**
```css
/* 메인 브랜드 컬러 - 핑크 그라디언트 시스템 */
--color-pink-primary: #FF4B8C    /* 메인 핑크 */
--color-pink-light: #FF6B9D      /* 라이트 핑크 */
--color-pink-dark: #C44569       /* 다크 핑크 */

/* 배경 시스템 */
--color-bg-primary: #1A1A1A      /* 메인 배경 */
--color-bg-secondary: #242424    /* 보조 배경 */
--color-bg-tertiary: #2E2E2E     /* 3차 배경 */

/* 텍스트 */
--color-text-primary: #FFFFFF    /* 메인 텍스트 */
--color-text-secondary: #B0B0B0  /* 보조 텍스트 */
```

### 🎯 **게임별 색상 구성 (실제 커밋 기준)**

#### **Pink-Based 계열 (메인)**
- **배경**: `#1A1A1A` → `#242424` 그라디언트
- **카드**: `핑크 그라디언트` (#FF6B9D → #C44569)
- **버튼**: `#FF4B8C` → `#C44569` 호버 효과

#### **네온 액센트 시스템**
```css
/* 네온 강조 색상 */
neon-cyan: #00FFFF         /* 메인 강조 */
neon-magenta: #FF00FF      /* 보조 강조 */
neon-electric: #00FF41     /* 성공/획득 */
neon-purple: #8B00FF       /* 특별 아이템 */
```

#### **멀티플라이어 시스템**
```css
/* 배수별 색상 시스템 */
x1.0-1.5: blue-500      /* 안전 (파랑) */
x1.6-2.0: yellow-500    /* 중간 (노랑) */
x2.1-3.0: orange-500    /* 위험 (주황) */
x3.0+:    red-500       /* 고위험 (빨강) */
```

#### **보상 시스템 색상**
```css
/* 보상 카드별 색상 */
프리벳:    blue-600     /* 파랑 계열 */
프리미엄:  purple-600   /* 보라 계열 */
에어드롭:  gray-800     /* 회색 계열 */
성공:      green-500    /* 초록 계열 */
```

### 🌟 **특수 효과 색상**

#### **글로우 효과**
```css
/* 네온 글로우 그림자 */
shadow-purple-500/50    /* 보라 글로우 */
shadow-blue-500/50      /* 파랑 글로우 */
shadow-yellow-500/50    /* 노랑 글로우 */
shadow-neon-cyan/50     /* 시안 글로우 */
```

#### **그라디언트 조합**
```css
/* 메인 배경 그라디언트 */
bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900

/* 카드 배경 그라디언트 */
bg-gradient-to-r from-purple-600 to-indigo-600
bg-gradient-to-r from-blue-600 to-purple-600

/* 버튼 그라디언트 */
bg-gradient-to-r from-purple-500 to-blue-500
```

### 🎮 **게임 전용 색상**

#### **게임 배경 & UI**
```css
--game-bg: #111827      /* 게임 배경 */
--game-card: #1F2937    /* 게임 카드 */
--slot-gold: #FFD700    /* 슬롯 골드 */
--rps-blue: #3B82F6     /* 가위바위보 블루 */
--gacha-purple: #8B5CF6 /* 가챠 퍼플 */
--crash-red: #EF4444    /* 크래시 레드 */
```

### 🔧 **CSS 변수 활용**

#### **현재 정의된 주요 변수들**
```css
:root {
  /* 기본 색상 */
  --background: #0a0a0f;
  --foreground: #ffffff;
  --primary: #e6005e;
  
  /* 네온 색상 */
  --neon-cyan: #00FFFF;
  --neon-pink: #FF00FF;
  --casino-gold: #FFD700;
  
  /* 게임 색상 */
  --game-bg: #111827;
  --slot-gold: #FFD700;
  --gacha-purple: #8B5CF6;
}

@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-neon-cyan: var(--neon-cyan);
  --color-casino-gold: var(--casino-gold);
}
```

## 🎨 **실제 적용 예시**

### **메인 화면 색상 구성**
```tsx
// 배경 그라디언트
<div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
  
  // 게임 카드
  <div className="bg-purple-600/80 border border-purple-400">
    
    // 제목 텍스트 (네온 효과)
    <h2 className="text-neon-cyan font-bold">Casino Games</h2>
    
    // 멀티플라이어 표시
    <span className="bg-red-500 text-white">x3.5</span>
    
    // 메인 버튼
    <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
      Play Now
    </button>
  </div>
</div>
```

### **컴포넌트별 색상 가이드**
```tsx
/* 버튼 위계 */
Primary:   bg-purple-600 text-white      /* 메인 액션 */
Secondary: bg-blue-500 text-white        /* 보조 액션 */
Success:   bg-green-500 text-white       /* 성공/확인 */
Warning:   bg-yellow-500 text-black      /* 경고 */
Danger:    bg-red-500 text-white         /* 위험/삭제 */

/* 상태 표시 */
Active:    text-neon-cyan               /* 활성 상태 */
Inactive:  text-gray-400                /* 비활성 상태 */
Highlight: text-casino-gold             /* 강조 표시 */
```

## 🎯 **색상 사용 우선순위**

### **1순위: 네온/사이버펑크 색상**
- `neon-cyan` (#00FFFF) - 메인 강조
- `neon-pink` (#FF00FF) - 보조 강조  
- `neon-purple` (#8000FF) - 브랜드 색상

### **2순위: 카지노 테마 색상**
- `casino-gold` (#FFD700) - 포인트/보상
- `casino-red` (#DC143C) - 위험/높은 배수
- `casino-green` (#228B22) - 성공/안전

### **3순위: 기본 UI 색상**
- `purple-600` - 메인 UI 요소
- `blue-500` - 보조 UI 요소
- `gray-800` - 중성 UI 요소

---

## 💡 **핵심 디자인 원칙**

1. **어두운 배경** (`#0a0a0f`) 기반의 다크 테마
2. **네온 색상**으로 미래적/사이버펑크 느낌 연출
3. **보라-파랑 계열** 그라디언트가 메인 컬러 조합
4. **멀티플라이어**는 위험도에 따라 파랑→노랑→주황→빨강 순
5. **글로우 효과**로 네온 사인 같은 시각적 임팩트

**이 색상 시스템은 Casino-Club F2P의 "Futuristic Neon Cyberpunk" 테마를 완벽히 구현합니다!** 🚀
