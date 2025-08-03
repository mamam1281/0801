# 게임 플랫폼 인증 시스템 - 기술 문서

## 프로젝트 개요
모바일 우선 설계의 게임 플랫폼 인증 시스템으로, 로그인, 회원가입, 비밀번호 재설정 기능을 제공합니다. 400×750 모바일 화면에 최적화되어 있으며, 팝업 형태로 동작하도록 설계되었습니다.

## 기술 스택

### 프론트엔드 프레임워크
- **React 18+**: 함수형 컴포넌트와 Hooks 사용
- **Next.js 15+**: App Router 사용
- **TypeScript**: 타입 안정성 확보

### 스타일링
- **Tailwind CSS v4.0**: 유틸리티 클래스 기반 스타일링
- **CSS Variables**: 다크 테마 및 네온 퍼플 컬러 스킴
- **Framer Motion**: 애니메이션 및 트랜지션
- **Exo Font**: Google Fonts의 Exo 폰트 패밀리 사용

### UI 라이브러리
- **shadcn/ui**: 재사용 가능한 UI 컴포넌트
- **Lucide React**: 아이콘 라이브러리
- **Sonner**: 토스트 알림

### 폼 관리
- **React Hook Form 7.55.0**: 폼 상태 관리
- **Zod**: 스키마 검증 (shadcn/ui 폼과 통합)


## 디자인 시스템

### 타이포그래피 - Exo 폰트
```css
/* Exo 폰트 Google Fonts 적용 */
@import url('https://fonts.googleapis.com/css2?family=Exo:ital,wght@0,100..900;1,100..900&display=swap');

/* 기본 폰트 패밀리 */
--font-family: 'Exo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Exo 폰트의 특징:**
- 현대적이고 기하학적인 디자인
- 게임 UI에 적합한 테크니컬한 느낌
- 다양한 가중치 지원 (100-900)
- 이탤릭체 지원
- 가독성이 우수한 디스플레이 폰트

**폰트 최적화 설정:**
```css
body {
  font-feature-settings: 'cv11', 'ss01';
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**게임 UI 전용 Exo 스타일:**
```css
.game-title {
  font-family: var(--font-family);
  font-weight: 700;
  letter-spacing: -0.05em;
  text-transform: uppercase;
}

.game-subtitle {
  font-family: var(--font-family);
  font-weight: 500;
  letter-spacing: -0.025em;
}

.game-body {
  font-family: var(--font-family);
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

### 색상 체계 (다크 테마)
```css
/* 기본 색상 */
--background: 0 0% 3.9%;           /* 다크 배경 */
--foreground: 0 0% 98%;            /* 밝은 텍스트 */
--card: 0 0% 3.9%;                 /* 카드 배경 */
--card-foreground: 0 0% 98%;       /* 카드 텍스트 */

/* 네온 퍼플 액센트 */
--primary: 263.4 70% 50.4%;        /* 네온 퍼플 */
--primary-foreground: 0 0% 98%;    /* 버튼 텍스트 */
--accent: 270 95% 75%;             /* 밝은 퍼플 */

/* 폼 요소 */
--input: 0 0% 14.9%;               /* 입력 필드 배경 */
--border: 0 0% 14.9%;              /* 테두리 */
--muted: 0 0% 14.9%;               /* 비활성 배경 */
--muted-foreground: 0 0% 63.9%;    /* 비활성 텍스트 */
```

### 레이아웃 규칙
- **모바일 우선**: 400×750 기준 설계
- **팝업 최적화**: 컴팩트한 여백과 간격
- **터치 친화적**: 최소 44px 터치 영역
- **반응형**: 웹에서도 적절한 표시


## 브랜딩 및 UI 일관성

### Exo 폰트 브랜딩
- **현대적 게임 플랫폼**: Exo의 기하학적 디자인이 하이테크 게임 환경에 적합
- **전문성**: 세련된 폰트로 플랫폼의 신뢰성 표현
- **가독성**: 다양한 화면 크기에서 우수한 가독성
- **확장성**: 다양한 게임 장르에 적응 가능한 범용성

### 브랜드 컬러와 폰트 조화
- 네온 퍼플과 Exo 폰트의 미래적 조화
- 다크 테마에서의 높은 대비율
- 게임 UI 요소와의 일관성
