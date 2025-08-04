'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

interface Prize {
  id: string;
  name: string;
  value: number;
  color: string;
  probability: number;
  icon?: string;
}

interface PrizeRouletteSpinResult {
  success: boolean;
  prize?: Prize;
  message: string;
  spins_left: number;
  cooldown_expires?: string;
  is_near_miss?: boolean;
  animation_type?: 'normal' | 'jackpot' | 'near_miss';
}

interface PrizeRouletteProps {
  className?: string;
}

const PRIZES: Prize[] = [
  { id: "coins_100", name: "코인 100개", value: 100, color: "#FFD700", probability: 0.35, icon: "🪙" },
  { id: "coins_500", name: "코인 500개", value: 500, color: "#FF8C00", probability: 0.25, icon: "🪙" },
  { id: "gems_10", name: "젬 10개", value: 10, color: "#00CED1", probability: 0.2, icon: "💎" },
  { id: "gems_50", name: "젬 50개", value: 50, color: "#9370DB", probability: 0.1, icon: "💎" },
  { id: "special_item", name: "특별 아이템", value: 0, color: "#FF69B4", probability: 0.085, icon: "🎁" },
  { id: "jackpot", name: "잭팟! 젬 200개", value: 200, color: "#FF0080", probability: 0.015, icon: "🎰" },
  { id: "bonus", name: "보너스 스핀", value: 1, color: "#00FF88", probability: 0.005, icon: "🎁" }
];

function PrizeRouletteInner({ className = '' }: PrizeRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [lastResult, setLastResult] = useState<PrizeRouletteSpinResult | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [spinHistory, setSpinHistory] = useState<Prize[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration 문제 해결을 위한 마운트 체크
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 사용자 정보 가져오기
  const fetchRouletteInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/roulette/info');
      const data = await response.json();
      
      if (data.success) {
        setSpinsLeft(data.spins_left || 3);
        
        // 로컬 스토리지에서 히스토리 불러오기
        const savedHistory = localStorage.getItem('roulette_history');
        if (savedHistory) {
          setSpinHistory(JSON.parse(savedHistory));
        }
      }
    } catch (error) {
      console.error('Failed to fetch roulette info:', error);
      // 백업으로 로컬 스토리지 사용
      const savedSpins = localStorage.getItem('roulette_spins_left');
      if (savedSpins) {
        setSpinsLeft(parseInt(savedSpins));
      } else {
        setSpinsLeft(3);
        localStorage.setItem('roulette_spins_left', '3');
      }
    }
  }, []);

  // 룰렛 스핀 함수
  const spinRoulette = useCallback(async () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    
    // 랜덤 회전각 계산 (3~5바퀴 + 랜덤 각도)
    const spins = 3 + Math.random() * 2; // 3~5바퀴
    const finalAngle = Math.random() * 360; // 0~360도
    const totalRotation = rotation + (spins * 360) + finalAngle;
    
    setRotation(totalRotation);

    try {
      const response = await fetch('/api/roulette/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      // 3초 후 결과 표시
      setTimeout(() => {
        setIsSpinning(false);
        setLastResult(result);
        setSpinsLeft(result.spins_left);
        setShowResultModal(true);
        
        // 히스토리 업데이트
        if (result.prize) {
          const newHistory = [result.prize, ...spinHistory.slice(0, 4)];
          setSpinHistory(newHistory);
          localStorage.setItem('roulette_history', JSON.stringify(newHistory));
        }
        
        // 로컬 스토리지 업데이트
        localStorage.setItem('roulette_spins_left', result.spins_left.toString());
      }, 3000);
      
    } catch (error) {
      console.error('Spin failed:', error);
      setIsSpinning(false);
      setLastResult({
        success: false,
        message: '스핀에 실패했습니다. 다시 시도해주세요.',
        spins_left: spinsLeft - 1
      });
      setSpinsLeft(prev => Math.max(0, prev - 1));
    }
  }, [isSpinning, spinsLeft, rotation, spinHistory]);

  // 결과 모달 닫기
  const closeResultModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  useEffect(() => {
    fetchRouletteInfo();
  }, [fetchRouletteInfo]);

  // Hydration 문제 방지 - 클라이언트에서만 렌더링
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-3"></div>
          <p className="text-slate-300 text-sm">룰렛 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] 
    to-[var(--color-primary-dark-navy)] min-h-screen flex flex-col items-center">
      
      {/* 헤더 - 다른 게임들과 완전히 동일한 패턴 */}
      <motion.header
        className="z-20 py-4 sm:py-6 px-4 sm:px-6 w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)]/90 via-[var(--color-primary-charcoal)]/90 to-[var(--color-primary-dark-navy)]/90 backdrop-blur-md border-b border-[var(--border)]/30"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2">
          <motion.h1
            className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[var(--color-accent-amber)] 
            via-[var(--color-accent-yellow)] to-[var(--color-accent-amber)] bg-clip-text text-transparent text-center tracking-wide"
            whileHover={{ scale: 1.02 }}
          >
            🎰 프라이즈 룰렛
          </motion.h1>
          <motion.p 
            className="text-[var(--text-secondary)] text-center text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            매일 3번까지 무료로 다양한 보상을 획득하세요!
          </motion.p>
        </div>
      </motion.header>

      {/* 메인 게임 영역 - 더 넓고 여유있게 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 relative">
        <motion.div
          className="glass-card p-6 max-w-4xl w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 스핀 정보 - 더 강조 */}
          <div className="mb-8">
            <motion.div 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/30 via-amber-500/20 to-purple-600/30 
              px-6 py-3 rounded-2xl border border-amber-400/40 backdrop-blur-md shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251,191,36,0.4)" }}
              animate={{ 
                boxShadow: spinsLeft === 0 ? ["0 0 20px rgba(239,68,68,0.4)", "0 0 30px rgba(239,68,68,0.6)", "0 0 20px rgba(239,68,68,0.4)"] : "0 0 20px rgba(251,191,36,0.3)"
              }}
              transition={{ duration: 1, repeat: spinsLeft === 0 ? Infinity : 0 }}
            >
              <motion.span 
                className="text-2xl"
                animate={{ rotate: isSpinning ? 360 : 0 }}
                transition={{ duration: 2, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
              >
                🎲
              </motion.span>
              <div className="text-center">
                <div className="text-amber-400 font-bold text-lg">남은 스핀</div>
                <div className={`font-black text-2xl ${spinsLeft === 0 ? 'text-red-400' : 'text-white'}`}>
                  {spinsLeft}/3
                </div>
              </div>
            </motion.div>
          </div>

          {/* 룰렛 휠 - 훨씬 더 크게 */}
          <div className="flex justify-center items-center mb-8">
            <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]">
              {/* 포인터 - 휠 바로 위에 */}
              <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 z-20">
                <motion.div
                  animate={{ 
                    scale: isSpinning ? [1, 1.2, 1] : 1,
                    y: isSpinning ? [0, -5, 0] : 0
                  }}
                  transition={{ 
                    duration: 0.3,
                    repeat: isSpinning ? Infinity : 0 
                  }}
                >
                  <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[30px] 
                  border-l-transparent border-r-transparent border-b-amber-400 
                  drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)] filter brightness-110">
                  </div>
                </motion.div>
              </div>

              {/* 외부 링과 그림자 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-accent-amber)] via-yellow-400 to-[var(--color-accent-red)] p-2 shadow-2xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative shadow-inner"
                style={{
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 0 50px rgba(251,191,36,0.3)'
                }}>
                  
                  {/* 간단한 CSS 기반 룰렛 휠 */}
                  <motion.div
                    className="w-full h-full relative rounded-full overflow-hidden"
                    animate={{ rotate: rotation }}
                    transition={{ 
                      duration: isSpinning ? 3 : 0, 
                      ease: isSpinning ? "easeOut" : "linear"
                    }}
                  >
                    {/* 각 세그먼트를 CSS로 구현 */}
                    <div className="absolute inset-0 rounded-full">
                      {PRIZES.map((prize, index) => {
                        const rotateAngle = (360 / PRIZES.length) * index;
                        return (
                          <div
                            key={prize.id}
                            className="absolute w-full h-full"
                            style={{
                              transform: `rotate(${rotateAngle}deg)`,
                              transformOrigin: 'center center'
                            }}
                          >
                            <div
                              className="absolute w-full h-1/2 origin-bottom flex flex-col items-center justify-end pb-8 text-center"
                              style={{
                                background: `linear-gradient(to bottom, ${prize.color}, ${prize.color}dd)`,
                                clipPath: `polygon(50% 0%, ${50 + 50 * Math.tan(Math.PI / PRIZES.length)}% 100%, ${50 - 50 * Math.tan(Math.PI / PRIZES.length)}% 100%)`
                              }}
                            >
                              <div className="text-2xl mb-1 filter drop-shadow-lg">
                                {prize.icon}
                              </div>
                              <div className="text-xs font-bold text-white filter drop-shadow-md">
                                {prize.name.length > 8 ? prize.name.substring(0, 6) + '...' : prize.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* 중앙 원 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-20">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 스핀 버튼 - 휠 바로 아래, 더 크게 */}
            <div className="mt-6">
              <motion.button
                onClick={spinRoulette}
                disabled={isSpinning || spinsLeft <= 0}
                className={`relative px-10 py-5 rounded-2xl font-bold text-white text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] shadow-2xl ${
                  spinsLeft > 0 && !isSpinning
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-amber-500/50 hover:shadow-amber-500/70 transform hover:scale-110 active:scale-95'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
                }`}
                whileHover={spinsLeft > 0 && !isSpinning ? { 
                  scale: 1.1,
                  boxShadow: "0 0 40px rgba(245,158,11,0.6)"
                } : {}}
                whileTap={spinsLeft > 0 && !isSpinning ? { scale: 0.95 } : {}}
                animate={isSpinning ? {
                  boxShadow: ["0 0 20px rgba(245,158,11,0.4)", "0 0 40px rgba(245,158,11,0.8)", "0 0 20px rgba(245,158,11,0.4)"]
                } : {}}
                transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
              >
                {isSpinning ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div 
                      className="rounded-full h-6 w-6 border-b-3 border-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>스핀 중...</span>
                  </div>
                ) : spinsLeft > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.span 
                      className="text-2xl"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      �
                    </motion.span>
                    <span>스핀하기!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>⏰</span>
                    <span>스핀 소진</span>
                  </div>
                )}
              </motion.button>
            </div>
          </div>

          {/* 하단 정보 - 간소화 */}
          <div className="text-center">
            {spinsLeft === 0 && (
              <motion.p 
                className="text-red-400 text-sm flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span>🌅</span>
                <span>내일 다시 도전하세요!</span>
              </motion.p>
            )}
          </div>

          {/* 결과 표시 */}
          {lastResult && !showResultModal && (
            <motion.div 
              className="mb-6 bg-gradient-to-r from-[var(--color-primary-charcoal)]/90 to-[var(--color-primary-dark-navy)]/90 backdrop-blur-sm p-4 rounded-xl border border-[var(--border)]/30 shadow-xl"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="text-center">
                <p className={`font-bold text-lg mb-3 ${lastResult.success ? 'text-[var(--color-accent-amber)]' : 'text-red-400'}`}>
                  {lastResult.message}
                </p>
                {lastResult.prize && (
                  <div className="flex items-center justify-center gap-3 p-3 bg-black/20 rounded-lg">
                    <span className="text-2xl">{lastResult.prize.icon}</span>
                    <div className="text-left">
                      <p className="text-[var(--color-accent-amber)] font-semibold text-sm">획득 보상</p>
                      <p className="text-white font-bold">{lastResult.prize.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 스핀 히스토리 */}
          {spinHistory.length > 0 && (
            <motion.div 
              className="bg-gradient-to-r from-[var(--color-primary-charcoal)]/80 to-[var(--color-primary-dark-navy)]/80 backdrop-blur-sm p-4 rounded-xl border border-[var(--border)]/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h4 className="text-[var(--color-accent-amber)] font-semibold mb-3 text-center flex items-center justify-center gap-2">
                <span>🏆</span>
                <span>최근 당첨 내역</span>
              </h4>
              <div className="space-y-2">
                {spinHistory.map((prize, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{prize.icon}</span>
                      <span className="text-[var(--text-primary)] font-medium text-sm">{prize.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-accent-amber)] text-xs font-semibold">
                        {prize.value > 0 ? `${prize.value}💰` : '특별 상품'}
                      </span>
                      {index === 0 && (
                        <span className="bg-[var(--color-accent-amber)] text-black text-xs px-2 py-1 rounded-full font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* 결과 모달 */}
      <AnimatePresence>
        {showResultModal && lastResult && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeResultModal}
          >
            <motion.div
              className="bg-gradient-to-br from-[var(--color-primary-charcoal)] to-[var(--color-primary-dark-navy)] p-8 rounded-2xl border border-[var(--border)]/50 max-w-md w-full mx-4 text-center shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {lastResult.animation_type === 'jackpot' && (
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  🎰✨
                </motion.div>
              )}
              
              {lastResult.prize && (
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[var(--color-accent-amber)]/20 to-[var(--color-accent-red)]/20 rounded-full flex items-center justify-center border border-[var(--color-accent-amber)]/30">
                    <span className="text-4xl">{lastResult.prize.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-accent-amber)] mb-2">
                    축하합니다! 🎉
                  </h3>
                  <p className="text-xl font-semibold text-white">
                    {lastResult.prize.name}
                  </p>
                </div>
              )}
              
              <p className="text-[var(--text-primary)] mb-8 text-lg leading-relaxed">
                {lastResult.message}
              </p>
              
              <button
                onClick={closeResultModal}
                className="bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-red)] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hydration 오류 방지를 위한 클라이언트 전용 컴포넌트
const PrizeRoulette = dynamic(() => Promise.resolve(PrizeRouletteInner), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-3"></div>
        <p className="text-slate-300 text-sm">룰렛 로딩 중...</p>
      </div>
    </div>
  )
});

export default PrizeRoulette;
