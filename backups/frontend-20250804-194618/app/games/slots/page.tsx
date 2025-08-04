'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';

import SlotMachine from '../../../components/games/slot/SlotMachine';

import '../../../styles/slot-popup.css';

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">코스믹 포츈 로딩 중...</p>
      </div>
    </div>
  );
}

// 코스믹 포츈 슬롯 게임 페이지
function CosmicFortuneGamePage() {
  return (
    <div className="slot-popup-compact w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] to-[var(--color-primary-dark-navy)] relative" style={{ minHeight: 'calc(100vh + 240px)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--color-accent-purple)] 
        rounded-full mix-blend-multiply filter blur-xl animate-blob pointer-events-none"></div>
        <div className="absolute top-30 right-10 w-72 h-72 bg-[var(--color-accent-blue)] 
        rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[var(--color-accent-amber)] 
        rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 pointer-events-none"></div>
      </div>

      {/* Page Header - 랜덤뽑기 페이지와 동일한 구조 */}
      <motion.header
        className="z-20 py-2 sm:py-3 px-3 sm:px-5 bg-gradient-to-br from-[var(--color-primary-dark-navy)]/80 via-[var(--color-primary-charcoal)]/80 to-[var(--color-primary-dark-navy)]/80 backdrop-blur-md border-b border-[var(--border)]/20"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-1">
          <motion.p 
            className="text-base sm:text-lg text-[var(--color-text-secondary)] font-medium text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            우주에서 가장 스릴 넘치는 슬롯 머신
          </motion.p>
        </div>
      </motion.header>

      {/* Main Game Container - 상용 미니앱 스타일 */}
      <main className="px-4 py-4 w-full flex flex-col items-center">
        <div className="w-full flex flex-col items-center justify-center">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <SlotMachine />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// 메인 익스포트
export default function SlotsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CosmicFortuneGamePage />
    </Suspense>
  );
}