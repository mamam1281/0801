'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPopupWindow } from '../../../utils/gamePopup';
import './RouletteGame.css';

interface RouletteSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  probability: number;
  icon: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'jackpot';
}

interface SpinResult {
  success: boolean;
  segment?: RouletteSegment;
  message: string;
  spins_left: number;
  coins_won?: number;
  animation_type?: 'normal' | 'jackpot' | 'near_miss';
}

interface RouletteGameProps {
  isPopup?: boolean;
}

const ROULETTE_SEGMENTS: RouletteSegment[] = [
  { id: "gold_50", label: "골드 50", value: 50, color: "#9CA3AF", probability: 0.3, icon: "🪙", tier: "common" },
  { id: "gold_100", label: "골드 100", value: 100, color: "#10B981", probability: 0.25, icon: "🪙", tier: "common" },
  { id: "gold_200", label: "골드 200", value: 200, color: "#3B82F6", probability: 0.2, icon: "🪙", tier: "rare" },
  { id: "gold_500", label: "골드 500", value: 500, color: "#8B5CF6", probability: 0.12, icon: "💎", tier: "rare" },
  { id: "gold_1000", label: "골드 1000", value: 1000, color: "#F59E0B", probability: 0.08, icon: "💎", tier: "epic" },
  { id: "gold_10", label: "골드 10", value: 10, color: "#EF4444", probability: 0.03, icon: "💠", tier: "epic" },
  { id: "gold_50", label: "골드 50", value: 50, color: "#DC2626", probability: 0.015, icon: "💠", tier: "legendary" },
  { id: "jackpot", label: "JACKPOT!", value: 10000, color: "#FFD700", probability: 0.005, icon: "🎰", tier: "jackpot" }
];

const RouletteGame: React.FC<RouletteGameProps> = ({ isPopup = false }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [coins, setCoins] = useState(1000);
  const [gems, setGems] = useState(50);
  const [spinHistory, setSpinHistory] = useState<RouletteSegment[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [nearMissEffect, setNearMissEffect] = useState(false);

  // 팝업 크기 최적화 및 Hydration 처리
  useEffect(() => {
    setIsMounted(true);
    
    if (isPopup) {
      const resizeHandler = () => {
        const height = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
      };
      
      resizeHandler();
      window.addEventListener('resize', resizeHandler);
      
      return () => window.removeEventListener('resize', resizeHandler);
    }
  }, [isPopup]);

  // 사용자 정보 가져오기
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/user/info');
      const data = await response.json();
      
      if (data.success) {
        setCoins(data.coins || 1000);
        setGems(data.gems || 50);
        setSpinsLeft(data.daily_spins || 3);
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      // 로컬 스토리지 백업
      const savedCoins = localStorage.getItem('user_coins');
      const savedGems = localStorage.getItem('user_gems');
      const savedSpins = localStorage.getItem('daily_spins');
      
      if (savedCoins) setCoins(parseInt(savedCoins));
      if (savedGems) setGems(parseInt(savedGems));
      if (savedSpins) setSpinsLeft(parseInt(savedSpins));
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // 룰렛 스핀 함수
  const spinRoulette = useCallback(async () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setNearMissEffect(false);
    
    // 실제 상금 계산 (확률 기반)
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedSegment = ROULETTE_SEGMENTS[0];
    
    for (const segment of ROULETTE_SEGMENTS) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        selectedSegment = segment;
        break;
      }
    }

    // 세그먼트 각도 계산 (SVG 기반)
    const segmentAngle = 360 / ROULETTE_SEGMENTS.length;
    const segmentIndex = ROULETTE_SEGMENTS.findIndex(s => s.id === selectedSegment.id);
    
    // SVG는 0도가 우측을 가리키므로, 상단 포인터 기준으로 조정
    // 포인터가 상단에 있고 시계방향으로 회전하므로 -90도 오프셋
    const targetAngle = (segmentIndex * segmentAngle) + (segmentAngle / 2) - 90;
    
    // 현재 회전값을 정규화 (항상 0-360 사이의 값으로)
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    // 최소 5바퀴(1800도) + 타겟 각도로 이동
    const minRotations = 5;
    let finalRotation = (minRotations * 360) + targetAngle;
    
    // 이전 회전 방향을 유지하기 위해 현재 회전값에 더하는 방식으로 계산
    finalRotation = Math.floor(rotation / 360) * 360 + finalRotation;
    
    setRotation(finalRotation);

    // 스핀 애니메이션 완료 후 결과 처리
    setTimeout(async () => {
      try {
        // API 호출 (실제 구현시)
        const mockResult: SpinResult = {
          success: true,
          segment: selectedSegment,
          message: `${selectedSegment.label}에 당첨되었습니다!`,
          spins_left: spinsLeft - 1,
          coins_won: selectedSegment.tier === 'jackpot' ? selectedSegment.value : 
                     selectedSegment.label.includes('젬') ? 0 : selectedSegment.value,
          animation_type: selectedSegment.tier === 'jackpot' ? 'jackpot' : 'normal'
        };

        setLastResult(mockResult);
        setSpinsLeft(mockResult.spins_left);
        
        // 히스토리 업데이트
        const newHistory = [selectedSegment, ...spinHistory].slice(0, 10);
        setSpinHistory(newHistory);
        localStorage.setItem('roulette_history', JSON.stringify(newHistory));
        
        // 상금 지급
        if (mockResult.coins_won && mockResult.coins_won > 0) {
          setCoins(prev => prev + mockResult.coins_won!);
          localStorage.setItem('user_coins', (coins + mockResult.coins_won).toString());
        }
        
        if (selectedSegment.label.includes('젬')) {
          setGems(prev => prev + selectedSegment.value);
          localStorage.setItem('user_gems', (gems + selectedSegment.value).toString());
        }

        // 잭팟 효과
        if (selectedSegment.tier === 'jackpot') {
          setNearMissEffect(true);
        }
        
        setShowResultModal(true);
        
      } catch (error) {
        console.error('룰렛 스핀 실패:', error);
      }
      
      setIsSpinning(false);
    }, 3000); // 스핀 애니메이션 시간과 동기화

  }, [isSpinning, spinsLeft, rotation, spinHistory, coins, gems]);

  // 모달 닫기
  const closeResultModal = () => {
    setShowResultModal(false);
    setNearMissEffect(false);
  };

  // 히스토리 항목 렌더링
  const renderHistoryItem = (segment: RouletteSegment, index: number) => (
    <motion.div
      key={`${segment.id}-${index}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`history-item ${segment.tier}`}
    >
      <span className="history-icon">{segment.icon}</span>
      <span className="history-label">{segment.label}</span>
      <span className="history-value">+{segment.value}</span>
    </motion.div>
  );

  if (!isMounted) {
    return <div className="roulette-loading">로딩 중...</div>;
  }

  const containerClass = isPopup ? "roulette-popup-container" : "roulette-game-container";

  return (
    <div className={containerClass}>
      {/* 네온 백그라운드 효과 */}
      <div className="roulette-background-effects">
        <div className="neon-circle neon-circle-1"></div>
        <div className="neon-circle neon-circle-2"></div>
        <div className="neon-circle neon-circle-3"></div>
      </div>

      {/* 상단 정보 */}
      <div className="roulette-header">
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-icon">🪙</span>
            <span className="stat-value">{coins.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">💎</span>
            <span className="stat-value">{gems}</span>
          </div>
          <div className="stat-item spins-left">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{spinsLeft}</span>
            <span className="stat-label">남은 스핀</span>
          </div>
        </div>
      </div>

      {/* 룰렛 휠 */}
      <div className="roulette-wheel-container">
        <div className="roulette-pointer"></div>
        
        <motion.div
          className={`roulette-wheel ${isSpinning ? 'spinning' : ''} ${nearMissEffect ? 'jackpot-glow' : ''}`}
          initial={false}
          animate={{ rotate: rotation }}
          transition={{
            duration: isSpinning ? 3 : 0,
            ease: isSpinning ? [0.23, 1, 0.32, 1] : "linear",
            type: "tween"
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 400" className="roulette-svg">
            {ROULETTE_SEGMENTS.map((segment, index) => {
              const segmentAngle = 360 / ROULETTE_SEGMENTS.length;
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;
              
              // SVG 경로 계산
              const centerX = 200;
              const centerY = 200;
              const radius = 180;
              
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              // 텍스트 위치 계산
              const textAngle = startAngle + segmentAngle / 2;
              const textAngleRad = (textAngle * Math.PI) / 180;
              const textRadius = radius * 0.65;
              const textX = centerX + textRadius * Math.cos(textAngleRad);
              const textY = centerY + textRadius * Math.sin(textAngleRad);
              
              return (
                <g key={segment.id} className={`segment-group ${segment.tier}`}>
                  <path
                    d={pathData}
                    fill={segment.color}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                    className="segment-path"
                  />
                  <g transform={`translate(${textX}, ${textY})`}>
                    <text
                      x="0"
                      y="-8"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="segment-icon-text"
                      fontSize="20"
                    >
                      {segment.icon}
                    </text>
                    <text
                      x="0"
                      y="8"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="segment-label-text"
                      fontSize="10"
                      fontWeight="700"
                      fill="white"
                    >
                      {segment.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* 중앙 버튼 */}
        <button
          className={`roulette-spin-button ${isSpinning ? 'spinning' : ''} ${spinsLeft <= 0 ? 'disabled' : ''}`}
          onClick={spinRoulette}
          disabled={isSpinning || spinsLeft <= 0}
        >
          {isSpinning ? (
            <motion.div
              className="spin-loader"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⚡
            </motion.div>
          ) : spinsLeft > 0 ? (
            <>
              <span className="button-icon">🎰</span>
              <span className="button-text">SPIN!</span>
            </>
          ) : (
            <>
              <span className="button-icon">⏰</span>
              <span className="button-text">내일 다시</span>
            </>
          )}
        </button>
      </div>

      {/* 최근 결과 */}
      {spinHistory.length > 0 && (
        <div className="roulette-history">
          <h3 className="history-title">최근 결과</h3>
          <div className="history-list">
            {spinHistory.slice(0, 5).map(renderHistoryItem)}
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      <AnimatePresence>
        {showResultModal && lastResult && (
          <motion.div
            className="roulette-result-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeResultModal}
          >
            <motion.div
              className={`result-content ${lastResult.segment?.tier}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {lastResult.animation_type === 'jackpot' && (
                <div className="jackpot-particles">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="particle"
                      initial={{
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: Math.random() * 200 - 100,
                        y: Math.random() * 200 - 100,
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  ))}
                </div>
              )}
              
              <div className="result-icon">{lastResult.segment?.icon}</div>
              <h2 className="result-title">
                {lastResult.animation_type === 'jackpot' ? '🎉 JACKPOT! 🎉' : '축하합니다!'}
              </h2>
              <p className="result-message">{lastResult.message}</p>
              
              {lastResult.coins_won && lastResult.coins_won > 0 && (
                <div className="reward-display">
                  <span className="reward-icon">🪙</span>
                  <span className="reward-amount">+{lastResult.coins_won.toLocaleString()}</span>
                </div>
              )}
              
              {lastResult.segment?.label.includes('젬') && (
                <div className="reward-display">
                  <span className="reward-icon">💎</span>
                  <span className="reward-amount">+{lastResult.segment.value}</span>
                </div>
              )}
              
              <button className="result-close-button" onClick={closeResultModal}>
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RouletteGame;
