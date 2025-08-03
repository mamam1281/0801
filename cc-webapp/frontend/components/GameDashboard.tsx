'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Sparkles,
  Swords,
  Crown,
  TrendingUp,
  Star,
  Target,
  Timer,
  Coins,
  Gift,
  Dice1,
  RotateCcw,
  Play,
  Trophy,
  Users,
  Eye,
  Heart,
  ExternalLink,
  Menu,
  Zap
} from 'lucide-react';
import { User } from '../types';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface GameDashboardProps {
  user: User;
  onNavigateToHome: () => void;
  onNavigateToSlot: () => void;
  onNavigateToRPS: () => void;
  onNavigateToGacha: () => void;
  onNavigateToCrash: () => void; // 🚀 새로운 크래시 게임
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
  onToggleSideMenu: () => void;
}

interface GameStats {
  id: string;
  name: string;
  type: 'slot' | 'rps' | 'gacha' | 'crash'; // 🚫 룰렛 제거
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  playCount: number;
  bestScore: number;
  lastPlayed: Date | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  rewards: string[];
  players: number;
  trending: boolean;
  cost: number;
}

export function GameDashboard({
  user,
  onNavigateToHome,
  onNavigateToSlot,
  onNavigateToRPS,
  onNavigateToGacha,
  onNavigateToCrash, // 🚀 새로운 크래시 게임
  onUpdateUser,
  onAddNotification,
  onToggleSideMenu
}: GameDashboardProps) {
  const [popularityIndex, setPopularityIndex] = useState(85);
  const [totalPlayTime, setTotalPlayTime] = useState(245);

  const games: GameStats[] = [
    {
      id: 'slot',
      name: '네온 슬롯',
      type: 'slot',
      icon: Dice1,
      color: 'from-primary to-primary-light',
      description: '운을 시험해보세요! 잭팟의 짜릿함!',
      playCount: user.gameStats?.slot?.totalSpins || 0,
      bestScore: user.gameStats?.slot?.biggestWin || 0,
      lastPlayed: new Date(),
      difficulty: 'Easy',
      rewards: ['골드', '경험치', '특별 스킨'],
      players: Math.floor(Math.random() * 1000) + 2000,
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
      players: Math.floor(Math.random() * 800) + 1500,
      trending: false,
      cost: 50
    },
    {
      id: 'gacha',
      name: '가챠 뽑기',
      type: 'gacha',
      icon: Gift,
      color: 'from-error to-warning',
      description: '전설의 아이템을 뽑아보세요!',
      playCount: user.gameStats?.gacha?.totalPulls || 0,
      bestScore: user.gameStats?.gacha?.legendaryPulls || 0,
      lastPlayed: new Date(),
      difficulty: 'Extreme',
      rewards: ['전설 아이템', '희귀 스킨', '특별 캐릭터'],
      players: Math.floor(Math.random() * 2000) + 3000,
      trending: true,
      cost: 500
    },
    // 🚀 새로운 네온 크래시 게임
    {
      id: 'crash',
      name: '네온 크래시',
      type: 'crash',
      icon: Zap,
      color: 'from-error to-primary',
      description: '배율 상승의 스릴! 언제 터질까?',
      playCount: user.gameStats?.crash?.totalGames || 0,
      bestScore: user.gameStats?.crash?.highestMultiplier || 0,
      lastPlayed: new Date(),
      difficulty: 'Hard',
      rewards: ['고배율 골드', '크래시 배지', '스릴 포인트'],
      players: Math.floor(Math.random() * 1500) + 2500,
      trending: true,
      cost: 100
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPopularityIndex(prev => {
        const change = Math.random() * 6 - 3;
        return Math.max(70, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const navigateToGame = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (user.goldBalance < game.cost) {
      onAddNotification(`💰 골드가 부족합니다! (필요: ${game.cost}G)`);
      return;
    }

    switch (gameId) {
      case 'slot':
        onNavigateToSlot();
        break;
      case 'rps':
        onNavigateToRPS();
        break;
      case 'gacha':
        onNavigateToGacha();
        break;
      case 'crash': // 🚀 새로운 크래시 게임
        onNavigateToCrash();
        break;
    }

    // 🚫 일반 게임 입장 알림 제거 (VIP 알림만)
  };

  const handleModelNavigation = () => {
    if (typeof window !== 'undefined') {
      window.open('https://local.com', '_blank');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'Hard': return 'text-error';
      case 'Extreme': return 'text-gradient-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary-soft relative overflow-hidden pb-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0, 1.5, 0],
              rotate: 360
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-gold rounded-full"
          />
        ))}
      </div>

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
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                게임
              </h1>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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
          className="glass-effect rounded-2xl p-4 mb-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl lg:text-2xl font-bold text-gold">
                {(user.goldBalance || 0).toLocaleString()}G
              </div>
              <div className="text-sm text-muted-foreground">보유 골드</div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold text-primary">
                레벨 {user.level}
              </div>
              <div className="text-sm text-muted-foreground">현재 레벨</div>
            </div>
            <div>
              <motion.div
                animate={{ scale: popularityIndex > 90 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: popularityIndex > 90 ? Infinity : 0 }}
                className={`text-xl lg:text-2xl font-bold ${
                  popularityIndex > 90 ? 'text-error' : 'text-success'
                }`}
              >
                {Math.round(popularityIndex)}%
              </motion.div>
              <div className="text-sm text-muted-foreground">인기도 지수</div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold text-warning">
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
          className="glass-effect rounded-xl p-4 mb-6 border-2 border-success/30 soft-glow cursor-pointer card-hover-float"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-success to-warning rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-success">프리미엄 모델 체험</div>
                <div className="text-sm text-muted-foreground">더 많은 포인트를 획득하고 특별한 혜택을 누리세요</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gold font-bold">+50P</div>
              <div className="text-xs text-muted-foreground">방문시 획득</div>
            </div>
          </div>
        </motion.div>

        {/* Games Grid - 4개 게임 (룰렛 제거, 크래시 추가) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`glass-effect rounded-2xl p-6 relative overflow-hidden card-hover-float ${
                game.trending ? 'border-2 border-primary soft-glow' : ''
              }`}
            >
              {game.trending && (
                <div className="absolute top-4 right-4 bg-error text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                  🔥 HOT
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${game.color} rounded-xl flex items-center justify-center`}>
                  <game.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {(game.players || 0).toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-xs text-gold">
                      <Coins className="w-3 h-3" />
                      {game.cost}G
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{game.playCount}</div>
                  <div className="text-xs text-muted-foreground">플레이 수</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gold">{(game.bestScore || 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">최고 기록</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-success">
                    {game.lastPlayed ? '최근' : '미플레이'}
                  </div>
                  <div className="text-xs text-muted-foreground">마지막 플레이</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-foreground mb-2">보상:</div>
                <div className="flex flex-wrap gap-1">
                  {game.rewards.map((reward, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-secondary/50 text-foreground px-2 py-1 rounded-full"
                    >
                      {reward}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => navigateToGame(game.id)}
                disabled={user.goldBalance < game.cost}
                className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift`}
              >
                <Play className="w-5 h-5" />
                {user.goldBalance < game.cost ? `골드 부족 (${game.cost}G 필요)` : '지금 플레이'}
              </Button>

              <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <motion.span
                  key={game.players}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {Math.floor(game.players + Math.random() * 100 - 50)}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            라이브 이벤트
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-effect rounded-xl p-6 border-2 border-gold/30 gold-soft-glow card-hover-float"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="font-bold text-gold">골든 아워</div>
                  <div className="text-sm text-muted-foreground">
                    모든 게임에서 골드 3배 획득!
                  </div>
                </div>
              </div>
              <div className="bg-gold-soft rounded-lg p-3 text-center">
                <div className="text-gold font-bold">23:45:30 남음</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-effect rounded-xl p-6 border-2 border-primary/30 soft-glow card-hover-float"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-game rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-primary">럭키 타임</div>
                  <div className="text-sm text-muted-foreground">
                    행운 보너스 확률 2배!
                  </div>
                </div>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2 text-center">
                65% 활성화
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
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            실시간 순위
          </h2>
          <div className="glass-effect rounded-xl p-6">
            <div className="space-y-3">
              {[
                { rank: 1, name: '레전드게이머', score: 125640, trend: 'up' },
                { rank: 2, name: 'ProPlayer2024', score: 98230, trend: 'up' },
                { rank: 3, name: user.nickname, score: user.stats.totalEarnings, trend: 'same' },
                { rank: 4, name: 'GameMaster', score: 87150, trend: 'down' },
                { rank: 5, name: 'ClickKing', score: 75680, trend: 'up' }
              ].map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg card-hover-float ${
                    player.name === user.nickname 
                      ? 'bg-primary-soft border border-primary/30' 
                      : 'bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      player.rank === 1 ? 'bg-gold text-black' :
                      player.rank === 2 ? 'bg-muted text-foreground' :
                      player.rank === 3 ? 'bg-warning text-black' :
                      'bg-secondary text-foreground'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        player.name === user.nickname ? 'text-primary' : 'text-foreground'
                      }`}>
                        {player.name} {player.name === user.nickname && '(나)'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gold">
                      {(player.score || 0).toLocaleString()}G
                    </span>
                    {player.trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                    {player.trend === 'down' && <TrendingUp className="w-4 h-4 text-error rotate-180" />}
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