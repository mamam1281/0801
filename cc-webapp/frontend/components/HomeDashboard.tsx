'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  TrendingUp, 
  Gift, 
  Zap, 
  Trophy, 
  Star,
  Settings,
  LogOut,
  Timer,
  Coins,
  ChevronRight,
  BarChart3,
  Medal,
  Gem,
  Sparkles,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { User } from '../types';
import { calculateExperiencePercentage, calculateWinRate, checkLevelUp } from '../utils/userUtils';
import { QUICK_ACTIONS, ACHIEVEMENTS_DATA } from '../constants/dashboardData';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface HomeDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToGames: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToShop?: () => void;
  onNavigateToStreaming?: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
  onToggleSideMenu: () => void;
}

export function HomeDashboard({
  user,
  onLogout,
  onNavigateToGames,
  onNavigateToSettings,
  onNavigateToShop,
  onNavigateToStreaming,
  onUpdateUser,
  onAddNotification,
  onToggleSideMenu
}: HomeDashboardProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 12 });
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [treasureProgress, setTreasureProgress] = useState(65);
  const [vipPoints, setVipPoints] = useState(1250);
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const experiencePercentage = calculateExperiencePercentage(user);
  const winRate = calculateWinRate(user);

  const claimDailyReward = () => {
    const rewardGold = 1000 + (user.dailyStreak * 500);
    const bonusExp = 50 + (user.dailyStreak * 25);
    
    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance + rewardGold,
      experience: user.experience + bonusExp,
      dailyStreak: user.dailyStreak + 1
    };

    const { updatedUser: finalUser, leveledUp } = checkLevelUp(updatedUser);

    if (leveledUp) {
      setShowLevelUpModal(true);
      onAddNotification(`🆙 레벨업! ${finalUser.level}레벨 달성!`);
    }

    onUpdateUser(finalUser);
    onAddNotification(`🎁 일일 보상: ${rewardGold.toLocaleString()}G + ${bonusExp}XP`);
    setShowDailyReward(false);
  };

  const handleSettings = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      onAddNotification('⚙️ 설정 기능 준비중!');
    }
  };

  const quickActionsWithHandlers = QUICK_ACTIONS.map(action => ({
    ...action,
    onClick: () => {
      switch (action.title) {
        case '게임 플레이':
          onNavigateToGames();
          break;
        case '상점':
          if (onNavigateToShop) {
            onNavigateToShop();
          } else {
            onAddNotification('🛍️ 상점 기능 준비중!');
          }
          break;
        case '방송보기':
          if (onNavigateToStreaming) {
            onNavigateToStreaming();
          } else {
            onAddNotification('📺 방송보기 기능 준비중!');
          }
          break;
        case '랭킹':
          onAddNotification('🏆 랭킹 기능 준비중!');
          break;
      }
    }
  }));

  const achievements = ACHIEVEMENTS_DATA.map(achievement => ({
    ...achievement,
    unlocked: (() => {
      switch (achievement.id) {
        case 'first_login': return true;
        case 'level_5': return user.level >= 5;
        case 'win_10': return user.stats.gamesWon >= 10;
        case 'treasure_hunt': return treasureProgress >= 50;
        case 'gold_100k': return user.goldBalance >= 100000;
        case 'daily_7': return user.dailyStreak >= 7;
        default: return false;
      }
    })()
  }));

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary-soft relative overflow-hidden pb-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{ 
              opacity: [0, 0.2, 0],
              scale: [0, 1.2, 0],
              rotate: 360
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-primary rounded-full"
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
            {/* 완전히 개선된 사이드메뉴 버튼 - 44px × 44px, 접근성 강화 */}
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

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-game rounded-full flex items-center justify-center level-glow"
            >
              <Crown className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                {user.nickname}
              </h1>
              {user.isAdmin && (
                <div className="text-xs text-error font-bold">🔐 관리자</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center gap-2 bg-error-soft px-3 py-2 rounded-lg text-error text-sm"
            >
              <Timer className="w-4 h-4" />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </motion.div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSettings}
              className="h-10 w-10 border-border-secondary hover:border-primary btn-hover-lift"
              aria-label="설정"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={onLogout}
              className="h-10 border-border-secondary hover:border-error text-error hover:text-error btn-hover-lift"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 max-w-7xl mx-auto">
        {/* User Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-4 lg:p-6 mb-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-gold text-black px-4 py-3 rounded-xl font-bold cursor-pointer btn-hover-lift"
              >
                <Coins className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xl lg:text-2xl">{user.goldBalance.toLocaleString()}</div>
                <div className="text-xs opacity-80">골드</div>
              </motion.div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-game text-white px-4 py-3 rounded-xl">
                <Star className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xl lg:text-2xl">레벨 {user.level}</div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${experiencePercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-white h-full rounded-full"
                  />
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {user.experience}/{user.maxExperience} XP
                </div>
              </div>
            </div>

            <div className="text-center">
              <motion.div
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-info to-success text-white treasure-bounce"
              >
                <Gem className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xl lg:text-2xl">{treasureProgress}%</div>
                <div className="text-xs opacity-80">보물찾기</div>
              </motion.div>
            </div>

            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowDailyReward(true)}
                className="bg-gradient-to-r from-warning to-gold text-black px-4 py-3 rounded-xl cursor-pointer btn-hover-lift"
              >
                <Sparkles className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xl lg:text-2xl">{vipPoints}</div>
                <div className="text-xs opacity-80">VIP 포인트</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                빠른 액션
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActionsWithHandlers.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`glass-effect rounded-xl p-6 cursor-pointer relative overflow-hidden card-hover-float ${
                      action.highlight ? 'border-2 border-primary soft-glow' : ''
                    }`}
                  >
                    {action.badge && (
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold animate-pulse ${
                        action.badge === 'LIVE' ? 'bg-error text-white' : 'bg-error text-white'
                      }`}>
                        {action.badge}
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-foreground mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    
                    <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-success" />
                게임 통계
              </h2>
              <div className="glass-effect rounded-xl p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{user.stats.gamesPlayed}</div>
                    <div className="text-sm text-muted-foreground">총 게임</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{user.stats.gamesWon}</div>
                    <div className="text-sm text-muted-foreground">승리</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gold">{user.stats.totalEarnings.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">총 수익</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{user.stats.highestScore.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">최고 점수</div>
                  </div>
                </div>
                

              </div>
            </motion.div>
          </div>

          {/* Right Column - Achievements & Events */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-effect rounded-xl p-4 cursor-pointer mb-4 card-hover-float"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold" />
                    <h2 className="text-xl font-bold text-foreground">
                      업적 ({unlockedAchievements}/{achievements.length})
                    </h2>
                  </div>
                  <motion.div
                    animate={{ rotate: isAchievementsExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>
                
                {/* 간단한 진행률 표시 */}
                <div className="mt-3">
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(unlockedAchievements / achievements.length) * 100}%` }}
                      className="bg-gradient-to-r from-gold to-primary h-full rounded-full"
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    {Math.round((unlockedAchievements / achievements.length) * 100)}% 완료
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {isAchievementsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="glass-effect rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all card-hover-float ${
                          achievement.unlocked 
                            ? 'bg-success-soft border border-success/30' 
                            : 'bg-secondary/50 opacity-60'
                        }`}
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className={`font-medium ${
                            achievement.unlocked ? 'text-success' : 'text-muted-foreground'
                          }`}>
                            {achievement.name}
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <Medal className="w-4 h-4 text-gold" />
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-error" />
                핫 이벤트
              </h2>
              <div className="space-y-3">
                <motion.div
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: "0 10px 25px rgba(230, 51, 107, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="glass-effect rounded-xl p-4 border-2 border-error/30 soft-glow cursor-pointer card-hover-float relative overflow-hidden group"
                >
                  {/* 호버시 배경 빛 효과 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-error/10 to-warning/10 rounded-xl"
                  />
                  
                  {/* 호버시 펄스 효과 */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-error/20 rounded-xl group-hover:bg-error/30"
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ 
                          rotate: [0, -10, 10, -10, 0],
                          scale: 1.1
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 bg-gradient-to-r from-error to-warning rounded-lg flex items-center justify-center"
                      >
                        <Gift className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.div 
                          whileHover={{ x: 5 }}
                          className="font-bold text-error"
                        >
                          더블 골드 이벤트!
                        </motion.div>
                        <div className="text-sm text-muted-foreground">모든 게임에서 골드 2배 획득</div>
                      </div>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="mt-3 bg-error-soft rounded-lg p-2 text-center"
                    >
                      <motion.div 
                        animate={{ 
                          color: ["#e6336b", "#ff4d9a", "#e6336b"]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity 
                        }}
                        className="text-error text-sm font-medium"
                      >
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')} 남음
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ 
                    scale: 1.03, 
                    y: -3,
                    boxShadow: "0 8px 20px rgba(230, 194, 0, 0.25)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="glass-effect rounded-xl p-4 card-hover-float cursor-pointer relative overflow-hidden group"
                >
                  {/* 호버시 골드 그라데이션 효과 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-gold/5 to-warning/5 rounded-xl"
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ 
                          rotate: 360,
                          scale: 1.1
                        }}
                        transition={{ duration: 0.8 }}
                        className="w-12 h-12 bg-gradient-to-r from-gold to-gold-light rounded-lg flex items-center justify-center"
                      >
                        <Trophy className="w-6 h-6 text-black" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.div 
                          whileHover={{ x: 5 }}
                          className="font-bold text-gold"
                        >
                          주간 챌린지
                        </motion.div>
                        <div className="text-sm text-muted-foreground">100승 달성시 특별 보상</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <Progress value={(user.stats.gamesWon % 100)} className="h-2" />
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-xs text-muted-foreground mt-1 text-center"
                      >
                        {user.stats.gamesWon % 100}/100 승리
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Daily Reward Modal */}
      <AnimatePresence>
        {showDailyReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDailyReward(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Gift className="w-10 h-10 text-black" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gold mb-2">일일 보상!</h3>
              <p className="text-muted-foreground mb-6">
                연속 {user.dailyStreak}일 접속 보너스를 받으세요!
              </p>
              
              <div className="bg-gold-soft rounded-lg p-4 mb-6">
                <div className="text-gold font-bold text-xl">
                  {(1000 + (user.dailyStreak * 500)).toLocaleString()}G
                </div>
                <div className="text-sm text-muted-foreground">
                  + {50 + (user.dailyStreak * 25)} XP
                </div>
              </div>
              
              <Button
                onClick={claimDailyReward}
                className="w-full bg-gradient-gold hover:opacity-90 text-black font-bold py-3 btn-hover-lift"
              >
                보상 받기!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="glass-effect rounded-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 3 }}
                className="text-6xl mb-4"
              >
                ⭐
              </motion.div>
              
              <h3 className="text-3xl font-bold text-gradient-primary mb-2">레벨업!</h3>
              <p className="text-xl text-gold font-bold mb-4">레벨 {user.level}</p>
              <p className="text-muted-foreground mb-6">
                축하합니다! 새로운 레벨에 도달했습니다!
              </p>
              
              <Button
                onClick={() => setShowLevelUpModal(false)}
                className="w-full bg-gradient-game hover:opacity-90 text-white font-bold py-3 btn-hover-lift"
              >
                계속하기
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}