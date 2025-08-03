'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import RouletteGame from '../../../components/games/roulette/RouletteGame';

function RouletteMainContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] 
      to-[var(--color-primary-dark-navy)] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-amber)] mx-auto mb-3"></div>
          <p className="text-[var(--text-secondary)] text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] 
    to-[var(--color-primary-dark-navy)] min-h-screen flex flex-col">
      
      {/* 헤더 */}
      <motion.header
        className="z-20 py-4 sm:py-6 px-4 sm:px-6 w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)]/90 via-[var(--color-primary-charcoal)]/90 to-[var(--color-primary-dark-navy)]/90 backdrop-blur-md border-b border-[var(--border)]/30"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-3">
          <motion.h1
            className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[var(--color-accent-red)] 
            via-[var(--color-accent-amber)] to-[var(--color-accent-red)] bg-clip-text text-transparent text-center tracking-wide"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            🎰 경품추첨 룰렛
          </motion.h1>
          <motion.p 
            className="text-[var(--text-secondary)] text-sm sm:text-base text-center max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            매일 3번까지 무료로 경품을 추첨해보세요! <br className="sm:hidden"/>
            <span className="text-[var(--color-accent-amber)]">코인, 젬, 잭팟까지</span> 다양한 보상이 기다리고 있습니다.
          </motion.p>
        </div>
      </motion.header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 relative">
        {/* 배경 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[var(--color-accent-amber)]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-[var(--color-accent-red)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <motion.div
          className="w-full max-w-2xl relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <RouletteGame />
        </motion.div>
        
        {/* 추가 정보 카드 */}
        <motion.div
          className="mt-12 max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* 오늘의 경품 */}
          <div className="bg-gradient-to-br from-[var(--color-primary-charcoal)]/60 to-[var(--color-primary-dark-navy)]/60 
          backdrop-blur-sm p-6 rounded-2xl border border-[var(--border)]/30 text-center">
            <h3 className="text-xl font-semibold text-[var(--color-accent-amber)] mb-4 flex items-center justify-center gap-2">
              🏆 <span>오늘의 경품</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">🪙 코인</span>
                <span className="text-[var(--text-primary)] font-semibold">100-1000개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">💎 젬</span>
                <span className="text-[var(--text-primary)] font-semibold">10-50개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">🎰 잭팟</span>
                <span className="text-[var(--color-accent-red)] font-bold">젬 200개!</span>
              </div>
            </div>
          </div>
          
          {/* 게임 규칙 */}
          <div className="bg-gradient-to-br from-[var(--color-primary-charcoal)]/60 to-[var(--color-primary-dark-navy)]/60 
          backdrop-blur-sm p-6 rounded-2xl border border-[var(--border)]/30 text-center">
            <h3 className="text-xl font-semibold text-[var(--color-accent-amber)] mb-4 flex items-center justify-center gap-2">
              📋 <span>게임 규칙</span>
            </h3>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>• 매일 3번 무료 스핀</p>
              <p>• 자정에 횟수 초기화</p>
              <p>• 확률은 투명하게 공개</p>
              <p>• 즉시 보상 지급</p>
            </div>
          </div>
          
          {/* 통계 */}
          <div className="bg-gradient-to-br from-[var(--color-primary-charcoal)]/60 to-[var(--color-primary-dark-navy)]/60 
          backdrop-blur-sm p-6 rounded-2xl border border-[var(--border)]/30 text-center">
            <h3 className="text-xl font-semibold text-[var(--color-accent-amber)] mb-4 flex items-center justify-center gap-2">
              📊 <span>확률 정보</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">코인 100개</span>
                <span className="text-green-400 font-semibold">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">젬 10개</span>
                <span className="text-blue-400 font-semibold">18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">잭팟</span>
                <span className="text-[var(--color-accent-red)] font-bold">1.5%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 푸터 */}
      <motion.footer
        className="text-center py-4 text-[var(--text-secondary)] text-xs border-t border-[var(--border)]/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        매일 자정에 스핀 횟수가 초기화됩니다
      </motion.footer>
    </div>
  );
}

export default function RoulettePage() {
  return <RouletteMainContent />;
}