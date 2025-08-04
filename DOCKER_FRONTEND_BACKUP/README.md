# Docker Frontend Environment Backup

## 🗂️ 백업 내용

이 폴더는 완전한 프론트엔드 재구축을 위한 핵심 설정 파일들을 백업한 것입니다.

### 📁 config/ 
- `package.json` - Next.js 15.4.5 + React 19.1.0 + TypeScript 5 + Tailwind CSS 4 종속성
- `next.config.js` - 완전 최적화된 Next.js 설정 (Turbopack, 이미지 최적화, 보안 헤더)
- `tsconfig.json` - TypeScript 설정 (경로 매핑 포함)
- `tailwind.config.ts` - Tailwind CSS 4 설정 (네온/카지노 테마, 애니메이션)
- `Dockerfile` - 프론트엔드 컨테이너 빌드 설정

### 📁 docs/
- `DOCKER_DEVELOPMENT_GUIDE.md` - Docker 개발 환경 가이드
- `COLOR_PALETTE_GUIDE.md` - 색상 팔레트 가이드  
- `DESIGN_TOKEN_MIGRATION_CHECKLIST.md` - 디자인 토큰 마이그레이션 체크리스트
- `FRONTEND_DEPENDENCIES_DOCUMENTATION.md` - 프론트엔드 종속성 문서
- `ENVIRONMENT_DEPLOYMENT_GUIDE.md` - 환경 배포 가이드

## 🎯 사용 목적

혼재된 프론트엔드 파일로 인한 빌드 실패 문제를 해결하기 위해:

1. ✅ **설정 파일 백업 완료** - 핵심 Docker 환경 설정 보존
2. ⏳ **프론트엔드 폴더 삭제 대기** - 기존 혼재 파일 제거
3. ⏳ **완성된 프론트엔드 교체 대기** - 새로운 완성 폴더로 교체

## 🚨 중요 사항

- **디자인 변경 금지**: 기존 CSS 변수와 Tailwind 설정 그대로 유지
- **환경 호환성**: Docker Compose 환경에서 정상 작동하도록 설정
- **종속성 버전**: 정확한 패키지 버전 정보 보존

## 📋 복원 시 체크리스트

- [ ] package.json 종속성 설치: `npm install`
- [ ] TypeScript 경로 매핑 확인
- [ ] Tailwind CSS 4 설정 적용
- [ ] Docker 빌드 테스트
- [ ] 개발 서버 실행 확인: `npm run dev`

---
*백업 생성일: 2025-01-30*
*기존 시스템과 아침 커밋 혼재 문제 해결을 위한 클린 환경 구축*
