'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp,
  Zap,
  DollarSign,
  Timer,
  Volume2,
  VolumeX,
  Target,
  Trophy,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface NeonCrashGameProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

interface GameRound {
  betAmount: number;
  multiplier: number;
  cashedOut: boolean;
  winnings: number;
  crashed: boolean;
}

export function NeonCrashGame({ user, onBack, onUpdateUser, onAddNotification }: NeonCrashGameProps) {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState(100);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameHistory, setGameHistory] = useState<GameRound[]>([]);
  const [countdownToNext, setCountdownToNext] = useState(0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [autoCashOut, setAutoCashOut] = useState(2.0);
  const [isAutoCashEnabled, setIsAutoCashEnabled] = useState(false);
  const [lastCrashMultipliers, setLastCrashMultipliers] = useState<number[]>([]);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    totalWinnings: 0,
    biggestWin: 0,
    biggestMultiplier: 0,
    cashOutCount: 0
  });

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🎯 크래시 포인트 생성 (현실적인 확률)
  const generateCrashPoint = useCallback((): number => {
    const random = Math.random();
    
    // 확률 분포 (중독성을 위한 조정)
    if (random < 0.33) return 1.00 + Math.random() * 0.50; // 1.00-1.50 (33%)
    if (random < 0.60) return 1.50 + Math.random() * 1.00; // 1.50-2.50 (27%)
    if (random < 0.80) return 2.50 + Math.random() * 2.50; // 2.50-5.00 (20%)
    if (random < 0.95) return 5.00 + Math.random() * 10.00; // 5.00-15.00 (15%)
    return 15.00 + Math.random() * 85.00; // 15.00-100.00 (5%)
  }, []);

  // 🚀 게임 시작
  const startGame = useCallback(() => {
    const newCrashPoint = generateCrashPoint();
    setCrashPoint(newCrashPoint);
    setMultiplier(1.00);
    setIsGameRunning(true);
    setHasCashedOut(false);
    setIsWaiting(false);

    // 멀티플라이어 증가 로직
    let currentMultiplier = 1.00;
    gameIntervalRef.current = setInterval(() => {
      currentMultiplier += 0.01 + (currentMultiplier * 0.001); // 점점 빨라짐
      
      if (currentMultiplier >= newCrashPoint) {
        // 💥 크래시 발생
        setMultiplier(newCrashPoint);
        setIsGameRunning(false);
        
        // 베팅이 있고 캐시아웃하지 않았다면 패배
        if (hasActiveBet && !hasCashedOut) {
          const lostRound: GameRound = {
            betAmount,
            multiplier: newCrashPoint,
            cashedOut: false,
            winnings: -betAmount,
            crashed: true
          };
          
          setGameHistory(prev => [lostRound, ...prev.slice(0, 9)]);
          
          // 사용자 골드 차감
          const updatedUser = {
            ...user,
            goldBalance: user.goldBalance - betAmount,
            stats: {
              ...user.stats,
              gamesPlayed: user.stats.gamesPlayed + 1,
              winStreak: 0
            }
          };
          onUpdateUser(updatedUser);
        }
        
        setHasActiveBet(false);
        setLastCrashMultipliers(prev => [newCrashPoint, ...prev.slice(0, 9)]);
        
        // 다음 게임 카운트다운 시작
        setCountdownToNext(7);
        setIsWaiting(true);
        
        clearInterval(gameIntervalRef.current!);
        return;
      }
      
      setMultiplier(currentMultiplier);
      
      // 🤖 자동 캐시아웃 체크
      if (isAutoCashEnabled && hasActiveBet && !hasCashedOut && currentMultiplier >= autoCashOut) {
        handleCashOut();
      }
    }, 50); // 50ms마다 업데이트 (부드러운 애니메이션)
  }, [generateCrashPoint, hasActiveBet, hasCashedOut, betAmount, isAutoCashEnabled, autoCashOut, user, onUpdateUser]);

  // 💰 캐시아웃 처리
  const handleCashOut = useCallback(() => {
    if (!hasActiveBet || hasCashedOut || !isGameRunning) return;
    
    const winnings = Math.floor(betAmount * multiplier);
    const profit = winnings - betAmount;
    
    setHasCashedOut(true);
    setHasActiveBet(false);
    
    const successRound: GameRound = {
      betAmount,
      multiplier,
      cashedOut: true,
      winnings: profit,
      crashed: false
    };
    
    setGameHistory(prev => [successRound, ...prev.slice(0, 9)]);
    setGameStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalWinnings: prev.totalWinnings + profit,
      biggestWin: Math.max(prev.biggestWin, profit),
      biggestMultiplier: Math.max(prev.biggestMultiplier, multiplier),
      cashOutCount: prev.cashOutCount + 1
    }));
    
    // 사용자 업데이트
    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance + profit,
      stats: {
        ...user.stats,
        gamesPlayed: user.stats.gamesPlayed + 1,
        gamesWon: user.stats.gamesWon + 1,
        totalEarnings: user.stats.totalEarnings + profit,
        winStreak: user.stats.winStreak + 1
      }
    };
    onUpdateUser(updatedUser);
    
    // 🎯 VIP 알림 (큰 승리만)
    if (profit >= 500) {
      onAddNotification(`🚀 크래시 승리! +${profit.toLocaleString()}G (${multiplier.toFixed(2)}x)`);
    }
  }, [hasActiveBet, hasCashedOut, isGameRunning, betAmount, multiplier, user, onUpdateUser, onAddNotification]);

  // 🎲 베팅 시작
  const handlePlaceBet = useCallback(() => {
    if (user.goldBalance < betAmount || hasActiveBet || isGameRunning) return;
    
    setHasActiveBet(true);
  }, [user.goldBalance, betAmount, hasActiveBet, isGameRunning]);

  // ⏰ 카운트다운 관리
  useEffect(() => {
    if (countdownToNext > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownToNext(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            startGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdownToNext, startGame]);

  // 🎮 게임 초기화
  useEffect(() => {
    if (!isGameRunning && !isWaiting && countdownToNext === 0) {
      setCountdownToNext(3);
      setIsWaiting(true);
    }
  }, [isGameRunning, isWaiting, countdownToNext]);

  // 🧹 클린업
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 멀티플라이어 색상
  const getMultiplierColor = (mult: number) => {
    if (mult >= 10) return 'text-error';
    if (mult >= 5) return 'text-warning';
    if (mult >= 2) return 'text-success';
    return 'text-primary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-error/10 relative overflow-hidden">
      {/* 동적 배경 */}
      <motion.div
        animate={{
          background: isGameRunning 
            ? `radial-gradient(circle at 50% 50%, rgba(230, 0, 94, ${Math.min(multiplier * 0.05, 0.3)}) 0%, transparent 70%)`
            : 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* 간소화된 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-border-secondary/50 backdrop-blur-xl bg-card/80"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="glass-effect hover:bg-primary/10 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
              네온 크래시 🚀
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="glass-effect hover:bg-primary/10 transition-all duration-300"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            <div className="glass-effect rounded-xl p-3 border border-gold/20">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">보유 골드</div>
                <div className="text-xl font-black text-gradient-gold">
                  {user.goldBalance.toLocaleString()}G
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 p-4 lg:p-6 max-w-6xl mx-auto">
        
        {/* 메인 게임 화면 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-3xl p-8 mb-6 relative overflow-hidden"
        >
          {/* 게임 상태 표시 */}
          <div className="text-center mb-8">
            {isWaiting ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl font-black text-warning"
              >
                다음 게임: {countdownToNext}초
              </motion.div>
            ) : (
              <motion.div
                animate={{ 
                  scale: isGameRunning ? [1, 1.05, 1] : 1,
                  textShadow: isGameRunning ? [
                    '0 0 20px rgba(230, 0, 94, 0.5)',
                    '0 0 40px rgba(230, 0, 94, 0.8)',
                    '0 0 20px rgba(230, 0, 94, 0.5)'
                  ] : '0 0 0px rgba(0,0,0,0)'
                }}
                transition={{ duration: 0.8, repeat: isGameRunning ? Infinity : 0 }}
                className={`text-8xl font-black ${getMultiplierColor(multiplier)} mb-4`}
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            )}
            
            {isGameRunning && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-lg text-muted-foreground"
              >
                🚀 상승 중... 언제 터질까요?
              </motion.div>
            )}
          </div>

          {/* 그래프 영역 (시각적 효과) */}
          <div className="relative h-40 mb-8 bg-secondary/20 rounded-xl overflow-hidden">
            <motion.div
              animate={{
                width: isGameRunning ? `${Math.min((multiplier - 1) * 20, 100)}%` : '0%',
                background: `linear-gradient(90deg, rgba(230, 0, 94, 0.8), rgba(255, 77, 154, 0.8))`
              }}
              transition={{ duration: 0.1 }}
              className="h-full rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white/80">
                {isGameRunning ? '📈' : '⏸️'}
              </span>
            </div>
          </div>

          {/* 베팅 컨트롤 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 베팅액 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">베팅액</h3>
              <div className="flex items-center gap-4">
                <Slider
                  value={[betAmount]}
                  onValueChange={(value) => setBetAmount(value[0])}
                  max={Math.min(user.goldBalance, 5000)}
                  min={10}
                  step={10}
                  className="flex-1"
                  disabled={hasActiveBet || isGameRunning}
                />
                <div className="text-xl font-bold text-gold min-w-[120px]">
                  {betAmount.toLocaleString()}G
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setBetAmount(Math.min(amount, user.goldBalance))}
                    disabled={hasActiveBet || isGameRunning || user.goldBalance < amount}
                    className="border-border-secondary hover:border-primary text-xs"
                  >
                    {amount}G
                  </Button>
                ))}
              </div>
            </div>

            {/* 자동 캐시아웃 설정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">자동 캐시아웃</h3>
                <input
                  type="checkbox"
                  checked={isAutoCashEnabled}
                  onChange={(e) => setIsAutoCashEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[autoCashOut]}
                  onValueChange={(value) => setAutoCashOut(value[0])}
                  max={20}
                  min={1.1}
                  step={0.1}
                  className="flex-1"
                  disabled={!isAutoCashEnabled}
                />
                <div className="text-xl font-bold text-success min-w-[120px]">
                  {autoCashOut.toFixed(1)}x
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                  <Button
                    key={mult}
                    size="sm"
                    variant="outline"
                    onClick={() => setAutoCashOut(mult)}
                    disabled={!isAutoCashEnabled}
                    className="border-border-secondary hover:border-success text-xs"
                  >
                    {mult}x
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handlePlaceBet}
              disabled={hasActiveBet || isGameRunning || user.goldBalance < betAmount}
              className="h-14 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary text-white font-bold text-lg btn-hover-glow"
            >
              {hasActiveBet ? '베팅 완료' : '베팅 시작'}
              <DollarSign className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={handleCashOut}
              disabled={!hasActiveBet || hasCashedOut || !isGameRunning}
              className="h-14 bg-gradient-to-r from-success to-warning hover:from-success/80 hover:to-warning/80 text-white font-bold text-lg btn-hover-glow"
            >
              캐시아웃 ({hasActiveBet ? Math.floor(betAmount * multiplier).toLocaleString() : 0}G)
              <TrendingUp className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* 통계 및 기록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 크래시 포인트 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              최근 크래시 포인트
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {lastCrashMultipliers.length === 0 ? (
                <div className="col-span-5 text-center text-muted-foreground py-4">
                  게임 기록이 없습니다
                </div>
              ) : (
                lastCrashMultipliers.map((crash, index) => (
                  <div
                    key={index}
                    className={`text-center p-3 rounded-lg border ${
                      crash >= 10 ? 'bg-error/10 border-error/30 text-error' :
                      crash >= 5 ? 'bg-warning/10 border-warning/30 text-warning' :
                      crash >= 2 ? 'bg-success/10 border-success/30 text-success' :
                      'bg-primary/10 border-primary/30 text-primary'
                    }`}
                  >
                    <div className="text-sm font-bold">{crash.toFixed(2)}x</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* 게임 기록 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              최근 게임
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {gameHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  게임 기록이 없습니다
                </div>
              ) : (
                gameHistory.slice(0, 6).map((round, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      round.cashedOut 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-error/10 border border-error/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={round.cashedOut ? 'text-success' : 'text-error'}>
                        {round.cashedOut ? '✅' : '💥'}
                      </span>
                      <span className="text-sm">
                        {round.betAmount.toLocaleString()}G @ {round.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className={`font-bold text-sm ${
                      round.cashedOut ? 'text-success' : 'text-error'
                    }`}>
                      {round.cashedOut ? '+' : ''}{round.winnings.toLocaleString()}G
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* 게임 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-xl p-6 mt-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            게임 통계
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{gameStats.totalGames}</div>
              <div className="text-sm text-muted-foreground">총 게임</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="text-2xl font-bold text-success">{gameStats.cashOutCount}</div>
              <div className="text-sm text-muted-foreground">캐시아웃</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gold/10 border border-gold/20">
              <div className="text-2xl font-bold text-gradient-gold">
                {gameStats.totalWinnings.toLocaleString()}G
              </div>
              <div className="text-sm text-muted-foreground">총 수익</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {gameStats.biggestWin.toLocaleString()}G
              </div>
              <div className="text-sm text-muted-foreground">최대 승리</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-error/10 border border-error/20">
              <div className="text-2xl font-bold text-error">
                {gameStats.biggestMultiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-muted-foreground">최고 배율</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}