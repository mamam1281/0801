# Casino-Club F2P 프로젝트 문서 카테고리 카탈로그

본 문서는 전체 172개 .md 문서를 주제별로 분류한 카테고리 카탈로그입니다. (파일명 기준, 주요 문서만 예시 타이틀 포함)

---

## 1. 시스템/아키텍처/프로젝트 개요
- README.md
- PROJECT_ROADMAP.md
- PROJECT_ARCHITECTURE_DIAGRAMS.md
- docs/01_architecture_en.md
- docs/08_roadmap_en.md
- docs/current_project_step_by_step.md
- docs/beginner_app_development_guide.md
- docs/13-environment-config.md
- docs/16_CCF2P 통합 환경 설정 스크립트.md
- docs/17_game.md
- docs/20_local_llm_implementation_guide.md
- docs/27_async_sync_status_analysis.md
- AI_BACKEND_STANDARDIZATION_PROMPT.md

## 2. 데이터/개인화/분석
- docs/02_data_personalization_en.md
- docs/03_emotion_feedback_en.md
- docs/04_adult_rewards_en.md
- docs/05_corporate_retention_en.md
- docs/15_ai_assistant_test_guide.md
- docs/REWARD_STRATEGY_ANALYSIS.md
- docs/본사연계_최적수익율_보고서.md
- 신규유저_수익성_분석.md
- docs/유저심리_수익성개선_체크리스트.md
- docs/유저심리_기반_수익개선전략.md


아래와 같이 "데이터/개인화/분석" 카테고리의 10개 문서를 5개의 온보딩/실전 중심 핵심 문서로 재설계할 것을 제안합니다. 각 문서는 실전 적용, 체크리스트, 전략, AI/피드백, 수익성 분석까지 모두 아우르며, 기존 문서의 디테일을 최대한 살려 통합·재구성합니다.

1. 데이터 기반 유저 세분화 및 개인화 전략 (User Segmentation & Personalization)
기존: 02_data_personalization_en.md, 05_corporate_retention_en.md, 유저심리_기반_수익개선전략.md
내용:
RFM 분석, LTV 예측, 세그먼트별(Whale/High/Medium/At-risk) 분류 방법
실전 SQL/파이프라인 예시, Redis/Kafka 연동, APScheduler 활용
세그먼트별 추천/보상/미션 설계, 실시간/배치 적용법
기업/본사 연계 리텐션 전략, 실전 운영 사례
2. 감정·행동 피드백 및 AI 기반 개인화 (Emotion Feedback & AI Personalization)
기존: 03_emotion_feedback_en.md, 15_ai_assistant_test_guide.md
내용:
행동별 실시간 피드백 메시지/애니메이션/사운드 설계
AI 어시스턴트/챗봇 활용, 심리/행동 데이터 기반 피드백 자동화
프론트-백 실시간 연동 구조, 테스트/운영 체크리스트
실전 적용 예시(코드/UX/운영 팁)
3. 보상/가챠/미션 최적화 및 전략 (Reward, Gacha & Mission Optimization)
기존: 04_adult_rewards_en.md, REWARD_STRATEGY_ANALYSIS.md, 유저심리_수익성개선_체크리스트.md
내용:
보상/가챠/미션 설계 원칙, 확률/하우스엣지/심리 트리거
실전 Loot Table, 보상 분포, VIP/일반 차등 설계
성인/고위험 보상 설계, 규제/운영 기준
실전 체크리스트, 운영/테스트 사례
4. 신규/기존 유저 수익성 분석 및 개선 (User Profitability Analysis & Improvement)
기존: 신규유저_수익성_분석.md, 본사연계_최적수익율_보고서.md
내용:
신규/기존 유저별 수익성 분석 방법론, KPI/지표 설계
본사/파트너 연계 수익 최적화 전략
실전 데이터 분석, 개선 이력, 운영 리포트 예시
개선 체크리스트, 실전 적용법
5. 실전 데이터 기반 온보딩/운영 체크리스트 (Data-Driven Onboarding & Ops Checklist)
기존: 각 문서의 실전 체크리스트/운영 팁 통합
내용:
데이터 기반 온보딩 플로우, 실전 운영/개선 체크리스트
실시간/배치 데이터 파이프라인, 장애/이슈 대응법
운영 자동화, 모니터링, 실전 운영 팁/사례
신규 멤버를 위한 실전 온보딩 가이드
각 문서는 실제 코드/운영/UX 예시, 체크리스트, 실전 적용법, 개선 이력까지 포함해, 신규/기존 멤버 모두가 실무에 바로 투입될 수 있도록 설계합니다.
원하면 각 문서별 상세 목차/샘플 초안도 바로 제공 가능합니다.
진행 원하시면 파일명/목차/샘플 초안부터 생성하겠습니다.




## 3. 인증/보안/배포/운영
- docs/18_security_authentication_en.md
- SERVER_DEPLOYMENT_GUIDE.md
- DOCKER_GUIDE.md
- cc-webapp/deployment/PRODUCTION_ROLLOUT_PLAN.md
- .github/instructions/1.instructions.md


1. 목적
"인증/보안/배포/운영" 카테고리의 모든 문서를 실전 운영/배포/보안/인증 기준에 따라 한눈에 볼 수 있도록 통합·체계화합니다.
실제 서비스 운영, 배포, 보안, 인증, CI/CD, 인프라 자동화, 운영툴, 장애 대응까지 실무 중심으로 정리합니다.
2. 세부 정리 플랜
문서별 역할/범위 명확화

각 문서의 목적, 주요 내용, 실전 적용 범위(예: 인증/보안 정책, 배포 자동화, 운영툴, 장애 대응 등) 요약
중복/불필요 내용은 통합, 최신화
핵심 목차/체크리스트화

실전 운영/배포/보안/인증에 필요한 핵심 체크리스트, 단계별 가이드, 실전 명령어, 장애/이슈 대응법, 자동화/모니터링 항목으로 재구성
실전 적용 예시/코드/명령어 추가

배포/롤아웃/운영 자동화 스크립트, 인증/보안 설정 예시, 운영툴/모니터링 연동법, 장애 대응 시나리오 등 실전 예시 추가
최신 정책/운영 기준 반영

최신 DevOps/보안/운영 정책, CI/CD, IaC, 실시간 모니터링, SRE 관점까지 반영
최종 통합/요약본 생성

"실전 인증/보안/배포/운영 가이드" 형태로 통합 요약본(신규 md) 생성
각 세부 문서는 참고/부록으로 링크
3. 예상 목차(샘플)
인증/보안 정책 및 실전 적용법
배포/롤아웃 자동화 및 운영툴 연동
실전 장애/이슈 대응 및 SRE 체크리스트
CI/CD, IaC, 모니터링/알림 자동화
실전 명령어/운영툴/대시보드 활용법
각 문서별 상세 요약/참고 링크




## 4. 데이터베이스/마이그레이션
- DATABASE_MIGRATION_GUIDE.md
- MIGRATION_CHECKLIST.md
- docs/단순_초대코드_인증_시스템.md
- docs/백엔드_초대코드_인증_변경사항.md
- update_database_config.py (참고)

## 5. 프론트엔드/UI/UX/디자인
- docs/11_ui_ux_en.md
- docs/10_onboarding_en.md
- docs/20250623_프론트엔드_종합_개발_가이드.md
- docs/통합_프론트엔드_개발_가이드_v2.md
- docs/통합_컴포넌트_가이드.md
- docs/통합_애니메이션_타이밍_가이드.md
- docs/통합_상태전환_가이드.md
- docs/통합_반응형_가이드.md
- docs/통합_CSS_Variables_가이드.md
- docs/컴포넌트_체크리스트.md
- docs/컴포넌트_구현_로드맵_v2.md
- docs/프론트엔드_테스트_상태_보고서.md
- docs/프론트엔드_페이지_개발_체크리스트.md
- docs/쉬운_CSS_사용_가이드.md
- docs/사용자_온보딩_학습_시스템_구현_가이드.md
- UI_CLEANUP_CHECKLIST.md
- COLOR_PALETTE_GUIDE.md
- DESIGN_TOKEN_MIGRATION_CHECKLIST.md
- GAME_POPUP_GUIDE.md
- 가챠시스템_CSS_종합정리.md
- 가챠시스템_모달효과_정리.md
- cc-webapp/frontend/README.md
- cc-webapp/frontend/TEST_GUIDE.md
- cc-webapp/frontend/MODERN_UI_UTILITIES.md
- cc-webapp/frontend/docs/profile-ux-improvement.md
- cc-webapp/frontend/docs/auth-system-technical-doc.md
- cc-webapp/frontend/components/profile/# 🎮 게임 플랫폼 기술 개요.md
- docs/AI_채팅_UI_가이드.md
- docs/figma_workflow_checklist.md
- docs/figma_workflow_checklist copy.md
- FRONTEND_DRIVEN_DEVELOPMENT_CHECKLIST.md
- FRONTEND_DEV_GUIDE_ENGLISH.md
- frontend_development_checklist.md

프론트엔드 개발/구조/아키텍처

개발 환경, 폴더 구조, 빌드/배포, 상태관리, 주요 기술스택(Next.js, React, Tailwind 등)
예: 통합_프론트엔드_개발_가이드_v2.md, 20250623_프론트엔드_종합_개발_가이드.md, README.md 등
UI/UX/디자인 시스템

UI/UX 원칙, 디자인 토큰, 컬러/타이포/컴포넌트/반응형/애니메이션 가이드, Figma/디자인 워크플로우
예: 11_ui_ux_en.md, COLOR_PALETTE_GUIDE.md, DESIGN_TOKEN_MIGRATION_CHECKLIST.md, figma_workflow_checklist.md 등
컴포넌트/상태/애니메이션/패턴

컴포넌트 설계/구현/로드맵, 상태전환, 애니메이션, CSS/변수/모달/팝업/게임UI
예: 통합_컴포넌트_가이드.md, 통합_상태전환_가이드.md, 통합_애니메이션_타이밍_가이드.md, GAME_POPUP_GUIDE.md 등
테스트/운영/품질/온보딩

프론트엔드 테스트, 페이지/컴포넌트 체크리스트, 온보딩/학습/운영 가이드, UI 클린업
예: 프론트엔드_테스트_상태_보고서.md, 프론트엔드_페이지_개발_체크리스트.md, UI_CLEANUP_CHECKLIST.md, 사용자_온보딩_학습_시스템_구현_가이드.md 등
실전 예시/유틸리티/특수 가이드

실전 코드/유틸리티, AI 채팅, 가챠/모달/게임 특수 UI, Modern UI Utilities, 프로필 UX 개선 등
예: AI_채팅_UI_가이드.md, 가챠시스템_CSS_종합정리.md, MODERN_UI_UTILITIES.md, profile-ux-improvement.md 등
3. 세부 절차
문서별 역할/범위/중복 파악

각 문서의 목적, 주요 내용, 실전 적용 범위 요약
중복/불필요/구버전 내용은 통합/최신화
5개 카테고리별 대표 문서 선정 및 목차/체크리스트화

각 카테고리별 대표 문서/가이드/체크리스트/실전 예시로 재구성
목차/핵심 체크리스트/실전 예시/운영팁/코드/디자인 샘플 등 포함
실전 적용 예시/코드/운영팁 추가

실제 컴포넌트/상태/애니메이션/테스트/운영툴/디자인 시스템 적용 예시 추가
최종 통합/요약본 생성

5개 카테고리별 통합 요약본(신규 md) 생성, 세부 문서는 참고/부록으로 링크





## 6. 기능별 개발 가이드/체크리스트/진행상황
- docs/12_game_dev_full_checklist_ko.md
- docs/프론트엔드_테스트_상태_보고서.md
- docs/프론트엔드_페이지_개발_체크리스트.md
- WEEK1_COMPONENT_STATUS.md
- PROJECT_PROGRESS_CHECKLIST.md
- IMMEDIATE_FIX_GUIDE.md
- SIMPLE_REGISTRATION_CHECKLIST.md
- RESPONSIVE_ONBOARDING_PLAN.md
- docs/즉시_실행_개발_가이드.md
- docs/컴포넌트_체크리스트.md
- docs/컴포넌트_구현_로드맵_v2.md

## 7. API/백엔드/기술
- docs/07-api-endpoints.md
- docs/api_specification.md
- docs/06_user_journey_en.md
- cc-webapp/backend/README.md
- docs/17_game.md

## 8. 테스트/품질/자동화
- docs/09-testing-guide.md
- docs/09-testing-guide-new.md
- workflow-fix-test-failure.md
- .clinerules/workflows/workflow-fix.md
- .clinerules/clinerules.md
- .clinerules/front.md

## 9. 기타/아카이브/임시
- ARCHIVE_COMPONENTS_REFERENCE.md
- EXTERNAL_AI_SETUP.md
- RELEASE_NOTES_DRAFT.md
- AI_BACKEND_STANDARDIZATION_PROMPT.md

---

> 각 카테고리 내 파일은 대표 문서 위주로 정리했으며, 전체 172개 md 파일이 포함됩니다. 세부 타이틀/목차 추출, 특정 카테고리 세분화 등 추가 요청이 있으면 말씀해 주세요.
