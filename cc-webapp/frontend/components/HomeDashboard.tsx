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
  Gem,
  Sparkles,
  Menu,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { User } from '../types';
import { calculateExperiencePercentage, calculateWinRate, checkLevelUp } from '../utils/userUtils';
import { QUICK_ACTIONS, ACHIEVEMENTS_DATA } from '../constants/dashboardData';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { streakApi } from '../utils/apiClient';

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
  onToggleSideMenu,
}: HomeDashboardProps) {
  // 카운트다운 (기존 로직 유지 – 추후 이벤트 TTL 연동 가능)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 12 });
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false); // 서버 상태 기반 일일 보상 수령 여부
  const [treasureProgress, setTreasureProgress] = useState(65);
  // vipPoints: 백엔드 UserResponse 필드 vip_points → 프론트 User 타입 camelCase 매핑 필요 시 fallback
  const [vipPoints, setVipPoints] = useState((user as any)?.vip_points ?? (user as any)?.vipPoints ?? 0);
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);
  const [streak, setStreak] = useState({
    count: user?.dailyStreak ?? 0,
    ttl_seconds: null as number | null,
    next_reward: null as string | null,
  });
  const [streakProtection, setStreakProtection] = useState(null as boolean | null);
  const [attendanceDays, setAttendanceDays] = useState(null as string[] | null);
  // 매 렌더마다 Math.random() 호출 → 1초마다 interval 재렌더 시 수십개의 motion div 재마운트 → passive effect stack 증가
  // 1회만 좌표를 생성하여 렌더 루프/마운트 폭증을 방지
  const [backgroundPoints] = useState(() => {
    if (typeof window === 'undefined')
      return [] as { id: number; x: number; y: number; delay: number }[];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: i * 0.3,
    }));
  });

  // streak state 동등성 비교 후 변경시에만 set → 동일 데이터 반복 set으로 인한 불필요 재렌더 방지
  interface StreakState {
    count: number;
    ttl_seconds: number | null;
    next_reward: string | null;
  }
  const safeSetStreak = (next: StreakState) => {
    setStreak((prev: StreakState) =>
      prev.count === next.count &&
      prev.ttl_seconds === next.ttl_seconds &&
      prev.next_reward === next.next_reward
        ? prev
        : next
    );
  };

  // Fetch and tick daily login streak on mount (idempotent per backend TTL)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Get status first
        const status = await streakApi.status('DAILY_LOGIN');
        if (mounted && status && typeof status === 'object') {
          safeSetStreak({
            count: status.count ?? 0,
            ttl_seconds: status.ttl_seconds ?? null,
            next_reward: status.next_reward ?? null,
          });
        }
        // Best-effort tick (backend guards with TTL)
        const after = await streakApi.tick('DAILY_LOGIN');
        if (mounted && after && typeof after === 'object') {
          safeSetStreak({
            count: after.count ?? 0,
            ttl_seconds: after.ttl_seconds ?? null,
            next_reward: after.next_reward ?? null,
          });
        }
        // VIP / streak claim status (daily claimed?)
        try {
          const resp = await fetch('/api/vip/status');
          if (resp.ok) {
            const vs = await resp.json();
            if (mounted) {
              setDailyClaimed(!!vs.claimed_today);
              if (typeof vs.vip_points === 'number') setVipPoints(vs.vip_points);
            }
          }
        } catch {}
        // Load protection & this month attendance (UTC now)
        try {
          const prot = await streakApi.protectionGet('DAILY_LOGIN');
          if (mounted) setStreakProtection(!!prot?.enabled);
        } catch {}
        try {
          const now = new Date();
          const hist = await streakApi.history(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            'DAILY_LOGIN'
          );
          if (mounted) setAttendanceDays(Array.isArray(hist?.days) ? hist.days : []);
        } catch {}
      } catch (e) {
        // Non-fatal; keep UI fallback
        console.warn('streak load failed', e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev: { hours: number; minutes: number; seconds: number }) => {
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

  const claimDailyReward = async () => {
    try {
      const res = await fetch('/api/streak/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onAddNotification(`⚠️ 수령 실패: ${err.detail || res.status}`);
        return;
      }
      const data = await res.json();
      // data: { awarded_gold, awarded_xp, new_gold_balance, streak_count }
      // 서버 authoritative 값 사용. fallback 로컬 계산 제거 (중복 증가 방지)
      const updatedUser = {
        ...user,
        goldBalance: data.new_gold_balance ?? user.goldBalance,
        experience: (user.experience || 0) + (data.awarded_xp || 0),
        dailyStreak: data.streak_count ?? user.dailyStreak, // 서버 streak_count 그대로 반영
      };
      const { updatedUser: finalUser, leveledUp } = checkLevelUp(updatedUser);
      if (leveledUp) {
        setShowLevelUpModal(true);
        onAddNotification(`🆙 레벨업! ${finalUser.level}레벨 달성!`);
      }
      onUpdateUser(finalUser);
      onAddNotification(`🎁 일일 보상: ${(data.awarded_gold||0).toLocaleString()}G + ${(data.awarded_xp||0)}XP`);
      setShowDailyReward(false);
  setDailyClaimed(true);
  // 최신 프로필 재조회 대신 VIP 포인트는 streak 보상과 별개이므로 그대로 유지
    } catch (e:any) {
      onAddNotification('⚠️ 네트워크 오류: 보상 수령 실패');
    }
  };

  const handleSettings = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      onAddNotification('⚙️ 설정 기능 준비중!');
    }
  };

  const quickActionsWithHandlers = QUICK_ACTIONS.map((action) => ({
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
    },
  }));

  const achievements = ACHIEVEMENTS_DATA.map((achievement) => ({
    ...achievement,
    unlocked: (() => {
      switch (achievement.id) {
        case 'first_login':
          return true;
        case 'level_5':
          return user.level >= 5;
        case 'win_10':
          return user.stats.gamesWon >= 10;
        case 'treasure_hunt':
          return treasureProgress >= 50;
        case 'gold_100k':
          return user.goldBalance >= 100000;
        case 'daily_7':
          return (streak.count ?? user.dailyStreak) >= 7;
        default:
          return false;
      }
    })(),
  }));

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary-soft relative overflow-hidden pb-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {backgroundPoints.map((p: { id: number; x: number; y: number; delay: number }) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: p.x, y: p.y }}
            animate={{ opacity: [0, 0.2, 0], scale: [0, 1.2, 0], rotate: 360 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
              type: 'tween',
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
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 bg-gradient-game rounded-full flex items-center justify-center level-glow"
            >
              <Crown className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                {user.nickname}
              </h1>
              {user.isAdmin && <div className="text-xs text-error font-bold">🔐 관리자</div>}
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
              <motion.div className="px-4 py-3 rounded-xl bg-gradient-to-r from-info to-success text-white treasure-bounce">
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
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold animate-pulse ${
                          action.badge === 'LIVE' ? 'bg-error text-white' : 'bg-error text-white'
                        }`}
                      >
                        {action.badge}
                      </div>
                    )}

                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}
                    >
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
                    <div className="text-2xl font-bold text-gold">
                      {user.stats.totalEarnings.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">총 수익</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {user.stats.highestScore.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">최고 점수</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Streak & Events */}
          <div className="space-y-6">
            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-xl p-4 card-hover-float"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">연속 보상</h2>
                </div>
                {typeof streak.ttl_seconds === 'number' && (
                  <div className="text-xs text-muted-foreground">
                    남은 시간 ~ {Math.max(0, Math.floor(streak.ttl_seconds / 3600))}h
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-secondary/40 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary">{streak.count}</div>
                  <div className="text-xs text-muted-foreground">연속일</div>
                </div>
                <div className="bg-secondary/40 rounded-lg p-3">
                  <div className="text-sm font-bold text-gold">
                    {streak.next_reward || 'Coins + XP'}
                  </div>
                  <div className="text-xs text-muted-foreground">다음 보상</div>
                </div>
                <div className="bg-secondary/40 rounded-lg p-3">
                  <Button size="sm" className="w-full" onClick={() => setShowDailyReward(true)}>
                    보상 보기
                  </Button>
                </div>
              </div>
              {/* Mini benefits + protection CTA + attendance sketch */}
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div>혜택 패턴: 3일 Rare, 7일 Epic</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const next = !(streakProtection ?? false);
                        const res = await streakApi.protectionSet(next, 'DAILY_LOGIN');
                        setStreakProtection(!!res?.enabled);
                      } catch (e) {
                        console.warn('protection toggle failed', e);
                      }
                    }}
                  >
                    보호 {streakProtection ? 'ON' : 'OFF'}
                  </Button>
                </div>
                {attendanceDays && attendanceDays.length > 0 && (
                  <div className="text-[11px] text-muted-foreground/80">
                    (월간 누적 {attendanceDays.length}일)
                  </div>
                )}
              </div>

              {/* Minimal monthly attendance calendar (current month) */}
              {attendanceDays && (
                <div className="mt-2 border border-border-secondary/40 rounded-lg p-2">
                  {(() => {
                    // 주간(일~토) 7일 캘린더로 전환
                    const now = new Date();
                    const todayUTC = new Date(
                      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
                    );
                    const weekday = todayUTC.getUTCDay(); // 0=Sun
                    const weekStart = new Date(todayUTC);
                    weekStart.setUTCDate(todayUTC.getUTCDate() - weekday); // 일요일로 이동
                    const days: Array<{
                      label: string;
                      dateStr: string;
                      active: boolean;
                      isToday: boolean;
                    }> = [];
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(
                        Date.UTC(
                          weekStart.getUTCFullYear(),
                          weekStart.getUTCMonth(),
                          weekStart.getUTCDate() + i
                        )
                      );
                      const iso = d.toISOString().slice(0, 10);
                      days.push({
                        label: String(d.getUTCDate()),
                        dateStr: iso,
                        active: attendanceDays.includes(iso),
                        isToday: iso === todayUTC.toISOString().slice(0, 10),
                      });
                    }
                    return (
                      <div>
                        <div className="text-[11px] text-muted-foreground/80 mb-1">
                          이번 주 출석: {days.filter((d) => d.active).length}일
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground/70 mb-1">
                          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                            <div key={d} className="text-center">
                              {d}
                            </div>
                          ))}
                        </div>
                        <div
                          className="grid gap-1"
                          style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                        >
                          {days.map((c, idx) => (
                            <div
                              key={idx}
                              className={`h-6 rounded flex items-center justify-center text-[11px] relative select-none transition-colors duration-200
                                ${c.active ? 'bg-primary/30 text-foreground' : 'bg-secondary/30 text-muted-foreground'}
                                ${c.isToday ? 'ring-1 ring-primary/70 font-bold' : ''}`}
                              title={c.dateStr}
                            >
                              {c.label}
                              {c.isToday && (
                                <span className="absolute -bottom-3 text-[9px] text-primary font-semibold">
                                  오늘
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
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
                    animate={{ opacity: 1, height: 'auto' }}
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
                          <div
                            className={`font-medium ${
                              achievement.unlocked ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {achievement.name}
                          </div>
                        </div>
                        {achievement.unlocked && <Award className="w-4 h-4 text-gold" />}
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
                <Gift className="w-5 h-5 text-error" />핫 이벤트
              </h2>
              <div className="space-y-3">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    y: -5,
                    boxShadow: '0 10px 25px rgba(230, 51, 107, 0.3)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
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
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-error/20 rounded-xl group-hover:bg-error/30"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{
                          rotate: [0, -10, 10, -10, 0],
                          scale: 1.1,
                        }}
                        transition={{ duration: 0.5, type: 'tween' }}
                        className="w-12 h-12 bg-gradient-to-r from-error to-warning rounded-lg flex items-center justify-center"
                      >
                        <Gift className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.div whileHover={{ x: 5 }} className="font-bold text-error">
                          더블 골드 이벤트!
                        </motion.div>
                        <div className="text-sm text-muted-foreground">
                          모든 게임에서 골드 2배 획득
                        </div>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="mt-3 bg-error-soft rounded-lg p-2 text-center"
                    >
                      <motion.div
                        animate={{
                          color: ['#e6336b', '#ff4d9a', '#e6336b'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          type: 'tween',
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
                    boxShadow: '0 8px 20px rgba(230, 194, 0, 0.25)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
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
                          scale: 1.1,
                        }}
                        transition={{ duration: 0.8 }}
                        className="w-12 h-12 bg-gradient-to-r from-gold to-gold-light rounded-lg flex items-center justify-center"
                      >
                        <Trophy className="w-6 h-6 text-black" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.div whileHover={{ x: 5 }} className="font-bold text-gold">
                          주간 챌린지
                        </motion.div>
                        <div className="text-sm text-muted-foreground">100승 달성시 특별 보상</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <Progress value={user.stats.gamesWon % 100} className="h-2" />
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
              onClick={(e: any) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Gift className="w-10 h-10 text-black" />
              </motion.div>

              <h3 className="text-2xl font-bold text-gold mb-2">일일 보상!</h3>
              <p className="text-muted-foreground mb-6">
                연속 {streak.count ?? user.dailyStreak}일 접속 보너스를 받으세요!
              </p>

              <div className="bg-gold-soft rounded-lg p-4 mb-6">
                <div className="text-gold font-bold text-xl">
                  {/* TODO: 서버 계산된 awarded_gold 표시로 대체. 현재 모달 오픈 시 미리보기는 streak.count 기반 예상치 */}
                  {(1000 + (streak.count ?? user.dailyStreak) * 500).toLocaleString()}G
                </div>
                <div className="text-sm text-muted-foreground">
                  {/* TODO: 서버 계산 XP 반영 */}
                  + {50 + (streak.count ?? user.dailyStreak) * 25} XP
                </div>
              </div>

              <Button
                onClick={claimDailyReward}
                disabled={dailyClaimed}
                className="w-full bg-gradient-gold hover:opacity-90 text-black font-bold py-3 btn-hover-lift disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {dailyClaimed ? '이미 수령됨' : '보상 받기!'}
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
                transition={{ duration: 0.6, repeat: 3, type: 'tween' }}
                className="text-6xl mb-4"
              >
                ⭐
              </motion.div>

              <h3 className="text-3xl font-bold text-gradient-primary mb-2">레벨업!</h3>
              <p className="text-xl text-gold font-bold mb-4">레벨 {user.level}</p>
              <p className="text-muted-foreground mb-6">축하합니다! 새로운 레벨에 도달했습니다!</p>

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