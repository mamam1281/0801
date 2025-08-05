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

interface NeonCrashGameProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

export function NeonCrashGame({
  user,
  onBack,
  onUpdateUser,
  onAddNotification,
}: NeonCrashGameProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCashout, setAutoCashout] = useState(0);
  const [gameHistory, setGameHistory] = useState<
    Array<{ multiplier: number; win: boolean; amount: number }>
  >([]);
  const [lastCrashMultipliers, setLastCrashMultipliers] = useState<number[]>([
    1.2, 3.7, 1.5, 8.2, 2.1,
  ]);
  const [winAmount, setWinAmount] = useState(0);
  const animationRef = useRef<number>();
  const lastTimestamp = useRef<number>();

  // 게임 세션 통계
  const [sessionStats, setSessionStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    highestMultiplier: 0,
    totalProfit: 0,
  });

  // 게임 시작
  const startGame = () => {
    if (user.goldBalance < betAmount) {
      onAddNotification('베팅할 골드가 부족합니다.');
      return;
    }

    // 유저 잔액 차감
    onUpdateUser({
      ...user,
      goldBalance: user.goldBalance - betAmount,
      gameStats: {
        ...user.gameStats,
        crash: {
          ...user.gameStats.crash,
          totalGames: user.gameStats.crash.totalGames + 1,
        },
      },
    });

    // 게임 상태 초기화
    setMultiplier(1.0);
    setIsRunning(true);
    setHasCashedOut(false);
    setWinAmount(0);

    // 애니메이션 시작
    lastTimestamp.current = performance.now();
    animationRef.current = requestAnimationFrame(updateGame);

    // 세션 통계 업데이트
    setSessionStats((prev) => ({
      ...prev,
      totalBets: prev.totalBets + 1,
    }));
  };

  // 서버/클라이언트 사이드 렌더링을 위한 안전한 난수 생성기
  const getRandomValue = useCallback(() => {
    // 클라이언트 사이드에서만 Math.random() 사용
    if (typeof window !== 'undefined') {
      return Math.random();
    }
    // 서버 사이드에서는 고정된 값 반환
    return 0.5;
  }, []);

  // 게임 업데이트 (애니메이션 프레임)
  const updateGame = useCallback(
    (timestamp: number) => {
      if (!lastTimestamp.current) {
        lastTimestamp.current = timestamp;
        animationRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const elapsed = timestamp - lastTimestamp.current;
      lastTimestamp.current = timestamp;

      // 멀티플라이어 업데이트 (로그 곡선으로 증가)
      const growth = 1 + Math.log(multiplier) * 0.02;
      const newMultiplier = multiplier + growth * elapsed * 0.001;

      // 자동 캐시아웃 체크
      if (autoCashout > 0 && newMultiplier >= autoCashout && !hasCashedOut) {
        cashout();
      }

      // 폭발 체크 (랜덤 시드 기반)
      const crashProbability = 0.01 + newMultiplier * 0.005;
      if (getRandomValue() < crashProbability) {
        gameCrashed(newMultiplier);
        return;
      }

      setMultiplier(newMultiplier);
      animationRef.current = requestAnimationFrame(updateGame);
    },
    [multiplier, hasCashedOut, autoCashout, betAmount]
  );

  // 게임 캐시아웃
  const cashout = () => {
    if (!isRunning || hasCashedOut) return;

    // 애니메이션 정지
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 획득 금액 계산
    const winnings = Math.floor(betAmount * multiplier);
    setWinAmount(winnings);

    // 유저 잔액 증가 및 통계 업데이트
    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance + winnings,
      gameStats: {
        ...user.gameStats,
        crash: {
          ...user.gameStats.crash,
          totalCashedOut: user.gameStats.crash.totalCashedOut + 1,
          highestMultiplier: Math.max(user.gameStats.crash.highestMultiplier, multiplier),
          averageMultiplier:
            (user.gameStats.crash.averageMultiplier * user.gameStats.crash.totalCashedOut +
              multiplier) /
            (user.gameStats.crash.totalCashedOut + 1),
        },
      },
    };
    onUpdateUser(updatedUser);

    // 게임 상태 업데이트
    setHasCashedOut(true);
    setIsRunning(false);

    // 게임 기록 업데이트
    setGameHistory((prev) => [
      {
        multiplier: multiplier,
        win: true,
        amount: winnings,
      },
      ...prev,
    ]);

    // 세션 통계 업데이트
    setSessionStats((prev) => ({
      ...prev,
      wins: prev.wins + 1,
      highestMultiplier: Math.max(prev.highestMultiplier, multiplier),
      totalProfit: prev.totalProfit + (winnings - betAmount),
    }));

    // 알림
    onAddNotification(`${winnings} 골드를 획득했습니다! (${multiplier.toFixed(2)}x)`);
  };

  // 게임 폭발 (패배)
  const gameCrashed = (finalMultiplier: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 최근 멀티플라이어 업데이트
    setLastCrashMultipliers((prev) => [finalMultiplier, ...prev].slice(0, 5));

    // 게임 기록 업데이트
    if (!hasCashedOut) {
      setGameHistory((prev) => [
        {
          multiplier: finalMultiplier,
          win: false,
          amount: -betAmount,
        },
        ...prev,
      ]);

      // 세션 통계 업데이트
      setSessionStats((prev) => ({
        ...prev,
        losses: prev.losses + 1,
        totalProfit: prev.totalProfit - betAmount,
      }));
    }

    // 게임 종료
    setIsRunning(false);
  };

  // 베팅 금액 변경
  const changeBetAmount = (amount: number) => {
    if (!isRunning) {
      setBetAmount(Math.max(1, amount));
    }
  };

  // 자동 캐시아웃 설정
  const changeAutoCashout = (value: number) => {
    if (!isRunning) {
      setAutoCashout(value);
    }
  };

  // 소리 설정 토글
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-error/10 relative overflow-hidden">
      {/* 동적 배경 */}
      <motion.div
        animate={{
          background: isRunning
            ? 'radial-gradient(circle, rgba(255,0,68,0.05) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)',
        }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient-primary">네온 크래시</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleSound} className="rounded-full">
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          <div className="text-xl font-bold">{user.goldBalance.toLocaleString()} G</div>
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 게임 화면 (왼쪽 2/3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-effect rounded-2xl overflow-hidden p-6 flex flex-col"
        >
          {/* 게임 영역 */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 relative">
            {/* 멀티플라이어 표시 */}
            <motion.div
              animate={{
                scale: isRunning ? [1, 1.05, 1] : 1,
                color: isRunning && multiplier > 2 ? ['#ffffff', '#ff5555', '#ff0000'] : '#ffffff',
              }}
              transition={{
                repeat: isRunning ? Infinity : 0,
                duration: 1.5,
              }}
              className="text-7xl md:text-9xl font-bold text-center mb-6"
            >
              {multiplier.toFixed(2)}x
            </motion.div>

            {/* 최근 멀티플라이어 목록 */}
            <div className="flex space-x-2 my-4 justify-center">
              {lastCrashMultipliers.map((crash, index) => (
                <div
                  key={index}
                  className={`rounded-md px-3 py-1 text-sm ${
                    crash > 2 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                  }`}
                >
                  <div className="text-sm font-bold">{crash.toFixed(2)}x</div>
                </div>
              ))}
            </div>

            {/* 게임 컨트롤 */}
            <div className="w-full max-w-md mt-8 space-y-4">
              {/* 베팅 금액 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">베팅 금액</label>
                  <div className="text-sm font-medium">{betAmount} G</div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(Math.max(1, betAmount - 10))}
                    disabled={isRunning}
                  >
                    -10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(Math.max(1, betAmount - 50))}
                    disabled={isRunning}
                  >
                    -50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(betAmount + 10)}
                    disabled={isRunning}
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(betAmount + 50)}
                    disabled={isRunning}
                  >
                    +50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(betAmount * 2)}
                    disabled={isRunning}
                  >
                    x2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeBetAmount(Math.floor(betAmount / 2))}
                    disabled={isRunning}
                  >
                    /2
                  </Button>
                </div>
              </div>

              {/* 자동 캐시아웃 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">자동 캐시아웃</label>
                  <div className="text-sm font-medium">
                    {autoCashout > 0 ? `${autoCashout.toFixed(2)}x` : '없음'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeAutoCashout(0)}
                    disabled={isRunning}
                    className={autoCashout === 0 ? 'bg-primary/20' : ''}
                  >
                    없음
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeAutoCashout(1.5)}
                    disabled={isRunning}
                    className={autoCashout === 1.5 ? 'bg-primary/20' : ''}
                  >
                    1.5x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeAutoCashout(2.0)}
                    disabled={isRunning}
                    className={autoCashout === 2.0 ? 'bg-primary/20' : ''}
                  >
                    2.0x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeAutoCashout(5.0)}
                    disabled={isRunning}
                    className={autoCashout === 5.0 ? 'bg-primary/20' : ''}
                  >
                    5.0x
                  </Button>
                </div>
              </div>

              {/* 게임 버튼 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {!isRunning ? (
                  <Button
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/80 h-14 rounded-xl text-lg font-bold"
                    onClick={startGame}
                    disabled={user.goldBalance < betAmount}
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    게임 시작
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-success text-white hover:bg-success/80 h-14 rounded-xl text-lg font-bold animate-pulse"
                    onClick={cashout}
                    disabled={hasCashedOut}
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    캐시아웃 ({Math.floor(betAmount * multiplier)} G)
                  </Button>
                )}

                {winAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center h-14 rounded-xl bg-success/20 text-success text-lg font-bold"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    획득: {winAmount} G
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 사이드 패널 (오른쪽 1/3) */}
        <div className="space-y-6">
          {/* 최근 게임 기록 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              최근 게임 기록
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {gameHistory.length > 0 ? (
                gameHistory.slice(0, 6).map((game, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      game.win
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-error/10 border border-error/20'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{game.multiplier.toFixed(2)}x</span>
                      <span className="text-xs text-muted-foreground">베팅: {betAmount} G</span>
                    </div>
                    <div className={`font-bold ${game.win ? 'text-success' : 'text-error'}`}>
                      {game.win ? '+' : ''}
                      {game.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">게임 기록이 없습니다</div>
              )}
            </div>
          </motion.div>

          {/* 게임 통계 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              게임 통계
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">총 게임 수</div>
                  <div className="font-bold">{user.gameStats.crash.totalGames}</div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">최고 멀티플라이어</div>
                  <div className="font-bold text-primary">
                    {user.gameStats.crash.highestMultiplier.toFixed(2)}x
                  </div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">캐시아웃 횟수</div>
                  <div className="font-bold">{user.gameStats.crash.totalCashedOut}</div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">평균 멀티플라이어</div>
                  <div className="font-bold">
                    {user.gameStats.crash.averageMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* 세션 통계 */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-error" />
                  현재 세션
                </h4>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">승리</div>
                    <div className="font-medium text-success">{sessionStats.wins}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">패배</div>
                    <div className="font-medium text-error">{sessionStats.losses}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">승률</div>
                    <div className="font-medium">
                      {sessionStats.totalBets > 0
                        ? Math.floor((sessionStats.wins / sessionStats.totalBets) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded bg-background/50 flex justify-between items-center">
                  <div className="text-xs">총 수익:</div>
                  <div
                    className={`font-bold ${
                      sessionStats.totalProfit > 0
                        ? 'text-success'
                        : sessionStats.totalProfit < 0
                          ? 'text-error'
                          : ''
                    }`}
                  >
                    {sessionStats.totalProfit > 0 ? '+' : ''}
                    {sessionStats.totalProfit} G
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}