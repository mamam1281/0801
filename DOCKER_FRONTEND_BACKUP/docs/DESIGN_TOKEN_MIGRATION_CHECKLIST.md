# 🎨 디자인 토큰 기반 Tailwind CSS 시스템 구축 체크리스트

## 📋 프로젝트 개요
- **목표**: 완전한 디자인 토큰 기반의 Tailwind CSS 시스템 구축
- **범위**: globals.css → tailwind.config.js 동기화 및 컴포넌트 리팩토링
- **시작일**: 2025년 6월 24일

---

## ✅ 1단계: 기본 인프라 구축 (완료)

### 1.1 globals.css 디자인 토큰 시스템 완성
- [x] **색상 시스템**: primary, secondary, accent, semantic colors 완전 정의
- [x] **간격 시스템**: spacing 0-32까지 완전 정의 (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32)
- [x] **폰트 시스템**: font-size, line-height, font-weight 완전 정의
- [x] **레이아웃 시스템**: width, height, padding, margin, gap 변수 완전 정의
- [x] **그림자 시스템**: box-shadow 모든 변수 정의
- [x] **브레이크포인트**: 반응형 변수 완전 정의
- [x] **애니메이션**: transition, timing 변수 정의

### 1.2 최신 UI/UX 트렌드 유틸리티 클래스 추가
- [x] **glassmorphism-dark**: 다크 모드 글래스모피즘
- [x] **ice-glassmorphism**: 아이스 글래스 효과
- [x] **neumorphism**: 뉴모피즘 스타일
- [x] **frostmorphism**: 프로스트 글래스 효과
- [x] **metallic-glass**: 메탈릭 글래스 효과
- [x] **brutalism**: 브루털리즘 디자인
- [x] **blurry-gradient-blob**: 블러 그라데이션 blob 효과

### 1.3 tailwind.config.js 완전 동기화
- [x] **colors**: 모든 CSS 변수를 var(--...) 형태로 매핑
- [x] **spacing**: globals.css와 100% 일치
- [x] **fontSize**: lineHeight 배열 형태로 완전 동기화
- [x] **borderRadius**: 모든 radius 변수 매핑
- [x] **boxShadow**: 모든 shadow 변수 매핑
- [x] **width/height**: 레이아웃 크기 변수 완전 매핑
- [x] **screens**: 브레이크포인트 변수 동기화
- [x] **중복 제거**: 불필요한 커스텀 단위 제거

---

## 🔄 2단계: 컴포넌트 리팩토링 (진행 중)

### 2.1 주요 컴포넌트 파일 현황 파악
- [x] **컴포넌트 디렉토리 구조 확인**: `/components/ui/` 하위 구조
- [x] **[var(--...)] 사용 현황 조사**: grep_search로 전체 스캔 완료
- [x] **우선순위 컴포넌트 식별**: Input, Card, GameCard, Button, AppHeader 등

### 2.2 Input.tsx 리팩토링
- [x] **현재 파일 분석**: [var(--...)] 사용 위치 확인
- [x] **Tailwind 클래스 변환**: 
  - [x] `h-[var(--input-height-md)]` → `h-input-md`
  - [x] `text-[var(--foreground)]` → `text-foreground`
  - [x] `border-[var(--border)]` → `border-border`
  - [x] `duration-[var(--transition-normal)]` → `duration-normal`
  - [x] `text-[var(--muted-foreground)]` → `text-muted-foreground`
  - [x] `rounded-[var(--radius-md)]` → `rounded-md`
  - [x] `bg-[var(--input)]` → `bg-input`
  - [x] `text-[var(--color-neutral-medium)]` → `text-neutral-medium`
  - [x] `bg-gradient-to-r from-[var(--color-purple-primary)]` → `bg-gradient-purple-primary`
  - [x] 기타 모든 변수 구문 변환 완료
- [x] **스타일 검증**: 변환 후 시각적 확인 필요

### 2.3 Card.tsx 리팩토링
- [x] **현재 파일 분석**: [var(--...)] 사용 위치 확인
- [x] **Tailwind 클래스 변환**: 모든 변수 구문 → Tailwind 유틸리티
- [x] **스타일 검증**: 변환 후 시각적 확인

### 2.4 GameCard.tsx 리팩토링
- [x] **현재 파일 분석**: [var(--...)] 사용 위치 확인
- [x] **Tailwind 클래스 변환**: 모든 변수 구문 → Tailwind 유틸리티
- [x] **스타일 검증**: 변환 후 시각적 확인

### 2.5 Button.tsx 리팩토링
- [x] **현재 파일 분석**: [var(--...)] 사용 위치 확인
- [x] **Tailwind 클래스 변환**: 모든 변수 구문 → Tailwind 유틸리티
- [x] **스타일 검증**: 변환 후 시각적 확인

### 2.6 AppHeader.tsx 리팩토링
- [x] **현재 파일 분석**: [var(--...)] 사용 위치 확인
- [x] **Tailwind 클래스 변환**: 모든 변수 구문 → Tailwind 유틸리티
- [x] **스타일 검증**: 변환 후 시각적 확인

### 2.7 기타 컴포넌트 리팩토링
- [x] **Avatar.stories.tsx**: [var(--...)] → Tailwind 클래스
- [ ] **BottomNavigationBar.tsx**: [var(--...)] → Tailwind 클래스
- [ ] **Modal.tsx**: [var(--...)] → Tailwind 클래스
- [ ] **Toast.tsx**: [var(--...)] → Tailwind 클래스
- [ ] **기타 발견된 컴포넌트들**: 필요에 따라 추가

---LoadingSpinner / ProgressLoader / QuickStartItem/ Radiobutton/ Tabs/ SettingsDemo/ TabsDemo 등

## 🔍 3단계: 품질 보증 및 최종 검증

### 3.1 디자인 토큰 일관성 검증
- [ ] **globals.css vs tailwind.config.js**: 모든 변수 매핑 재확인
- [ ] **누락된 변수 점검**: 컴포넌트 리팩토링 중 발견된 추가 변수 반영
- [ ] **중복/충돌 제거**: 최종 중복 변수 정리

### 3.2 개발 환경 테스트
- [ ] **npm run dev**: 개발 서버 정상 구동 확인
- [ ] **빌드 테스트**: `npm run build` 오류 없음 확인
- [ ] **Tailwind 컴파일**: CSS 정상 생성 확인

### 3.3 시각적 검증
- [ ] **주요 페이지 렌더링**: 홈, 게임, 프로필 등 주요 페이지 확인
- [ ] **반응형 테스트**: 모바일/태블릿/데스크톱 반응형 정상 동작
- [ ] **다크모드 테스트**: 다크모드 전환 정상 동작
- [ ] **애니메이션 테스트**: hover, focus, transition 애니메이션 정상 동작

### 3.4 최신 UI/UX 트렌드 적용 확인
- [ ] **glassmorphism 효과**: 실제 컴포넌트에서 정상 동작
- [ ] **neumorphism 효과**: 실제 컴포넌트에서 정상 동작
- [ ] **기타 트렌드 효과**: frostmorphism, metallic-glass, brutalism 등

---

## 📊 진행률 요약

| 단계 | 작업 항목 | 완료 | 진행률 |
|------|-----------|------|--------|
| 1단계 | 기본 인프라 구축 | ✅ | 100% |
| 2단계 | 컴포넌트 리팩토링 | 🔄 | 20% |
| 3단계 | 품질 보증 및 검증 | ⏳ | 0% |
| **전체** | **프로젝트 완성도** | **🔄** | **40%** |

---

## 🚨 주의사항

### 필수 준수 사항
- [x] **변수 이름 정확성**: CSS 변수명과 Tailwind 클래스명 정확히 매칭
- [x] **타이포그래피 일관성**: fontSize의 lineHeight 배열 형태 유지
- [x] **브레이크포인트 동기화**: screens 설정과 globals.css 완전 일치
- [ ] **컴포넌트 무결성**: 리팩토링 후 기능 손상 없음 보장

### 피해야 할 것
- ❌ **하드코딩된 값**: 임의의 픽셀값, 색상 코드 사용 금지
- ❌ **불완전한 변환**: [var(--...)] 구문 일부만 변환하는 것 금지
- ❌ **디자인 토큰 무시**: globals.css에 정의되지 않은 값 사용 금지

---

## 📝 다음 단계
1. **Input.tsx 리팩토링 시작** (2단계 첫 번째 작업)
2. 각 컴포넌트별 체계적 변환 진행
3. 실시간 검증 및 수정사항 반영

---

**최종 업데이트**: 2025년 6월 24일
**담당자**: AI Assistant
**프로젝트**: CC-WEBAPP Frontend Design System Migration
