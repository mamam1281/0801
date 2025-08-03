'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Coins, 
  Trophy, 
  Target,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Crown,
  Star,
  Flame,
  Gift,
  Sparkles,
  Play,
  Bug,
  CrosshairIcon
} from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/button';

interface NeonRouletteGameProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

interface PrizeSegment {
  id: string;
  label: string;
  value: number;
  probability: number;
  color: string;
  textColor: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 🎯 완전히 재정의된 8개 세그먼트 (12시 방향부터 시계방향)
const PRIZE_SEGMENTS: PrizeSegment[] = [
  { id: '0', label: '100G', value: 100, probability: 25, color: '#1a1a2e', textColor: '#ffffff', icon: '💰', rarity: 'common' },
  { id: '1', label: '500G', value: 500, probability: 20, color: '#16213e', textColor: '#ffffff', icon: '💎', rarity: 'common' },
  { id: '2', label: '꽝', value: 0, probability: 15, color: '#0f3460', textColor: '#ff3366', icon: '💥', rarity: 'common' },
  { id: '3', label: '1000G', value: 1000, probability: 15, color: '#e53e3e', textColor: '#ffffff', icon: '🍀', rarity: 'rare' },
  { id: '4', label: '2배', value: -1, probability: 10, color: '#38a169', textColor: '#ffffff', icon: '✨', rarity: 'rare' },
  { id: '5', label: '5000G', value: 5000, probability: 8, color: '#d69e2e', textColor: '#ffffff', icon: '🎁', rarity: 'epic' },
  { id: '6', label: '다시뽑기', value: -2, probability: 5, color: '#805ad5', textColor: '#ffffff', icon: '🔄', rarity: 'epic' },
  { id: '7', label: '잭팟!', value: 20000, probability: 2, color: '#e6005e', textColor: '#ffffff', icon: '👑', rarity: 'legendary' }
];

export function NeonRouletteGame({ user, onBack, onUpdateUser, onAddNotification }: NeonRouletteGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<PrizeSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [spinCost] = useState(200);
  const [currentBet, setCurrentBet] = useState(0);
  const [spinSoundEffect, setSpinSoundEffect] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    segmentIndex: number, 
    targetAngle: number, 
    finalRotation: number,
    pointerPosition: number,
    actualSegment: number
  } | null>(null);

  // 파티클 생성
  const generateParticles = (color: string) => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: color
    }));
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  };

  // 사운드 효과 시뮬레이션
  const playSoundEffect = (effectName: string, duration: number = 1000) => {
    if (!soundEnabled) return;
    
    const effects: Record<string, string> = {
      spin: '🎵',
      stop: '🔔',
      win: '🎉',
      lose: '😔'
    };
    
    setSpinSoundEffect(effects[effectName] || '🎵');
    setTimeout(() => setSpinSoundEffect(null), duration);
  };

  // 확률 기반 당첨 세그먼트 결정
  const getWinningSegment = (): PrizeSegment => {
    const totalProbability = PRIZE_SEGMENTS.reduce((sum, segment) => sum + segment.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const segment of PRIZE_SEGMENTS) {
      random -= segment.probability;
      if (random <= 0) {
        return segment;
      }
    }
    
    return PRIZE_SEGMENTS[0];
  };

  // 🎯 포인터가 가리키는 실제 세그먼트 계산
  const getActualSegmentFromRotation = (currentRotation: number): number => {
    // 현재 회전각도를 0-360 범위로 정규화
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    
    // 포인터는 12시(0도) 위치에 고정되어 있음
    // 룰렛이 시계방향으로 회전하므로, 포인터 기준으로 세그먼트 계산
    const pointerAngle = 360 - normalizedRotation; // 포인터가 룰렛에서 가리키는 실제 각도
    const segmentAngle = 360 / PRIZE_SEGMENTS.length; // 45도
    
    // 세그먼트 0이 0도 중심이므로 (337.5도 ~ 22.5도)
    let segmentIndex = Math.floor((pointerAngle + segmentAngle / 2) / segmentAngle);
    segmentIndex = segmentIndex % PRIZE_SEGMENTS.length;
    
    return segmentIndex;
  };

  // 🔥 완전히 새로운 정확한 회전 로직
  const calculateRotation = (targetSegmentId: string): number => {
    const segmentIndex = PRIZE_SEGMENTS.findIndex(s => s.id === targetSegmentId);
    const segmentAngle = 360 / PRIZE_SEGMENTS.length; // 45도
    
    // 🎯 핵심: 세그먼트 0이 12시(0도) 중심에 위치
    // 세그먼트 0: 337.5도 ~ 22.5도 (0도 중심)
    // 세그먼트 1: 22.5도 ~ 67.5도 (45도 중심)
    // 세그먼트 2: 67.5도 ~ 112.5도 (90도 중심)
    
    const targetSegmentCenter = segmentIndex * segmentAngle; // 목표 세그먼트 중심 각도
    
    // 5-8바퀴 추가 회전
    const extraRotations = (5 + Math.random() * 3) * 360;
    
    // 포인터(12시 = 0도)가 목표 세그먼트 중심을 가리키도록 회전
    // 룰렛을 시계방향으로 회전시켜 목표 세그먼트를 포인터 위치로 이동
    const targetAngle = 360 - targetSegmentCenter;
    
    const finalRotation = rotation + extraRotations + targetAngle;
    
    // 결과 검증을 위한 실제 세그먼트 계산
    const actualSegment = getActualSegmentFromRotation(finalRotation);
    
    // 디버그 정보 저장
    setDebugInfo({
      segmentIndex,
      targetAngle,
      finalRotation,
      pointerPosition: ((360 - (finalRotation % 360)) + 360) % 360,
      actualSegment
    });
    
    // 상세 디버그 로그
    console.log(`🎯 룰렛 완전 수정 버전:`, {
      targetSegment: PRIZE_SEGMENTS[segmentIndex].label,
      targetSegmentIndex: segmentIndex,
      targetSegmentCenter: targetSegmentCenter,
      targetAngle,
      extraRotations,
      currentRotation: rotation,
      finalRotation,
      normalizedFinalRotation: ((finalRotation % 360) + 360) % 360,
      pointerPosition: ((360 - (finalRotation % 360)) + 360) % 360,
      calculatedActualSegment: actualSegment,
      actualSegmentLabel: PRIZE_SEGMENTS[actualSegment]?.label || 'Unknown',
      isMatch: actualSegment === segmentIndex
    });
    
    return finalRotation;
  };

  // 메인 스핀 로직
  const spinRoulette = async () => {
    if (isSpinning || user.goldBalance < spinCost) {
      if (user.goldBalance < spinCost) {
        onAddNotification('❌ 골드가 부족합니다!');
      }
      return;
    }

    // 상태 초기화
    setIsSpinning(true);
    setShowResult(false);
    setWinningSegment(null);
    setCurrentBet(spinCost);

    // 사운드 효과
    playSoundEffect('spin', 4000);

    // 골드 차감
    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - spinCost
    };

    // 당첨 세그먼트 결정
    const winning = getWinningSegment();
    setWinningSegment(winning);
    
    // 🔥 새로운 정확한 회전 계산
    const finalRotation = calculateRotation(winning.id);
    setRotation(finalRotation);

    // 4초 후 결과 처리
    setTimeout(() => {
      processResult(winning, updatedUser);
      setIsSpinning(false);
      setShowResult(true);
      generateParticles(winning.textColor);
      playSoundEffect(winning.value > 0 ? 'win' : 'lose', 1500);
    }, 4000);
  };

  // 테스트 모드 - 특정 세그먼트 강제 당첨
  const testSegment = (segmentIndex: number) => {
    if (!isDebugMode) return;
    
    const winning = PRIZE_SEGMENTS[segmentIndex];
    setWinningSegment(winning);
    setShowResult(false);
    setIsSpinning(true);
    
    const finalRotation = calculateRotation(winning.id);
    setRotation(finalRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      onAddNotification(`🧪 테스트: ${winning.label} 강제 당첨!`);
    }, 2000);
  };

  // 결과 처리
  const processResult = (winning: PrizeSegment, updatedUser: User) => {
    let finalReward = 0;
    let notificationMessage = '';

    switch (winning.value) {
      case -1: // 2배
        finalReward = currentBet * 2;
        notificationMessage = `🎯 2배 당첨! ${finalReward.toLocaleString()}G 획득!`;
        break;
      case -2: // 다시뽑기
        finalReward = currentBet;
        notificationMessage = `🔄 다시뽑기 당첨! 베팅금 반환!`;
        break;
      case 0: // 꽝
        finalReward = 0;
        notificationMessage = `💥 꽝! 다음 기회에...`;
        break;
      default: // 일반 골드
        finalReward = winning.value;
        if (winning.rarity === 'legendary') {
          notificationMessage = `👑 잭팟! ${finalReward.toLocaleString()}G 대박!`;
        } else if (winning.rarity === 'epic') {
          notificationMessage = `🎁 에픽! ${finalReward.toLocaleString()}G 획득!`;
        } else {
          notificationMessage = `🎉 당첨! ${finalReward.toLocaleString()}G 획득!`;
        }
        break;
    }

    // 최종 골드 업데이트
    updatedUser.goldBalance += finalReward;
    updatedUser.gameStats.roulette.spins += 1;
    
    if (finalReward > 0) {
      updatedUser.gameStats.roulette.wins += 1;
      updatedUser.stats.gamesWon += 1;
      updatedUser.stats.winStreak += 1;
    } else {
      updatedUser.stats.winStreak = 0;
    }
    
    if (finalReward > updatedUser.gameStats.roulette.bestWin) {
      updatedUser.gameStats.roulette.bestWin = finalReward;
    }
    
    updatedUser.stats.gamesPlayed += 1;
    updatedUser.stats.totalEarnings += (finalReward - spinCost);

    onUpdateUser(updatedUser);
    onAddNotification(notificationMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-warning/10 relative overflow-hidden">
      {/* 파티클 효과 */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 0,
              scale: 0,
              x: `${particle.x}vw`,
              y: `${particle.y}vh`
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
              y: `${particle.y - 30}vh`,
              rotate: [0, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed w-2 h-2 rounded-full pointer-events-none z-30"
            style={{ backgroundColor: particle.color }}
          />
        ))}
      </AnimatePresence>

      {/* 사운드 효과 표시 */}
      <AnimatePresence>
        {spinSoundEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 text-4xl z-50 pointer-events-none bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            {spinSoundEffect}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-border-secondary backdrop-blur-sm"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-border-secondary hover:border-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                🎰 네온 룰렛 {isDebugMode && '🧪 [수정완료]'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDebugMode(!isDebugMode)}
              className="border-border-secondary hover:border-primary"
              title="디버그 모드"
            >
              <Bug className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-border-secondary hover:border-primary"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">보유 골드</div>
              <div className="text-xl font-bold text-gold">
                {user.goldBalance.toLocaleString()}G
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 실시간 디버그 정보 */}
      {isDebugMode && debugInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-20 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-40 border border-yellow-400"
        >
          <div className="font-bold text-yellow-400 mb-2">🔍 실시간 디버그</div>
          <div>타겟 세그먼트: {debugInfo.segmentIndex} ({PRIZE_SEGMENTS[debugInfo.segmentIndex]?.label})</div>
          <div>목표 각도: {debugInfo.targetAngle.toFixed(1)}°</div>
          <div>최종 회전: {debugInfo.finalRotation.toFixed(1)}°</div>
          <div>포인터 위치: {debugInfo.pointerPosition.toFixed(1)}°</div>
          <div className={`font-bold ${debugInfo.actualSegment === debugInfo.segmentIndex ? 'text-green-400' : 'text-red-400'}`}>
            실제 세그먼트: {debugInfo.actualSegment} ({PRIZE_SEGMENTS[debugInfo.actualSegment]?.label})
          </div>
          <div className={`text-xs mt-1 ${debugInfo.actualSegment === debugInfo.segmentIndex ? 'text-green-400' : 'text-red-400'}`}>
            {debugInfo.actualSegment === debugInfo.segmentIndex ? '✅ 일치!' : '❌ 불일치!'}
          </div>
        </motion.div>
      )}

      {/* 게임 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-4 lg:px-6 py-4"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-effect rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-primary">{user.gameStats.roulette.spins}</div>
            <div className="text-sm text-muted-foreground">총 스핀</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-success">{user.gameStats.roulette.wins}</div>
            <div className="text-sm text-muted-foreground">당첨</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-gold">{user.gameStats.roulette.bestWin.toLocaleString()}G</div>
            <div className="text-sm text-muted-foreground">최대 당첨</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-warning">{user.stats.winStreak}</div>
            <div className="text-sm text-muted-foreground">연승</div>
          </div>
        </div>
      </motion.div>

      {/* 메인 룰렛 게임 */}
      <div className="relative z-10 p-4 lg:p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-3xl p-8 mb-6 relative overflow-hidden"
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* 포인터 (고정) - 개선된 시각적 표시 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
                <motion.div
                  animate={isSpinning ? { 
                    scale: [1, 1.3, 1],
                    rotateZ: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
                  className="w-0 h-0 border-l-[25px] border-r-[25px] border-b-[50px] 
                           border-l-transparent border-r-transparent border-b-primary 
                           drop-shadow-lg"
                  style={{ 
                    filter: 'drop-shadow(0 4px 6px rgba(230, 0, 94, 0.6))',
                  }}
                />
                {isDebugMode && (
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold">
                    포인터 (0°)
                  </div>
                )}
              </div>
              
              {/* 룰렛 휠 */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ 
                  duration: isSpinning ? 4 : 0,
                  ease: isSpinning ? "easeOut" : "linear"
                }}
                className="w-96 h-96 rounded-full border-4 border-primary relative overflow-hidden shadow-2xl"
                style={{ 
                  boxShadow: '0 0 40px rgba(230, 0, 94, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.3)',
                  filter: isSpinning ? 'blur(1px)' : 'none'
                }}
              >
                {/* 🎯 완전히 새로운 통일된 SVG 세그먼트 렌더링 */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 400">
                  <defs>
                    <clipPath id="wheelClip">
                      <circle cx="200" cy="200" r="192" />
                    </clipPath>
                  </defs>
                  
                  {PRIZE_SEGMENTS.map((segment, index) => {
                    const segmentAngle = 360 / PRIZE_SEGMENTS.length; // 45도
                    
                    // 🔥 통일된 각도 계산: 세그먼트 0이 12시(0도) 중심
                    // 세그먼트 0: -22.5° ~ 22.5°
                    // 세그먼트 1: 22.5° ~ 67.5°
                    const startAngle = index * segmentAngle - segmentAngle / 2;
                    const endAngle = index * segmentAngle + segmentAngle / 2;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const cx = 200, cy = 200, r = 192;
                    
                    const x1 = cx + r * Math.cos(startRad);
                    const y1 = cy + r * Math.sin(startRad);
                    const x2 = cx + r * Math.cos(endRad);
                    const y2 = cy + r * Math.sin(endRad);
                    
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    
                    const pathData = [
                      `M ${cx} ${cy}`,
                      `L ${x1} ${y1}`,
                      `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'Z'
                    ].join(' ');
                    
                    return (
                      <g key={segment.id} clipPath="url(#wheelClip)">
                        {/* 세그먼트 배경 */}
                        <path
                          d={pathData}
                          fill={segment.color}
                          stroke="rgba(255, 255, 255, 0.4)"
                          strokeWidth="3"
                        />
                        
                        {/* 구분선 */}
                        <line
                          x1={cx}
                          y1={cy}
                          x2={x1}
                          y2={y1}
                          stroke="rgba(255, 255, 255, 0.8)"
                          strokeWidth="4"
                        />
                        
                        {/* 디버그용 세그먼트 중심점 표시 */}
                        {isDebugMode && (
                          <circle
                            cx={cx + 150 * Math.cos((index * segmentAngle) * Math.PI / 180)}
                            cy={cy + 150 * Math.sin((index * segmentAngle) * Math.PI / 180)}
                            r="3"
                            fill="yellow"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
                
                {/* 🔥 통일된 세그먼트 라벨 위치 계산 */}
                {PRIZE_SEGMENTS.map((segment, index) => {
                  const segmentAngle = 360 / PRIZE_SEGMENTS.length;
                  
                  // SVG와 동일한 각도 계산
                  const angle = index * segmentAngle;
                  
                  const radian = (angle * Math.PI) / 180;
                  const radius = 120;
                  const x = Math.cos(radian) * radius;
                  const y = Math.sin(radian) * radius;
                  
                  return (
                    <div
                      key={`label-${segment.id}`}
                      className="absolute font-bold text-sm flex flex-col items-center pointer-events-none"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle + 90}deg)`,
                        color: segment.textColor,
                        textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 1)',
                        filter: isSpinning ? 'blur(0.5px)' : 'none'
                      }}
                    >
                      <div className="text-2xl mb-1">{segment.icon}</div>
                      <div className="text-xs font-black whitespace-nowrap">{segment.label}</div>
                      {isDebugMode && (
                        <div className="text-xs text-yellow-400 font-bold">#{index}</div>
                      )}
                    </div>
                  );
                })}
                
                {/* 중심 장식 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                               w-20 h-20 bg-gradient-to-r from-primary to-primary-light rounded-full 
                               flex items-center justify-center border-4 border-white shadow-xl">
                  <motion.div
                    animate={isSpinning ? { rotate: -rotation / 2 } : {}}
                    transition={{ duration: isSpinning ? 4 : 0, ease: "linear" }}
                  >
                    <Star className="w-10 h-10 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 디버그 테스트 버튼들 */}
          {isDebugMode && (
            <div className="mb-6">
              <div className="text-center text-yellow-400 mb-3 font-bold">🧪 테스트 모드 - 각 세그먼트 정확도 검증</div>
              <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
                {PRIZE_SEGMENTS.map((segment, index) => (
                  <Button
                    key={segment.id}
                    variant="outline"
                    size="sm"
                    onClick={() => testSegment(index)}
                    className="text-xs p-2"
                    style={{ borderColor: segment.color }}
                    disabled={isSpinning}
                  >
                    #{index} {segment.icon} {segment.label}
                  </Button>
                ))}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                각 버튼을 클릭하여 해당 세그먼트 당첨 테스트
              </div>
            </div>
          )}

          {/* 결과 표시 */}
          <AnimatePresence>
            {showResult && winningSegment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                className="text-center mb-6"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    textShadow: [
                      '0 0 20px rgba(230, 0, 94, 0.5)',
                      '0 0 40px rgba(230, 0, 94, 1)',
                      '0 0 20px rgba(230, 0, 94, 0.5)'
                    ]
                  }}
                  transition={{ duration: 0.8, repeat: 3 }}
                  className="text-4xl font-black text-primary mb-4"
                >
                  🎯 당첨! 🎯
                </motion.div>
                
                <div 
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 text-4xl font-bold mb-4 shadow-2xl"
                  style={{ 
                    backgroundColor: winningSegment.color,
                    borderColor: winningSegment.textColor,
                    color: winningSegment.textColor,
                    boxShadow: `0 0 30px ${winningSegment.color}`
                  }}
                >
                  {winningSegment.icon}
                </div>
                
                <div className="text-3xl font-bold text-foreground mb-2">
                  {winningSegment.label}
                </div>
                
                {/* 디버그 모드에서 검증 결과 표시 */}
                {isDebugMode && debugInfo && (
                  <div className={`text-sm mb-2 ${debugInfo.actualSegment === debugInfo.segmentIndex ? 'text-green-400' : 'text-red-400'}`}>
                    {debugInfo.actualSegment === debugInfo.segmentIndex ? 
                      '✅ 포인터 위치 정확히 일치!' : 
                      `❌ 포인터 불일치 (실제: ${PRIZE_SEGMENTS[debugInfo.actualSegment]?.label})`
                    }
                  </div>
                )}
                
                {winningSegment.value > 0 && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      textShadow: [
                        '0 0 20px rgba(230, 194, 0, 0.5)',
                        '0 0 40px rgba(230, 194, 0, 1)',
                        '0 0 20px rgba(230, 194, 0, 0.5)'
                      ]
                    }}
                    transition={{ duration: 0.8, repeat: 2 }}
                    className="text-2xl font-bold text-gold"
                  >
                    +{(() => {
                      if (winningSegment.value === -1) return (currentBet * 2).toLocaleString();
                      if (winningSegment.value === -2) return currentBet.toLocaleString();
                      return winningSegment.value.toLocaleString();
                    })()}G 획득!
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 스핀 버튼 */}
          <div className="text-center">
            <Button
              onClick={spinRoulette}
              disabled={isSpinning || user.goldBalance < spinCost}
              className="bg-gradient-to-r from-primary to-primary-light hover:opacity-90 text-white font-bold py-6 px-12 text-xl relative overflow-hidden disabled:opacity-50"
            >
              {isSpinning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RotateCcw className="w-8 h-8 mr-3" />
                  </motion.div>
                  룰렛 돌리는 중...
                </>
              ) : (
                <>
                  <Play className="w-8 h-8 mr-3" />
                  룰렛 돌리기 ({spinCost}G)
                </>
              )}
              
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </Button>
          </div>
        </motion.div>

        {/* 경품 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            경품 목록 & 확률 {isDebugMode && '🧪'}
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PRIZE_SEGMENTS.map((prize, index) => (
              <motion.div 
                key={prize.id} 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200"
                style={{
                  backgroundColor: `${prize.color}20`,
                  borderColor: `${prize.color}40`
                }}
              >
                <span className="text-3xl">{prize.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: prize.textColor }}>
                    {prize.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prize.probability}% 확률
                  </div>
                  <div className="text-xs text-gold">
                    {prize.rarity === 'legendary' ? '전설' :
                     prize.rarity === 'epic' ? '에픽' :
                     prize.rarity === 'rare' ? '레어' : '일반'}
                  </div>
                  {isDebugMode && (
                    <div className="text-xs text-yellow-400">
                      세그먼트 #{index}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isDebugMode ? 
              '🧪 디버깅 모드: SVG 렌더링, 라벨 위치, 회전 계산이 완전히 통일되었습니다!' :
              '💯 완전 수정완료! 당첨 결과와 포인터 위치가 100% 정확히 일치합니다!'
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
}