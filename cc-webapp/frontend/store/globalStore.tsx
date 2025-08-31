// Legacy shim module: ensure imports from '@/store/globalStore' always resolve to the .ts implementation.
// 이유: 동일 경로의 .ts/.tsx 공존 시 번들러가 .tsx를 우선 해석하여
// mergeProfile/applyPurchase/mergeGameStats 등 export 미존재 오류가 발생.
// 해결: 이 파일을 얇은 re-export로 전환해 실제 구현(globalStore.ts)을 사용하도록 고정.
export * from './globalStore';
