'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
declare global {
  interface Window {
    _crashGameTarget?: number;
    _crashGameWin?: number;
    _crashGameIsWin?: boolean;
  }
}
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
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Settings,
  RefreshCw,
  BarChart2,
  // History 아이콘은 window.History (Illegal constructor) 네이티브 객체와 이름 충돌 가능성 있으므로 alias
  History as HistoryIcon,
} from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { api } from '@/lib/unifiedApi';
import { useWithReconcile } from '@/lib/sync';
import { useUserGold } from '@/hooks/useSelectors';
import { useGlobalStore, mergeProfile } from '@/store/globalStore';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { useGameTileStats } from '@/hooks/useGameStats';

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
  const crashStats = useGameTileStats('crash', user.gameStats?.crash);
  const withReconcile = useWithReconcile();
  const gold = useUserGold();
  const { dispatch } = useGlobalStore();
  const { syncAfterGame } = useGlobalSync();
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCashout, setAutoCashout] = useState(0);
  const [gameHistory, setGameHistory] = useState(
    [] as Array<{ multiplier: number; win: boolean; amount: number }>
  );
  const [lastCrashMultipliers, setLastCrashMultipliers] = useState([] as number[]);
  const [winAmount, setWinAmount] = useState(0);
  const [showGraph, setShowGraph] = useState(true);
  const [gameDataPoints, setGameDataPoints] = useState([] as Array<{ x: number; y: number }>);
  const [lastGameCurve, setLastGameCurve] = useState([] as Array<{ x: number; y: number }>);
  const [manualAutoCashout, setManualAutoCashout] = useState(2.0 as number);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [graphTimeScale, setGraphTimeScale] = useState(10); // 그래프 시간 스케일 (초)
  const [gameStartTime, setGameStartTime] = useState(0);
  // 오류 상태 및 재시도 트리거
  const [errorMessage, setErrorMessage] = useState(null as string | null);
  const [retryKey, setRetryKey] = useState(0);

  // Canvas 및 애니메이션 관련 Refs
  const canvasRef = useRef(null) as { current: HTMLCanvasElement | null };
  const animationRef = useRef(null) as { current: number | null };
  const lastTimestamp = useRef(null) as { current: number | null };

  // 서버 권위 GameStats (crash) - /games/stats/me
  const [authoritativeStats, setAuthoritativeStats] = useState(
    null as null | {
      total_bets: number;
      total_wins: number;
      total_losses: number;
      total_profit: number;
      highest_multiplier: number | null;
    }
  );
  const fetchAuthoritativeStats = useCallback(async () => {
    try {
      // Unified API: omit '/api' prefix
      const res = await api.get<any>('games/stats/me');
      if (res?.success && res.stats) {
        setAuthoritativeStats({
          total_bets: res.stats.total_bets ?? 0,
          total_wins: res.stats.total_wins ?? 0,
          total_losses: res.stats.total_losses ?? 0,
          total_profit: res.stats.total_profit ?? 0,
          highest_multiplier: res.stats.highest_multiplier ?? null,
        });
      }
    } catch (e) {
      console.warn('authoritative stats fetch 실패', e);
    }
  }, []);
  useEffect(() => {
    fetchAuthoritativeStats();
  }, [fetchAuthoritativeStats]);

  // 게임 시작 - 서버에서 실제 베팅 처리 (서버 권위; withReconcile로 멱등+재동기화)
  const startGame = async () => {
    if (gold < betAmount) {
      onAddNotification('베팅할 골드가 부족합니다.');
      return;
    }

    // 게임이 이미 실행 중이면 중복 시작 방지
    if (isRunning) {
      return;
    }

    try {
      // 이전 오류 상태 초기화
      setErrorMessage(null);
      // 서버에 크래시 베팅 요청 (멱등키 포함)
      const gameResult = await withReconcile(async (idemKey: string) =>
        api.post<any>(
          'games/crash/bet',
          {
            bet_amount: betAmount,
            auto_cashout_multiplier:
              showAdvancedSettings && manualAutoCashout > 0 ? manualAutoCashout : null,
          },
          { headers: { 'X-Idempotency-Key': idemKey } }
        )
      );

      // 서버에서 받은 게임 결과로 애니메이션 시작
      const finalMultiplier = gameResult.max_multiplier || 1.01;
      const winAmount = gameResult.win_amount || 0;
      const newBalance = gameResult?.balance ?? gameResult?.gold ?? gameResult?.gold_balance;
      if (typeof newBalance === 'number' && Number.isFinite(newBalance)) {
        mergeProfile(dispatch, { goldBalance: Number(newBalance) });
      }
      const isWin = gameResult.status === 'auto_cashed';

      // 이전 게임의 곡선 저장
      if (gameDataPoints.length > 0) {
        setLastGameCurve([...gameDataPoints]);
      }

      // 게임 상태 초기화
      setMultiplier(1.0);
      setIsRunning(true);
      setHasCashedOut(isWin);
      setWinAmount(winAmount);
      setGameDataPoints([]);

      // 자동 캐시아웃 설정
      if (showAdvancedSettings && manualAutoCashout > 0) {
        setAutoCashout(manualAutoCashout);
      }

      // 애니메이션을 위해 목표 멀티플라이어 설정
      window._crashGameTarget = finalMultiplier;
      window._crashGameWin = winAmount;
      window._crashGameIsWin = isWin;

      // 애니메이션 시작
      lastTimestamp.current = performance.now();
      animationRef.current = requestAnimationFrame(updateGame);

      // 통계는 별도 fetch, 잔액은 withReconcile 후 하이드레이트에 위임
      // 🎯 중요: mergeGameStats 제거 - 누적 버그 방지, 서버 권위 동기화만 사용
      // mergeGameStats(dispatch, 'crash', { ... }); // 제거됨
      
      // 서버잔액 포함되었더라도 후처리 스냅샷 동기화
      await syncAfterGame();
      fetchAuthoritativeStats();
    } catch (error) {
      console.error('크래시 게임 시작 실패:', error);
      const raw = (error as any)?.message || (typeof error === 'string' ? (error as string) : '');
      // 서버 표준 에러 포맷을 UX 메시지로 매핑
      const isServer500 = /HTTP_500|500\s+Internal|크래시 베팅 처리 오류/.test(raw);
      const userMsg = isServer500
        ? '일시적인 오류로 베팅을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
        : '게임 시작에 실패했습니다. 다시 시도해주세요.';
      setErrorMessage(userMsg);
      onAddNotification(userMsg);
      // 부분적으로 증가한 로컬 상태가 있으면 되돌림(실행 플래그 등)
      setIsRunning(false);
      setHasCashedOut(false);
    }
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

  // 그래프 그리기 함수
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 해상도 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 캔버스 초기화
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 격자 그리기
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 가로 격자
    for (let i = 0; i <= 5; i++) {
      const y = rect.height - (rect.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();

      // 멀티플라이어 수치 표시 (오른쪽에)
      if (i > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`${i}x`, rect.width - 5, y - 5);
      }
    }

    // 세로 격자
    for (let i = 0; i <= 5; i++) {
      const x = (rect.width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();

      // 시간 표시 (아래에)
      if (i > 0 && i < 5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round((i / 5) * graphTimeScale)}s`, x, rect.height - 5);
      }
    }

    // 이전 게임 곡선 그리기 (회색으로 표시)
    if (lastGameCurve.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      lastGameCurve.forEach((point: { x: number; y: number }, index: number) => {
        const x = (point.x / graphTimeScale) * rect.width;
        const y = rect.height - (point.y / 5) * rect.height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // 현재 게임 곡선 그리기
    if (gameDataPoints.length > 1) {
      // 네온 효과를 위한 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#ff0066');
      gradient.addColorStop(1, '#00ffff');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();

      gameDataPoints.forEach((point: { x: number; y: number }, index: number) => {
        const x = (point.x / graphTimeScale) * rect.width;
        const y = rect.height - (point.y / 5) * rect.height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // 마지막 포인트에 원 표시
      if (gameDataPoints.length > 0) {
        const lastPoint = gameDataPoints[gameDataPoints.length - 1];
        const x = (lastPoint.x / graphTimeScale) * rect.width;
        const y = rect.height - (lastPoint.y / 5) * rect.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0066';
        ctx.fill();
      }
    }
  }, [gameDataPoints, lastGameCurve, graphTimeScale]);

  // 게임 시작 시 그래프 초기화
  useEffect(() => {
    if (isRunning && showGraph) {
      drawGraph();
    }
  }, [isRunning, showGraph, drawGraph]);

  // 게임 업데이트 (애니메이션 프레임)
  const updateGame = useCallback(
    (timestamp: number) => {
      if (!lastTimestamp.current) {
        lastTimestamp.current = timestamp;
        setGameStartTime(timestamp);
        animationRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const elapsed = timestamp - lastTimestamp.current;
      lastTimestamp.current = timestamp;

      // 게임 시작 이후 경과 시간 (초)
      const elapsedGameTime = (timestamp - gameStartTime) / 1000;

      // 멀티플라이어 업데이트 (로그 곡선으로 증가)
      const growth = 1 + Math.log(multiplier) * 0.02;
      const newMultiplier = multiplier + growth * elapsed * 0.001;

      // 데이터 포인트 추가 (10프레임마다 한번)
      if (gameDataPoints.length === 0 || gameDataPoints.length % 10 === 0) {
        setGameDataPoints((prev: Array<{ x: number; y: number }>) => [
          ...prev,
          { x: elapsedGameTime, y: newMultiplier },
        ]);
      }

      // 그래프 업데이트
      if (showGraph && canvasRef.current) {
        drawGraph();
      }

      // 자동 캐시아웃 체크
      if (autoCashout > 0 && newMultiplier >= autoCashout && !hasCashedOut) {
        void cashout();
      }

      // 폭발 체크 (서버에서 받은 목표 멀티플라이어 사용)
      const targetMultiplier = (window as any)._crashGameTarget || 1.5;
      if (newMultiplier >= targetMultiplier) {
        gameCrashed(targetMultiplier);
        return;
      }

      setMultiplier(newMultiplier);
      animationRef.current = requestAnimationFrame(updateGame);
    },
    [
      multiplier,
      hasCashedOut,
      autoCashout,
      betAmount,
      gameStartTime,
      gameDataPoints,
      showGraph,
      drawGraph,
    ]
  );

  // 게임 캐시아웃 (서버 권위; withReconcile로 재동기화)
  const cashout = async () => {
    if (!isRunning || hasCashedOut) return;

    // 애니메이션 정지
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 획득 금액 계산
    const winnings = Math.floor(betAmount * multiplier);
    setWinAmount(winnings);

    // 서버에 캐시아웃 요청(필요 시). 현재 백엔드에 별도 캐시아웃 엔드포인트가 존재하면 사용
    try {
      console.log('[NeonCrashGame] 캐시아웃 요청 시작:', {
        multiplier,
        game_id: 'crash',
        endpoint: 'games/crash/cashout'
      });
      
      // 우선 멱등+재동기화만 수행하여 최종 잔액 일치 보장
      await withReconcile(async (idemKey: string) =>
        api.post<any>(
          'games/crash/cashout',
          { multiplier, game_id: 'crash' },
          { headers: { 'X-Idempotency-Key': idemKey } }
        )
      );
      
      console.log('[NeonCrashGame] 캐시아웃 요청 성공');
    } catch (e) {
      console.error('[NeonCrashGame] 캐시아웃 요청 실패:', e);
      // 캐시아웃 실패 시 오류 표시 + 재시도 유도
      const msg =
        (e as any)?.message ||
        (typeof e === 'string' ? (e as string) : '캐시아웃 처리에 실패했습니다. 다시 시도해주세요.');
      setErrorMessage(msg);
    }

    // 게임 상태 업데이트
    setHasCashedOut(true);
    setIsRunning(false);

    // 게임 기록 업데이트
    setGameHistory((prev: Array<{ multiplier: number; win: boolean; amount: number }>) => [
      {
        multiplier: multiplier,
        win: true,
        amount: winnings,
      },
      ...prev,
    ]);

    // 🎯 중요: mergeGameStats 제거 - 누적 버그 방지, 서버 권위 동기화만 사용
    // mergeGameStats(dispatch, 'crash', { ... }); // 제거됨

    await syncAfterGame();
    fetchAuthoritativeStats();

    // 알림
    onAddNotification(`${winnings} 골드를 획득했습니다! (${multiplier.toFixed(2)}x)`);
  };

  // 게임 종료 (크래시 또는 자동 캐시아웃)
  const gameCrashed = (finalMultiplier: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 최근 멀티플라이어 업데이트
    setLastCrashMultipliers((prev: number[]) => [finalMultiplier, ...prev].slice(0, 5));

    // 서버에서 받은 게임 결과 확인
    const isWin = (window as any)._crashGameIsWin || false;
    const serverWinAmount = (window as any)._crashGameWin || 0;

    if (isWin && serverWinAmount > 0) {
      // 자동 캐시아웃 성공
      setGameHistory((prev: Array<{ multiplier: number; win: boolean; amount: number }>) => [
        {
          multiplier: finalMultiplier,
          win: true,
          amount: serverWinAmount,
        },
        ...prev,
      ]);

      fetchAuthoritativeStats();

      onAddNotification(
        `자동 캐시아웃! ${serverWinAmount} 골드를 획득했습니다! (${finalMultiplier.toFixed(2)}x)`
      );
      setWinAmount(serverWinAmount);
      setHasCashedOut(true);
    } else {
      // 크래시 (패배)
      if (!hasCashedOut) {
        setGameHistory((prev: Array<{ multiplier: number; win: boolean; amount: number }>) => [
          {
            multiplier: finalMultiplier,
            win: false,
            amount: -betAmount,
          },
          ...prev,
        ]);

  void syncAfterGame();
  fetchAuthoritativeStats();

        onAddNotification(`크래시! ${finalMultiplier.toFixed(2)}x에서 터졌습니다.`);
      }
    }

    // 게임 종료
    setIsRunning(false);

    // 전역 변수 정리
    delete (window as any)._crashGameTarget;
    delete (window as any)._crashGameWin;
    delete (window as any)._crashGameIsWin;
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
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full" aria-label="뒤로가기">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient-primary">네온 크래시</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleSound} className="rounded-full" aria-label="사운드 토글">
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGraph(!showGraph)}
            className="rounded-full"
            aria-label="그래프 표시 토글"
          >
            <BarChart2
              className={`h-6 w-6 ${showGraph ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="rounded-full"
            aria-label="고급 설정 열기"
          >
            <Settings
              className={`h-6 w-6 ${
                showAdvancedSettings ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          </Button>
          <div className="text-xl font-bold">{gold.toLocaleString()} G</div>
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
          <div className="flex-1 flex flex-col items-center justify-center py-4 relative w-full">
            {errorMessage && (
              <div className="w-full max-w-xl mb-4 bg-destructive/15 border border-destructive/40 text-destructive px-4 py-3 rounded-lg shadow-sm animate-in fade-in">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-semibold mb-1">오류 발생</div>
                    <div className="text-sm leading-relaxed break-all">{errorMessage}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRetryKey((k: number) => k + 1);
                        void startGame();
                      }}
                    >
                      재시도
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setErrorMessage(null)}>
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* 그래프 영역 */}
            {showGraph && (
              <div className="w-full h-60 sm:h-72 md:h-80 mb-6 bg-background/30 rounded-lg p-3 border border-border/50 relative">
                <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }} />

                {/* 멀티플라이어 오버레이 - 그래프 위에 큰 숫자로 표시 */}
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        color: multiplier > 2 ? ['#ffffff', '#ff5555', '#ff0000'] : '#ffffff',
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                      }}
                      className="text-5xl sm:text-7xl font-bold text-center"
                      style={{
                        textShadow:
                          '0 0 10px rgba(255, 0, 102, 0.7), 0 0 20px rgba(255, 0, 102, 0.5)',
                      }}
                    >
                      {multiplier.toFixed(2)}x
                    </motion.div>
                  </motion.div>
                )}

                {/* 그래프 설정 버튼 */}
                <div className="absolute bottom-3 right-3 flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0 bg-background/50"
                    onClick={() => setGraphTimeScale(Math.max(5, graphTimeScale - 5))}
                    disabled={isRunning}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0 bg-background/50"
                    onClick={() => setGraphTimeScale(graphTimeScale + 5)}
                    disabled={isRunning}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 멀티플라이어 표시 - 그래프 없을 때만 큰 숫자로 표시 */}
            {!showGraph && (
              <motion.div
                animate={{
                  scale: isRunning ? [1, 1.05, 1] : 1,
                  color:
                    isRunning && multiplier > 2 ? ['#ffffff', '#ff5555', '#ff0000'] : '#ffffff',
                }}
                transition={{
                  repeat: isRunning ? Infinity : 0,
                  duration: 1.5,
                }}
                className="text-7xl md:text-9xl font-bold text-center mb-6"
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            )}

            {/* 최근 멀티플라이어 목록 */}
            <div className="flex space-x-2 my-4 justify-center">
              {lastCrashMultipliers.map((crash: number, index: number) => (
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

            {/* 고급 설정 영역 */}
            <AnimatePresence>
              {showAdvancedSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md bg-background/30 rounded-lg p-4 mb-4 overflow-hidden"
                >
                  <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                    <span className="flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-primary" />
                      고급 설정
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-full p-0"
                      onClick={() => setShowAdvancedSettings(false)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </h4>

                  {/* 자동 캐시아웃 슬라이더 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-muted-foreground">
                        자동 캐시아웃 멀티플라이어
                      </label>
                      <div className="text-xs font-medium">{manualAutoCashout.toFixed(2)}x</div>
                    </div>
                    <Slider
                      min={1.01}
                      max={10}
                      step={0.01}
                      value={[manualAutoCashout]}
                      onValueChange={(values: number[]) => setManualAutoCashout(values[0])}
                      disabled={isRunning}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1.01x</span>
                      <span>10.00x</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">자동 캐시아웃 적용</span>
                    <Button
                      variant={autoCashout > 0 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeAutoCashout(autoCashout > 0 ? 0 : manualAutoCashout)}
                      disabled={isRunning}
                      className="h-7 min-w-[80px]"
                    >
                      {autoCashout > 0 ? '켜짐' : '꺼짐'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 게임 컨트롤 */}
            <div className="w-full max-w-md mt-3 space-y-4">
              {/* 베팅 금액 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">베팅 금액</label>
                  <div className="text-sm font-medium">{betAmount} G</div>
                </div>

                {/* 슬라이더 추가 */}
                <div className="py-2 px-1">
                  <Slider
                    min={1}
                    max={Math.min(gold, 1000)}
                    step={1}
                    value={[betAmount]}
                    onValueChange={(values: number[]) => changeBetAmount(values[0])}
                    disabled={isRunning}
                    className="my-2"
                  />
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

              {/* 퀵 자동 캐시아웃 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground">자동 캐시아웃</label>
                  <div className="text-sm font-medium">
                    {autoCashout > 0 ? `${autoCashout.toFixed(2)}x` : '없음'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeAutoCashout(10.0)}
                    disabled={isRunning}
                    className={autoCashout === 10.0 ? 'bg-primary/20' : ''}
                  >
                    10.0x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedSettings(true)}
                    disabled={isRunning}
                    className="bg-background/50"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    커스텀
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
                    disabled={gold < betAmount}
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
              {/* History 네이티브 객체(브라우저 History)와 충돌 방지 위해 HistoryIcon 사용 */}
              <HistoryIcon className="w-5 h-5 text-primary" />
              최근 게임 기록
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {gameHistory.length > 0 ? (
                gameHistory
                  .slice(0, 8)
                  .map(
                    (game: { multiplier: number; win: boolean; amount: number }, index: number) => (
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
                    )
                  )
              ) : (
                <div className="text-center text-muted-foreground py-4">게임 기록이 없습니다</div>
              )}
            </div>

            {gameHistory.length > 0 && (
              <div className="flex justify-end mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setGameHistory([])}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  기록 초기화
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
