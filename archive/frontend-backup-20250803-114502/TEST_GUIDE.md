# 프론트엔드 테스트 실행 가이드

## 🧪 테스트 구조

### 1. 단위 테스트 (Jest + React Testing Library)
- **위치**: `components/**/__tests__/`, `__tests__/`
- **목적**: 컴포넌트 렌더링, props 전달, 이벤트 처리 테스트
- **실행**: `npm run test`

### 2. 컴포넌트 테스트 (Storybook)
- **위치**: `components/**/*.stories.tsx`
- **목적**: UI 컴포넌트 시각적 테스트, 상호작용 테스트
- **실행**: `npm run storybook`

### 3. E2E 테스트 (Cypress)
- **위치**: `cypress/e2e/`
- **목적**: 실제 브라우저에서의 사용자 시나리오 테스트
- **실행**: `npm run cy:run`

## 🚀 테스트 실행 명령어

### 단위 테스트
```bash
# 모든 단위 테스트 실행
npm run test

# 변경사항 감지하여 테스트 실행
npm run test:watch

# 커버리지 포함 테스트 실행
npm run test:coverage

# CI 환경용 테스트 실행
npm run test:ci

# 특정 컴포넌트 테스트만 실행
npm run test:unit
```

### Storybook
```bash
# Storybook 개발 서버 시작 (포트 6006)
npm run storybook

# Storybook 빌드
npm run build-storybook

# 컴포넌트 테스트 실행
npm run test:component
```

### E2E 테스트
```bash
# Cypress 헤드리스 모드 실행
npm run cy:run

# Cypress 헤드리스 모드 (CI용)
npm run cy:run:headless

# Cypress GUI 모드 실행
npm run cy:open

# E2E 테스트만 실행
npm run test:e2e
```

### 전체 테스트 실행
```bash
# 모든 테스트 실행 (타입체크 + 린트 + 단위 + E2E)
npm run test:all

# 타입 체크만
npm run type-check

# 린트 검사
npm run lint
```

## 📋 테스트 체크리스트

### 공통 컴포넌트 테스트 항목

#### ✅ 기능 테스트
- [x] 기본 렌더링
- [x] Props 전달 및 적용
- [x] 이벤트 핸들링
- [x] 상태 변경
- [x] 조건부 렌더링

#### ✅ 접근성 테스트
- [x] 키보드 접근성
- [x] ARIA 속성
- [x] 색상 대비
- [x] 포커스 관리
- [x] 스크린 리더 호환성

#### ✅ 성능 테스트
- [x] 로딩 시간 측정
- [x] 렌더링 성능
- [x] 애니메이션 성능
- [x] 메모리 누수 방지

#### ✅ 반응형 테스트
- [x] 모바일 뷰포트 (375px)
- [x] 태블릿 뷰포트 (768px)
- [x] 데스크톱 뷰포트 (1280px)

#### ✅ 시각적 테스트
- [x] 글래스모피즘 효과
- [x] 네온 효과
- [x] 애니메이션 상태
- [x] 다크/라이트 테마

## 🔧 설정 파일

### Jest 설정
- `jest.config.js`: Jest 기본 설정 및 모듈 매핑
- `jest.setup.js`: 전역 테스트 설정 및 목킹

### Cypress 설정
- `cypress.json`: Cypress 기본 설정
- `cypress/support/e2e.ts`: E2E 테스트 지원
- `cypress/support/commands.ts`: 커스텀 명령어

### Storybook 설정
- `.storybook/main.ts`: Storybook 메인 설정
- `.storybook/preview.ts`: 프리뷰 설정 및 글로벌 데코레이터

## 📊 커버리지 목표

- **라인 커버리지**: 80% 이상
- **브랜치 커버리지**: 75% 이상  
- **함수 커버리지**: 85% 이상
- **명령문 커버리지**: 80% 이상
- **라인 커버리지**: 85% 이상
- **브랜치 커버리지**: 80% 이상

## 🐛 디버깅 팁

### Jest 테스트 디버깅
```bash
# 특정 테스트 파일만 실행
npm test -- Card.test.tsx

# 디버그 모드로 실행
npm test -- --debug
```

### Cypress 테스트 디버깅
```bash
# 특정 테스트만 실행
npx cypress run --spec "cypress/e2e/card.cy.ts"

# 브라우저 지정
npx cypress run --browser chrome
```

## 📈 CI/CD 통합

### GitHub Actions 예제
```yaml
name: Frontend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

## 🎯 모범 사례

1. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 함
2. **의미있는 테스트명**: 테스트가 무엇을 검증하는지 명확히 명시
3. **적절한 모킹**: 외부 의존성은 적절히 모킹
4. **시각적 회귀**: Storybook을 활용한 시각적 변화 감지
5. **성능 모니터링**: 애니메이션과 상호작용 성능 지속 감시

## 🔮 향후 확장 계획

- [ ] Visual Regression Testing 추가
- [ ] A11y 자동화 테스트 강화
- [ ] Performance Budget 설정
- [ ] Cross-browser 테스트 확장
