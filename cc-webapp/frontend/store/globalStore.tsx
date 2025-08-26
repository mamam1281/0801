// NOTE: 중복 파일 방지용 TSX 래퍼. 실제 구현은 옆의 TypeScript 모듈(globalStore.ts)에 있습니다.
// Next.js의 모듈 해석이 .tsx를 우선 선택하는 경우가 있어, 본 파일은 명시적 재수출만 수행합니다.
// 주의: .ts 구현 파일을 확장자까지 명시해 직접 재수출(자기 참조 방지)
export * from './globalStore.ts';
