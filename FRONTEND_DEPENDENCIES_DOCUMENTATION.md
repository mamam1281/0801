# 🎰 Casino-Club F2P Frontend - 의존성 문서화

## 📋 개요
이 문서는 Casino-Club F2P 프론트엔드 애플리케이션의 모든 의존성과 설정 파일들을 종합적으로 문서화합니다.

**프로젝트 정보:**
- **이름**: frontend
- **버전**: 0.1.0
- **프레임워크**: Next.js 15.4.5 + React 19.1.0
- **스타일링**: Tailwind CSS 4
- **UI 라이브러리**: shadcn/ui + Radix UI

---

## 🎨 Core Framework & Runtime

### 1. Next.js Ecosystem
```json
{
  "next": "15.4.5",                    // Next.js 프레임워크 (App Router 지원)
  "react": "19.1.0",                   // React 라이브러리 (최신 버전)
  "react-dom": "19.1.0"                // React DOM 렌더링
}
```

**특징:**
- ✅ Next.js 15의 최신 App Router 사용
- ✅ React 19의 최신 기능 지원 (컴파일러, 서버 컴포넌트)
- ✅ Turbopack 개발 서버로 빠른 빌드

### 2. TypeScript 설정
```json
{
  "typescript": "^5",                  // TypeScript 컴파일러
  "@types/node": "^20",               // Node.js 타입 정의
  "@types/react": "^19",              // React 타입 정의
  "@types/react-dom": "^19"           // React DOM 타입 정의
}
```

---

## 🎨 UI & Styling Framework

### 1. Tailwind CSS Ecosystem
```json
{
  "tailwindcss": "^4",                 // Tailwind CSS 프레임워크 (최신 v4)
  "@tailwindcss/postcss": "^4",       // PostCSS 플러그인
  "postcss": "^8.5.6",               // CSS 후처리기
  "autoprefixer": "^10.4.21"         // 브라우저 접두사 자동 생성
}
```

**설정 파일:**
- `postcss.config.mjs`: PostCSS 설정
- `src/app/globals.css`: 글로벌 스타일 + Tailwind 임포트

### 2. 애니메이션 & 인터랙션
```json
{
  "framer-motion": "^12.23.12"        // 고급 애니메이션 라이브러리
}
```

**주요 기능:**
- 🎭 페이지 전환 애니메이션
- 💫 카드 호버 효과
- 🎨 하트 애니메이션 시스템
- 📱 모바일 제스처 지원

---

## 🧩 UI Component Library (shadcn/ui + Radix UI)

### 1. Core UI Primitives (Radix UI)
```json
{
  "@radix-ui/react-slot": "^1.2.3",           // 컴포넌트 합성
  "@radix-ui/react-visually-hidden": "^1.2.3" // 접근성 숨김 요소
}
```

### 2. Navigation & Layout Components
```json
{
  "@radix-ui/react-navigation-menu": "^1.2.13",  // 네비게이션 메뉴
  "@radix-ui/react-menubar": "^1.1.15",          // 메뉴바
  "@radix-ui/react-dropdown-menu": "^2.1.15",    // 드롭다운 메뉴
  "@radix-ui/react-context-menu": "^2.2.15",     // 컨텍스트 메뉴
  "@radix-ui/react-tabs": "^1.1.12",             // 탭 인터페이스
  "@radix-ui/react-accordion": "^1.2.11",        // 아코디언
  "@radix-ui/react-collapsible": "^1.1.11",      // 접이식 컨테이너
  "@radix-ui/react-scroll-area": "^1.2.9",       // 스크롤 영역
  "@radix-ui/react-separator": "^1.1.7"          // 구분선
}
```

### 3. Data Display Components
```json
{
  "@radix-ui/react-avatar": "^1.1.10",           // 사용자 아바타
  "@radix-ui/react-aspect-ratio": "^1.1.7",      // 종횡비 컨테이너
  "@radix-ui/react-progress": "^1.1.7",          // 진행률 표시
  "@radix-ui/react-toast": "^1.2.14",            // 토스트 알림
  "@radix-ui/react-tooltip": "^1.2.7",           // 툴팁
  "@radix-ui/react-hover-card": "^1.1.14"        // 호버 카드
}
```

### 4. Form & Input Components
```json
{
  "@radix-ui/react-label": "^2.1.7",             // 레이블
  "@radix-ui/react-checkbox": "^1.3.2",          // 체크박스
  "@radix-ui/react-radio-group": "^1.3.7",       // 라디오 그룹
  "@radix-ui/react-select": "^2.2.5",            // 셀렉트 박스
  "@radix-ui/react-slider": "^1.3.5",            // 슬라이더
  "@radix-ui/react-switch": "^1.2.5",            // 스위치/토글
  "@radix-ui/react-toggle": "^1.1.9",            // 토글 버튼
  "@radix-ui/react-toggle-group": "^1.1.10"      // 토글 그룹
}
```

### 5. Modal & Overlay Components
```json
{
  "@radix-ui/react-dialog": "^1.1.14",           // 모달/다이얼로그
  "@radix-ui/react-alert-dialog": "^1.1.14",     // 경고 다이얼로그
  "@radix-ui/react-popover": "^1.1.14"           // 팝오버
}
```

---

## 🎮 Casino-Club 특화 UI 컴포넌트

### 1. 폼 처리 & 검증
```json
{
  "react-hook-form": "^7.62.0",       // 고성능 폼 라이브러리
  "@hookform/resolvers": "^5.2.1"     // 검증 리졸버 (Zod, Yup 등)
}
```

**활용 예시:**
- 회원가입/로그인 폼
- 게임 설정 폼
- 결제 정보 입력

### 2. 차트 & 데이터 시각화
```json
{
  "recharts": "^3.1.0"                // React 차트 라이브러리
}
```

**Casino-Club 활용:**
- 📊 수익/손실 차트
- 📈 레벨 진행도
- 💰 골드 사용 통계
- 🎯 게임 성과 분석

### 3. 날짜 & 시간 처리
```json
{
  "react-day-picker": "^9.8.1",       // 날짜 선택기
  "date-fns": "^4.1.0"                // 날짜 유틸리티 라이브러리
}
```

**활용 예시:**
- 🗓️ 배틀패스 기간 표시
- ⏰ 이벤트 타이머
- 📅 미션 마감일

### 4. 고급 UI 패턴
```json
{
  "sonner": "^2.0.7",                 // 토스트 알림 (고급)
  "vaul": "^1.1.2",                   // 드래그 가능한 모달 (모바일)
  "cmdk": "^1.1.1",                   // 커맨드 팔레트/검색
  "embla-carousel-react": "^8.6.0",   // 캐러셀/슬라이더
  "react-resizable-panels": "^3.0.4"  // 크기 조절 가능한 패널
}
```

**Casino-Club 적용:**
- 🎰 슬롯머신 릴 애니메이션 (`embla-carousel`)
- 🔍 게임/아이템 검색 (`cmdk`)
- 📱 모바일 게임 모달 (`vaul`)
- 📋 대시보드 레이아웃 (`resizable-panels`)

---

## 🔧 Development & Build Tools

### 1. 린팅 & 코드 품질
```json
{
  "eslint": "^9",                      // ESLint 최신 버전
  "eslint-config-next": "15.4.5",     // Next.js ESLint 설정
  "@eslint/eslintrc": "^3"             // ESLint 설정 호환성
}
```

### 2. 코드 포맷팅
```json
{
  "prettier": "^3.6.2"                // 코드 포맷터
}
```

### 3. 유틸리티 라이브러리
```json
{
  "clsx": "^2.1.1",                   // 조건부 CSS 클래스
  "tailwind-merge": "^3.3.1",         // Tailwind 클래스 병합
  "class-variance-authority": "^0.7.1", // 컴포넌트 변형 관리
  "lucide-react": "^0.536.0"          // 아이콘 라이브러리
}
```

---

## 🧪 Testing Framework

### 1. Unit & Integration Testing
```json
{
  "jest": "^30.0.5",                   // 테스트 프레임워크
  "jest-environment-jsdom": "^30.0.5", // DOM 테스트 환경
  "@testing-library/react": "^16.3.0", // React 컴포넌트 테스트
  "@testing-library/jest-dom": "^6.6.4", // Jest DOM matchers
  "@types/jest": "^30.0.0"             // Jest 타입 정의
}
```

### 2. E2E Testing
```json
{
  "cypress": "^14.5.3"                // End-to-End 테스트
}
```

### 3. Story-driven Development
```json
{
  "storybook": "^9.1.0"               // 컴포넌트 문서화 도구
}
```

---

## 📁 설정 파일 상세 분석

### 1. `package.json` - 프로젝트 설정
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",     // 개발 서버 (Turbopack)
    "build": "next build",             // 프로덕션 빌드
    "start": "next start",             // 프로덕션 서버
    "lint": "next lint"                // 린팅 실행
  }
}
```

### 2. `next.config.ts` - Next.js 설정
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### 3. `tsconfig.json` - TypeScript 설정
```json
{
  "compilerOptions": {
    "target": "ES2017",                // 대상 ECMAScript 버전
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,                   // JavaScript 파일 허용
    "skipLibCheck": true,              // 라이브러리 타입 체크 스킵
    "strict": true,                    // 엄격 모드
    "noEmit": true,                    // 컴파일 결과 출력 안함
    "esModuleInterop": true,           // ES 모듈 호환성
    "module": "esnext",                // 모듈 시스템
    "moduleResolution": "bundler",     // 모듈 해석 방식
    "resolveJsonModule": true,         // JSON 모듈 임포트
    "isolatedModules": true,           // 독립 모듈
    "jsx": "preserve",                 // JSX 보존
    "incremental": true,               // 증분 컴파일
    "plugins": [{ "name": "next" }],   // Next.js 플러그인
    "paths": {
      "@/*": ["./src/*"]               // 경로 별칭
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. `eslint.config.mjs` - ESLint 설정
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### 5. `postcss.config.mjs` - PostCSS 설정
```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],  // Tailwind CSS PostCSS 플러그인
};

export default config;
```

### 6. `src/app/globals.css` - 글로벌 스타일
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

---

## 🎯 Casino-Club 특화 기능 매핑

### 1. 게임 관련 컴포넌트
| 컴포넌트 | 사용 라이브러리 | 목적 |
|---------|---------------|------|
| **슬롯머신** | `embla-carousel-react`, `framer-motion` | 릴 회전 애니메이션 |
| **가챠 시스템** | `framer-motion`, `sonner` | 뽑기 애니메이션 + 결과 알림 |
| **배틀패스** | `@radix-ui/react-progress`, `recharts` | 진행도 + 통계 차트 |
| **상점** | `@radix-ui/react-dialog`, `react-hook-form` | 구매 모달 + 결제 폼 |

### 2. 사용자 인터페이스
| 기능 | 사용 라이브러리 | 구현 |
|------|---------------|------|
| **알림 시스템** | `sonner`, `@radix-ui/react-toast` | 게임 결과, 보상 알림 |
| **모바일 최적화** | `vaul`, `framer-motion` | 터치 제스처, 드래그 |
| **아이콘** | `lucide-react` | 일관된 아이콘 시스템 |
| **폼 검증** | `react-hook-form`, `@hookform/resolvers` | 로그인, 회원가입 |

### 3. 데이터 시각화
| 차트 유형 | 라이브러리 | 데이터 |
|----------|-----------|-------|
| **수익/손실** | `recharts` | 게임별 골드 변화량 |
| **레벨 진행** | `@radix-ui/react-progress` | 경험치, 배틀패스 |
| **통계 대시보드** | `recharts` | 플레이 시간, 승률 |

---

## 🚀 Performance & Optimization

### 1. 번들 최적화
- ✅ **Next.js 15 + Turbopack**: 빠른 개발 서버
- ✅ **Tree Shaking**: 사용하지 않는 코드 제거
- ✅ **Code Splitting**: 페이지별 번들 분할
- ✅ **React 19**: 최신 컴파일러 최적화

### 2. UI 성능
- ✅ **Radix UI**: 접근성 + 성능 최적화된 프리미티브
- ✅ **Tailwind CSS 4**: JIT 컴파일로 필요한 CSS만 생성
- ✅ **Framer Motion**: 하드웨어 가속 애니메이션

### 3. 개발 경험
- ✅ **TypeScript 5**: 엄격한 타입 안전성
- ✅ **ESLint + Prettier**: 일관된 코드 스타일
- ✅ **Hot Reload**: 실시간 개발 피드백

---

## 🔄 의존성 업데이트 전략

### 1. 주요 업데이트 주기
| 범주 | 업데이트 주기 | 우선순위 |
|------|--------------|---------|
| **보안 패치** | 즉시 | 🔴 높음 |
| **Next.js/React** | 월 1회 검토 | 🟡 중간 |
| **UI 라이브러리** | 분기별 | 🟢 낮음 |
| **개발 도구** | 필요시 | 🟢 낮음 |

### 2. 호환성 체크리스트
- [ ] Next.js + React 버전 호환성
- [ ] Tailwind CSS + PostCSS 호환성
- [ ] Radix UI 컴포넌트 API 변경 확인
- [ ] TypeScript 타입 정의 업데이트

---

## 🎮 Casino-Club 개발 가이드

### 1. 새 컴포넌트 추가 시
```bash
# 1. shadcn/ui 컴포넌트 추가
npx shadcn-ui@latest add [component-name]

# 2. 아이콘 확인
# lucide-react에서 필요한 아이콘 임포트

# 3. 애니메이션 추가
# framer-motion으로 인터랙션 구현
```

### 2. 스타일링 가이드
```typescript
// 유틸리티 함수 사용
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

// 컴포넌트 변형 정의
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
  }
)
```

### 3. 폼 처리 패턴
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  username: z.string().min(2),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  
  // 폼 처리 로직
}
```

---

## 📈 향후 확장 계획

### 1. 추가 예정 라이브러리
- **@tanstack/react-query**: 서버 상태 관리
- **zustand**: 클라이언트 상태 관리
- **react-spring**: 고급 스프링 애니메이션
- **lottie-react**: Lottie 애니메이션 지원

### 2. PWA 지원
- **next-pwa**: Progressive Web App 기능
- **workbox**: 서비스 워커 관리

### 3. 국제화
- **next-intl**: 다국어 지원

---

## ✅ 요약

Casino-Club F2P 프론트엔드는 **현대적이고 성능 최적화된 기술 스택**으로 구성되었습니다:

### 🏆 핵심 강점
1. **최신 기술**: Next.js 15 + React 19 + Tailwind CSS 4
2. **완전한 UI 시스템**: shadcn/ui + Radix UI (25+ 컴포넌트)
3. **최적화된 DX**: TypeScript + ESLint + Prettier
4. **카지노 특화**: 애니메이션, 차트, 폼 처리 완비
5. **모바일 퍼스트**: 반응형 + 터치 최적화

### 🎯 개발 준비도
- ✅ **67개 의존성** 설치 완료
- ✅ **개발 서버** 실행 중 (localhost:3002)
- ✅ **핵심 설정 파일** 모두 구성
- ✅ **컴포넌트 라이브러리** 준비 완료

이제 StreamingScreen.tsx와 같은 **고품질 카지노 게임 컴포넌트**를 자유롭게 개발할 수 있는 환경이 완성되었습니다! 🎰✨
 