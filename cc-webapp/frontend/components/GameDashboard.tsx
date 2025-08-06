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
  Dice1,    // 추가
  Swords,   // 추가
  Gift,     // 추가
  Zap,      // 추가
} from 'lucide-react';
import { User, GameDashboardGame } from '../types';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { GameBackground } from './games/GameBackground';
import { GameCard } from './games/GameCard';
import { createLeaderboardData } from '../constants/gameConstants';
import { createGameNavigator, handleModelNavigation } from '../utils/gameUtils';
import { gameApi } from '../utils/apiClient';
import { Game } from '../types/game';

interface GameDashboardProps {
  user: User;
  onNavigateToHome: () => void;
  onNavigateToSlot: () => void;
  onNavigateToRPS: () => void;
  onNavigateToGacha: () => void;
  onNavigateToCrash: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
  onToggleSideMenu: () => void;
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

  // API 관련 state 제거하고 실제 구현된 게임 데이터 사용
  const games: GameDashboardGame[] = [
    {
      id: 'slot',
      name: '네온 슬롯',
      type: 'slot',
      icon: Dice1,
      color: 'from-primary to-primary-light',
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
      color: 'from-success to-info',
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
      color: 'from-pink-500 to-purple-500',
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
      color: 'from-error to-primary',
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
  const navigateToGame = createGameNavigator(games, user.goldBalance, onAddNotification, {
    onNavigateToSlot,
    onNavigateToRPS,
    onNavigateToGacha,
    onNavigateToCrash,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setPopularityIndex((prev) => {
        const change = Math.random() * 6 - 3;
        return Math.max(70, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary-soft relative overflow-hidden pb-20">
      {/* Animated Background */}
      <GameBackground />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-border-secondary backdrop-blur-sm"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onToggleSideMenu}
              className="h-11 w-11 p-0 border-2 border-border-secondary hover:border-primary hover:bg-primary/10 focus:border-primary focus:bg-primary/10 transition-all duration-200 touch-manipulation"
              aria-label="메뉴 열기"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Menu className="w-5 h-5" />
              </motion.div>
            </Button>

            <Button
              variant="outline"
              onClick={onNavigateToHome}
              className="border-border-secondary hover:border-primary btn-hover-lift"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>

            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">게임</h1>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleModelNavigation}
              className="bg-gradient-to-r from-success to-warning text-white font-bold px-4 py-2 rounded-lg btn-hover-lift relative"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>프리미엄 모델</span>
                <ExternalLink className="w-3 h-3" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gold text-black text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                +P
              </div>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 max-w-7xl mx-auto">
        {/* User Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-metal rounded-2xl p-6 mb-8 border-primary/20 metal-shine"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="glass-metal bg-gold/10 rounded-xl p-4 border-gold/20">
              <div className="text-2xl lg:text-3xl font-black text-gradient-gold mb-1">
                {user.goldBalance.toLocaleString()}G
              </div>
              <div className="text-sm text-muted-foreground">보유 골드</div>
            </div>
            <div className="glass-metal bg-primary/10 rounded-xl p-4 border-primary/20">
              <div className="text-2xl lg:text-3xl font-black text-gradient-primary mb-1">
                레벨 {user.level}
              </div>
              <div className="text-sm text-muted-foreground">현재 레벨</div>
            </div>
            <div className="glass-metal bg-success/10 rounded-xl p-4 border-success/20">
              <motion.div
                animate={{ scale: popularityIndex > 90 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: popularityIndex > 90 ? Infinity : 0 }}
                className={`text-2xl lg:text-3xl font-black mb-1 ${
                  popularityIndex > 90 ? 'text-error' : 'text-success'
                }`}
              >
                {Math.round(popularityIndex)}%
              </motion.div>
              <div className="text-sm text-muted-foreground">인기도 지수</div>
            </div>
            <div className="glass-metal bg-warning/10 rounded-xl p-4 border-warning/20">
              <div className="text-2xl lg:text-3xl font-black text-warning mb-1">
                {totalPlayTime}분
              </div>
              <div className="text-sm text-muted-foreground">오늘 플레이</div>
            </div>
          </div>
        </motion.div>

        {/* Premium Model Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleModelNavigation}
          className="glass-metal rounded-xl p-6 mb-8 border-2 border-success/30 soft-glow cursor-pointer glass-metal-hover metal-shine"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-success to-warning rounded-xl flex items-center justify-center glass-metal metal-shine">
                <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <div className="text-xl font-bold text-gradient-metal mb-1">프리미엄 모델 체험</div>
                <div className="text-sm text-muted-foreground">
                  더 많은 포인트를 획득하고 특별한 혜택을 누리세요
                </div>
              </div>
            </div>
            <div className="text-right glass-metal bg-gold/10 rounded-xl p-4 border-gold/30">
              <div className="text-2xl font-black text-gradient-gold">+50P</div>
              <div className="text-xs text-muted-foreground">방문시 획득</div>
            </div>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              index={index}
              userGoldBalance={user.goldBalance}
              onGameClick={navigateToGame}
            />
          ))}
        </div>

        {/* Live Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-gradient-metal mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-gold" />
            라이브 이벤트
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-metal rounded-xl p-6 border-2 border-gold/30 gold-soft-glow glass-metal-hover metal-shine"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-gold rounded-xl flex items-center justify-center glass-metal">
                  <Trophy className="w-8 h-8 text-black drop-shadow-lg" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gradient-gold">골든 아워</div>
                  <div className="text-sm text-muted-foreground">모든 게임에서 골드 3배 획득!</div>
                </div>
              </div>
              <div className="glass-metal bg-gold/10 rounded-xl p-4 text-center border-gold/20">
                <div className="text-xl font-black text-gradient-gold">23:45:30 남음</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-metal rounded-xl p-6 border-2 border-primary/30 soft-glow glass-metal-hover metal-shine"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-game rounded-xl flex items-center justify-center glass-metal">
                  <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gradient-primary">럭키 타임</div>
                  <div className="text-sm text-muted-foreground">행운 보너스 확률 2배!</div>
                </div>
              </div>
              <div className="glass-metal bg-primary/10 rounded-xl p-4 border-primary/20">
                <Progress value={65} className="h-3 mb-2" />
                <div className="text-sm text-center font-medium text-primary">65% 활성화 중</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Leaderboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-gradient-metal mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-success" />
            실시간 순위
          </h2>
          <div className="glass-metal rounded-xl p-6 metal-shine">
            <div className="space-y-4">
              {leaderboardData.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl glass-metal-hover glass-metal ${
                    player.name === user.nickname
                      ? 'border-2 border-primary/40 bg-primary/10 metal-pulse'
                      : 'border border-border-secondary/50 bg-secondary/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg glass-metal ${
                        player.rank === 1
                          ? 'bg-gradient-gold text-black'
                          : player.rank === 2
                            ? 'bg-gradient-metal text-foreground border-2 border-muted'
                            : player.rank === 3
                              ? 'bg-gradient-to-r from-warning to-gold text-black'
                              : 'bg-secondary text-foreground border border-border-secondary'
                      }`}
                    >
                      {player.rank}
                    </div>
                    <div>
                      <div
                        className={`font-bold text-lg ${
                          player.name === user.nickname
                            ? 'text-gradient-primary'
                            : 'text-foreground'
                        }`}
                      >
                        {player.name} {player.name === user.nickname && '(나)'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-gradient-gold">
                      {player.score.toLocaleString()}G
                    </span>
                    {player.trend === 'up' && <TrendingUp className="w-5 h-5 text-success" />}
                    {player.trend === 'down' && (
                      <TrendingUp className="w-5 h-5 text-error rotate-180" />
                    )}
                    {player.trend === 'same' && (
                      <div className="w-5 h-5 rounded-full bg-muted/50"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default GameDashboard;
