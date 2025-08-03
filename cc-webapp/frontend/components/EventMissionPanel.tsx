'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Calendar,
  Target,
  Gift,
  Trophy,
  Star,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Users,
  Coins,
  Award,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Timer,
  TrendingUp,
  Eye,
  Settings
} from 'lucide-react';
import { User, Event, Mission } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

interface EventMissionPanelProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

export function EventMissionPanel({ user, onBack, onUpdateUser, onAddNotification }: EventMissionPanelProps) {
  const [activeTab, setActiveTab] = useState('events');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | Mission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock events data
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'event_1',
      title: '🎄 크리스마스 특별 이벤트',
      description: '크리스마스를 맞아 특별한 보상을 드립니다! 매일 로그인하고 게임을 플레이하여 한정 아이템을 획득하세요.',
      type: 'seasonal',
      status: 'active',
      isActive: true,
      startDate: new Date('2024-12-24'),
      endDate: new Date('2024-12-31'),
      rewards: [
        { 
          id: 'gold1', 
          name: '골드', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 50000, 
          description: '게임 내 화폐', 
          icon: '💰' 
        },
        { 
          id: 'skin1', 
          name: '크리스마스 스킨', 
          type: 'skin', 
          rarity: 'rare', 
          quantity: 1, 
          description: '크리스마스 한정 스킨', 
          icon: '🎄' 
        },
        { 
          id: 'exp1', 
          name: '경험치', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 5000, 
          description: '캐릭터 경험치', 
          icon: '⭐' 
        }
      ],
      participants: 8432,
      maxParticipants: 10000,
      requirements: ['일일 로그인', '게임 3회 플레이', '친구 초대'],
      difficulty: 'easy',
      category: 'holiday',
      icon: '🎄'
    },
    {
      id: 'event_2',
      title: '⚡ 번개 더블 골드',
      description: '지금부터 2시간 동안 모든 게임에서 골드 2배 획득! 놓치지 마세요!',
      type: 'special',
      status: 'active',
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      rewards: [
        { 
          id: 'boost1', 
          name: '2배 골드 획득', 
          type: 'powerup', 
          rarity: 'rare', 
          quantity: 1, 
          description: '골드 2배 부스터', 
          icon: '⚡' 
        }
      ],
      participants: 2156,
      requirements: ['즉시 참여 가능'],
      difficulty: 'easy',
      category: 'boost',
    },
    {
      id: 'event_3',
      title: '🏆 신년 토너먼트',
      description: '새해를 맞아 열리는 대규모 토너먼트! 최고의 게이머가 되어 거대한 보상을 차지하세요.',
      type: 'special',
      status: 'active',
      isActive: false,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-07'),
      rewards: [
        { 
          id: 'gold2', 
          name: '골드', 
          type: 'currency', 
          rarity: 'legendary', 
          quantity: 1000000, 
          description: '대량의 골드', 
          icon: '💰' 
        },
        { 
          id: 'trophy1', 
          name: '챔피언 트로피', 
          type: 'collectible', 
          rarity: 'legendary', 
          quantity: 1, 
          description: '챔피언의 증표', 
          icon: '🏆' 
        },
        { 
          id: 'title1', 
          name: '전설 타이틀', 
          type: 'collectible', 
          rarity: 'legendary', 
          quantity: 1, 
          description: '전설의 타이틀', 
          icon: '👑' 
        }
      ],
      participants: 0,
      maxParticipants: 1000,
      requirements: ['레벨 10 이상', '랭킹 상위 30%'],
      difficulty: 'expert',
      category: 'tournament',
    }
  ]);

  // Mock missions data
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'mission_1',
      title: '일일 로그인',
      description: '매일 게임에 접속하여 보상을 받으세요',
      type: 'daily',
      category: 'login',
      status: user.dailyStreak > 0 ? 'completed' : 'active',
      isCompleted: user.dailyStreak > 0,
      isActive: true,
      progress: user.dailyStreak > 0 ? 1 : 0,
      maxProgress: 1,
      requirements: {
        action: 'login',
        target: 1,
        current: user.dailyStreak > 0 ? 1 : 0
      },
      rewards: [
        { 
          id: 'daily_gold', 
          name: '골드', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 1000, 
          description: '일일 보상 골드', 
          icon: '💰' 
        }, 
        { 
          id: 'daily_exp', 
          name: '경험치', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 100, 
          description: '일일 보상 경험치', 
          icon: '⭐' 
        }
      ],
      difficulty: 'easy',
      priority: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_2',
      title: '게임 마스터',
      description: '하루에 10게임을 플레이하세요',
      type: 'daily',
      category: 'gameplay',
      status: 'active',
      isCompleted: false,
      isActive: true,
      progress: Math.min(user.stats.gamesPlayed % 10, 10),
      maxProgress: 10,
      requirements: {
        action: 'play_games',
        target: 10,
        current: Math.min(user.stats.gamesPlayed % 10, 10)
      },
      rewards: [
        { 
          id: 'game_gold', 
          name: '골드', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 5000, 
          description: '게임 마스터 보상', 
          icon: '💰' 
        }, 
        { 
          id: 'game_exp', 
          name: '경험치', 
          type: 'currency', 
          rarity: 'common', 
          quantity: 500, 
          description: '게임 마스터 경험치', 
          icon: '⭐' 
        }
      ],
      difficulty: 'medium',
      priority: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_3',
      title: '연승 챌린지',
      description: '5연승을 달성하세요',
      type: 'weekly',
      category: 'challenge',
      status: user.stats.winStreak >= 5 ? 'completed' : 'active',
      isCompleted: user.stats.winStreak >= 5,
      isActive: true,
      progress: Math.min(user.stats.winStreak, 5),
      maxProgress: 5,
      requirements: {
        action: 'win_streak',
        target: 5,
        current: Math.min(user.stats.winStreak, 5)
      },
      rewards: [
        { 
          id: 'streak_gold', 
          name: '골드', 
          type: 'currency', 
          rarity: 'rare', 
          quantity: 15000, 
          description: '연승 보상 골드', 
          icon: '💰' 
        }, 
        { 
          id: 'streak_badge', 
          name: '연승 배지', 
          type: 'collectible', 
          rarity: 'rare', 
          quantity: 1, 
          description: '연승 달성 배지', 
          icon: '🔥' 
        }
      ],
      difficulty: 'hard',
      priority: 3,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_4',
      title: '레벨업 달성',
      description: '레벨 20에 도달하세요',
      type: 'achievement',
      category: 'progression',
      status: user.level >= 20 ? 'completed' : user.level >= 10 ? 'active' : 'expired',
      isCompleted: user.level >= 20,
      isActive: user.level >= 10,
      progress: user.level,
      maxProgress: 20,
      requirements: {
        action: 'reach_level',
        target: 20,
        current: user.level
      },
      rewards: [
        { 
          id: 'master_gold', 
          name: '골드', 
          type: 'currency', 
          rarity: 'legendary', 
          quantity: 50000, 
          description: '마스터 달성 보상', 
          icon: '💰' 
        }, 
        { 
          id: 'master_title', 
          name: '마스터 타이틀', 
          type: 'collectible', 
          rarity: 'legendary', 
          quantity: 1, 
          description: '마스터 레벨 달성 타이틀', 
          icon: '👑' 
        }
      ],
      difficulty: 'expert',
      priority: 4,
    }
  ]);

  // Statistics
  const activeEvents = events.filter(e => e.status === 'active').length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);

  // Handle mission completion
  const handleCompleteMission = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.status === 'completed') return;

    // Update mission status
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, status: 'completed' as const, progress: m.maxProgress }
        : m
    ));

    // Give rewards
    const totalGold = mission.rewards.reduce((sum, r) => r.type === 'currency' && r.name === '골드' ? sum + r.quantity : sum, 0);
    const totalExp = mission.rewards.reduce((sum, r) => r.type === 'currency' && r.name === '경험치' ? sum + r.quantity : sum, 0);

    if (totalGold > 0 || totalExp > 0) {
      const updatedUser = {
        ...user,
        goldBalance: user.goldBalance + totalGold,
        experience: user.experience + totalExp
      };

      // Check for level up
      if (updatedUser.experience >= updatedUser.maxExperience) {
        updatedUser.level += 1;
        updatedUser.experience = updatedUser.experience - updatedUser.maxExperience;
        updatedUser.maxExperience = Math.floor(updatedUser.maxExperience * 1.2);
        onAddNotification(`🆙 레벨업! ${updatedUser.level}레벨 달성!`);
      }

      onUpdateUser(updatedUser);
    }

    onAddNotification(`✅ 미션 완료! ${mission.title} - 보상을 받았습니다!`);
  };

  // Handle event participation
  const handleJoinEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, participants: e.participants + 1 }
        : e
    ));
    
    onAddNotification(`🎉 이벤트에 참여했습니다! 조건을 달성하여 보상을 받으세요.`);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-error';
      case 'extreme': return 'text-gradient-primary';
      default: return 'text-muted-foreground';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'completed': return 'bg-gold';
      case 'scheduled': return 'bg-info';
      case 'ended': return 'bg-muted';
      case 'locked': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary-soft relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1920,
              y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 1080
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0, 2, 0],
              rotate: 360
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-primary rounded-full"
          />
        ))}
      </div>

      {/* 간소화된 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 border-b border-border-secondary backdrop-blur-sm"
      >
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-border-secondary hover:border-primary btn-hover-lift"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <h1 className="text-xl font-bold text-gradient-primary">
              이벤트 & 미션
            </h1>
          </div>

          <div className="ml-auto text-gold font-bold">
            {completedMissions}/{missions.length}
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 p-4 lg:p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary">{activeEvents}</div>
              <div className="text-sm text-muted-foreground">진행중인 이벤트</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-success">{completedMissions}</div>
              <div className="text-sm text-muted-foreground">완료한 미션</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gold">{totalParticipants.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">총 참여자</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
            <TabsTrigger value="events" className="data-[state=active]:bg-primary">
              <Calendar className="w-4 h-4 mr-2" />
              이벤트
            </TabsTrigger>
            <TabsTrigger value="missions" className="data-[state=active]:bg-success">
              <Target className="w-4 h-4 mr-2" />
              미션
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Event Controls */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="이벤트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {user.isAdmin && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-game btn-hover-lift"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  이벤트 생성
                </Button>
              )}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-6 card-hover-float relative overflow-hidden"
                >
                  {/* Event Status Badge */}
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(event.status)}`}>
                    {event.status === 'active' ? '진행중' : 
                     event.status === 'scheduled' ? '예정' : 
                     event.status === 'ended' ? '종료' : event.status}
                  </div>

                  {/* Event Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{event.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      
                      {/* Event Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.endDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.participants.toLocaleString()}
                          {event.maxParticipants && `/${event.maxParticipants.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Limited Events */}
                  {event.maxParticipants && (
                    <div className="mb-4">
                      <Progress 
                        value={(event.participants / event.maxParticipants) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {Math.round((event.participants / event.maxParticipants) * 100)}% 달성
                      </div>
                    </div>
                  )}

                  {/* Rewards */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-foreground mb-2">보상:</div>
                    <div className="flex flex-wrap gap-2">
                      {event.rewards.map((reward, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reward.type === 'currency' && reward.name === '골드' ? `${reward.quantity.toLocaleString()}G` :
                           reward.type === 'currency' && reward.name === '경험치' ? `${reward.quantity.toLocaleString()}XP` :
                           reward.name || `아이템 x${reward.quantity}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  {event.requirements && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-foreground mb-2">조건:</div>
                      <div className="space-y-1">
                        {event.requirements.map((req, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-success" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleJoinEvent(event.id)}
                    disabled={event.status !== 'active'}
                    className={`w-full btn-hover-lift ${
                      event.type === 'limited' ? 'bg-gradient-to-r from-error to-warning' :
                      event.type === 'special' ? 'bg-gradient-gold text-black' :
                      event.type === 'seasonal' ? 'bg-gradient-to-r from-success to-info' :
                      'bg-gradient-game'
                    }`}
                  >
                    {event.status === 'active' ? '참여하기' :
                     event.status === 'scheduled' ? '곧 시작' :
                     '종료됨'}
                  </Button>

                  {/* Admin Controls */}
                  {user.isAdmin && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItem(event);
                          setShowCreateModal(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-error text-error hover:bg-error hover:text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            {/* Mission Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['daily', 'weekly', 'achievement', 'special'].map((type) => {
                const typeMissions = missions.filter(m => m.type === type);
                const completed = typeMissions.filter(m => m.status === 'completed').length;
                
                return (
                  <div key={type} className="glass-effect rounded-xl p-4 text-center">
                    <div className="text-xl mb-2">
                      {type === 'daily' ? '📅' :
                       type === 'weekly' ? '📆' :
                       type === 'achievement' ? '🏆' : '✨'}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {completed}/{typeMissions.length}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {type === 'daily' ? '일일' :
                       type === 'weekly' ? '주간' :
                       type === 'achievement' ? '업적' : '특별'} 미션
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Missions List */}
            <div className="space-y-4">
              {missions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-effect rounded-xl p-6 ${
                    mission.status === 'completed' ? 'border-2 border-gold/30 gold-soft-glow' :
                    mission.status === 'locked' ? 'opacity-60' : ''
                  } card-hover-float`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{mission.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{mission.title}</h3>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDifficultyColor(mission.difficulty)}`}
                          >
                            {mission.difficulty === 'easy' ? '쉬움' :
                             mission.difficulty === 'medium' ? '보통' :
                             mission.difficulty === 'hard' ? '어려움' : '극한'}
                          </Badge>
                          
                          <Badge 
                            className={`text-xs text-white ${getStatusColor(mission.status)}`}
                          >
                            {mission.status === 'completed' ? '완료' :
                             mission.status === 'locked' ? '잠금' : '진행중'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
                        
                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">진행도</span>
                            <span className="font-medium text-foreground">
                                          <div className="font-mono text-xs text-zinc-400">
              {mission.progress ?? 0}/{mission.maxProgress ?? 1}
            </div>
                            </span>
                          </div>
                          <Progress 
                            value={((mission.progress ?? 0) / (mission.maxProgress ?? 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        {/* Rewards */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {mission.rewards.map((reward, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reward.type === 'currency' && reward.name === '골드' ? `${reward.quantity.toLocaleString()}G` :
                               reward.type === 'currency' && reward.name === '경험치' ? `${reward.quantity.toLocaleString()}XP` :
                               reward.name || `아이템 x${reward.quantity}`}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Expiry */}
                        {mission.expiresAt && (
                          <div className="text-xs text-error flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {Math.ceil((mission.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))}시간 남음
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {mission.status === 'completed' ? (
                        <Button disabled className="bg-gold text-black">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          완료됨
                        </Button>
                      ) : mission.status === 'locked' ? (
                        <Button disabled variant="outline">
                          잠금
                        </Button>
                      ) : (mission.progress ?? 0) >= (mission.maxProgress ?? 1) ? (
                        <Button
                          onClick={() => handleCompleteMission(mission.id)}
                          className="bg-gradient-game btn-hover-lift"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          보상 받기
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          진행중
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}