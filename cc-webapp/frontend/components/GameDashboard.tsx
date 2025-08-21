'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Crown,
  TrendingUp,
  Trophy,
  Heart,
  ExternalLink,
  Menu,
  Dice1,
  Swords,
  Gift,
  Zap,
  Coins,
  Play
} from 'lucide-react';
import { User, GameDashboardGame } from '../types';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { GameBackground } from './games/GameBackground';
import { GameCard } from './games/GameCard';
import { createLeaderboardData } from '../constants/gameConstants';
import { createGameNavigator, handleModelNavigation } from '../utils/gameUtils';

export interface GameDashboardProps {
  user: User;
  onNavigateToHome?: () => void;
  onNavigateToSlot?: () => void;
  onNavigateToRPS?: () => void;
  onNavigateToGacha?: () => void;
  onNavigateToCrash?: () => void;
  onUpdateUser?: (user: User) => void;
  onAddNotification?: (notification: any) => void;
  onToggleSideMenu?: () => void;
}

export function GameDashboard({
  user,
  onNavigateToHome,
  onNavigateToSlot,
  onNavigateToRPS,
  onNavigateToGacha,
  onNavigateToCrash,
  onUpdateUser,
  onAddNotification,
  onToggleSideMenu,
}: GameDashboardProps) {
  const [popularityIndex, setPopularityIndex] = useState(85);
  const [totalPlayTime] = useState(245);

  // 로컬 게임 데이터 (API 호출 없이)
  const games: GameDashboardGame[] = [
    {
      id: 'slot',
      name: '네온 슬롯',
      type: 'slot',
      icon: Dice1,
      color: 'from-purple-600 to-pink-600',  // 원래 네온 색상 복원
      description: '잭팟의 짜릿함! 네온 빛나는 슬롯머신',
      playCount: user.gameStats?.slot?.totalSpins || 0,
      bestScore: user.gameStats?.slot?.biggestWin || 0,
      lastPlayed: new Date(),
      difficulty: 'Easy',
      rewards: ['골드', '경험치', '특별 스킨'],
      trending: true,
      cost: 100
    },
    {
      id: 'rps',
      name: '가위바위보',
      type: 'rps',
      icon: Swords,
      color: 'from-blue-600 to-cyan-600',  // 원래 네온 색상 복원
      description: 'AI와 두뇌 대결! 승부의 짜릿함!',
      playCount: user.gameStats?.rps?.totalGames || 0,
      bestScore: user.gameStats?.rps?.bestStreak || 0,
      lastPlayed: new Date(),
      difficulty: 'Medium',
      rewards: ['골드', '전략 포인트', '승부사 배지'],
      trending: false,
      cost: 50
    },
    {
      id: 'gacha',
      name: '섹시 가챠',
      type: 'gacha',
      icon: Gift,
      color: 'from-pink-600 to-purple-600',  // 원래 네온 색상 복원
      description: '희귀 아이템 획득 찬스! 운명의 뽑기',
      playCount: user.gameStats?.gacha?.totalPulls || 0,
      bestScore: user.gameStats?.gacha?.legendaryPulls || 0,
      lastPlayed: new Date(),
      difficulty: 'Extreme',
      rewards: ['전설 아이템', '희귀 스킨', '특별 캐릭터'],
      trending: true,
      cost: 500
    },
    {
      id: 'crash',
      name: '네온 크래시',
      type: 'crash',
      icon: Zap,
      color: 'from-red-600 to-orange-600',  // 원래 네온 색상 복원
      description: '배율 상승의 스릴! 언제 터질까?',
      playCount: user.gameStats?.crash?.totalGames || 0,
      bestScore: Math.floor((user.gameStats?.crash?.highestMultiplier || 0) * 100),
      lastPlayed: new Date(),
      difficulty: 'Hard',
      rewards: ['대박 골드', '아드레날린 포인트'],
      trending: false,
      cost: 200
    }
  ];

  // 리더보드 데이터
  const leaderboardData = createLeaderboardData(user);
  
  // 게임 네비게이터
  const navigateToGame = createGameNavigator(games, user.goldBalance, onAddNotification ?? (() => {}), {
    onNavigateToSlot: onNavigateToSlot ?? (() => {}),
    onNavigateToRPS: onNavigateToRPS ?? (() => {}),
    onNavigateToGacha: onNavigateToGacha ?? (() => {}),
    onNavigateToCrash: onNavigateToCrash ?? (() => {}),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setPopularityIndex((prev: number) => {
        const change = Math.random() * 6 - 3;
        return Math.max(70, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 relative">
      <GameBackground />

      <div className="relative z-10">
        {/* Header - 네온 스타일 복원 */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/80 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-50"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSideMenu}
                  className="lg:hidden hover:bg-purple-500/20"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={onNavigateToHome}
                  className="flex items-center gap-2 hover:text-purple-400 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">홈으로</span>
                </Button>

                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden md:block">
                  게임 센터
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-yellow-500/50">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-yellow-400">
                    {user.goldBalance.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-purple-500/50">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">Lv.{user.level}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Stats Row - 네온 스타일 복원 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Popularity Index */}
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  인기도 지민
                </h3>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-yellow-400">
                  {popularityIndex.toFixed(1)}%
                </div>
                <Progress value={popularityIndex} className="h-2 bg-purple-900/50" />
                <p className="text-sm text-gray-400">현재 서버 활성도</p>
              </div>
            </div>

            {/* Total Play Time */}
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  오늘 플레이
                </h3>
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-yellow-400">
                  {Math.floor(totalPlayTime / 60)}시간 {totalPlayTime % 60}분
                </div>
                <Progress value={(totalPlayTime / 480) * 100} className="h-2 bg-purple-900/50" />
                <p className="text-sm text-gray-400">일일 목표: 8시간</p>
              </div>
            </div>

            {/* VIP Status */}
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  VIP 등급
                </h3>
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-yellow-400">
                  {(user.vipTier ?? 0) > 0 ? `VIP ${user.vipTier}` : 'Standard'}
                </div>
                <Progress
                  value={(user.vipTier ?? 0) > 0 ? ((user.vipTier ?? 0) / 5) * 100 : 10}
                  className="h-2 bg-purple-900/50"
                />
                <p className="text-sm text-gray-400">
                  {(user.vipTier ?? 0) > 0 ? '프리미엄 혜택 활성화' : '더 많은 혜택을 누리세요'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {games.map((game, index) => (
              <div key={game.id}>
                <GameCard
                  game={game}
                  index={index}
                  userGoldBalance={user.goldBalance}
                  onGameClick={navigateToGame}
                />
              </div>
            ))}
          </div>

          {/* Leaderboard Section - 네온 스타일 복원 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                리더보드
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                전체 순위
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboardData.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-black/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 border border-purple-500/30"
                >
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                        : index === 1
                          ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
                          : index === 2
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-black'
                            : 'bg-purple-900/50 text-purple-300'
                    }
                  `}
                  >
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{entry.name}</div>
                    <div className="text-sm text-gray-400">
                      {entry.score.toLocaleString()} 포인트
                    </div>
                  </div>
                  {index < 3 && (
                    <Sparkles
                      className={`w-5 h-5 ${
                        index === 0
                          ? 'text-yellow-400'
                          : index === 1
                            ? 'text-gray-400'
                            : 'text-orange-400'
                      }`}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default GameDashboard;
