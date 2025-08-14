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
import { EventBackend, MissionBackend, UserMissionBackend } from '../types/eventMission';
import { eventMissionApi } from '../utils/eventMissionApi';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
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
  const [editingItem, setEditingItem] = useState(null as Event | Mission | null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock events data
  const [events, setEvents] = useState([
    {
      id: 'event_1',
      title: '🎄 크리스마스 특별 이벤트',
      description: '크리스마스를 맞아 특별한 보상을 드립니다! 매일 로그인하고 게임을 플레이하여 한정 아이템을 획득하세요.',
      type: 'seasonal',
      status: 'active',
      startDate: new Date('2024-12-24'),
      endDate: new Date('2024-12-31'),
      rewards: [
        { type: 'gold', amount: 50000 },
        { type: 'item', amount: 1, name: '크리스마스 스킨' },
        { type: 'exp', amount: 5000 }
      ],
      participants: 8432,
      maxParticipants: 10000,
      requirements: ['일일 로그인', '게임 3회 플레이', '친구 초대'],
      icon: '🎄'
    },
    {
      id: 'event_2',
      title: '⚡ 번개 더블 골드',
      description: '지금부터 2시간 동안 모든 게임에서 골드 2배 획득! 놓치지 마세요!',
      type: 'limited',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      rewards: [
        { type: 'gold', amount: 0, name: '2배 골드 획득' }
      ],
      participants: 2156,
      icon: '⚡'
    },
    {
      id: 'event_3',
      title: '🏆 신년 토너먼트',
      description: '새해를 맞아 열리는 대규모 토너먼트! 최고의 게이머가 되어 거대한 보상을 차지하세요.',
      type: 'special',
      status: 'scheduled',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-07'),
      rewards: [
        { type: 'gold', amount: 1000000 },
        { type: 'item', amount: 1, name: '챔피언 트로피' },
        { type: 'item', amount: 1, name: '전설 타이틀' }
      ],
      participants: 0,
      maxParticipants: 1000,
      requirements: ['레벨 10 이상', '랭킹 상위 30%'],
      icon: '🏆'
    }
  ] as Event[]);

  // Mock missions data
  const [missions, setMissions] = useState([
    {
      id: 'mission_1',
      title: '일일 로그인',
      description: '매일 게임에 접속하여 보상을 받으세요',
      type: 'daily',
      status: user.dailyStreak > 0 ? 'completed' : 'active',
      progress: user.dailyStreak > 0 ? 1 : 0,
      maxProgress: 1,
      rewards: [{ type: 'gold', amount: 1000 }, { type: 'exp', amount: 100 }],
      difficulty: 'easy',
      icon: '📅',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_2',
      title: '게임 마스터',
      description: '하루에 10게임을 플레이하세요',
      type: 'daily',
      status: 'active',
      progress: Math.min(user.stats.gamesPlayed % 10, 10),
      maxProgress: 10,
      rewards: [{ type: 'gold', amount: 5000 }, { type: 'exp', amount: 500 }],
      difficulty: 'medium',
      icon: '🎮',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_3',
      title: '연승 챌린지',
      description: '5연승을 달성하세요',
      type: 'weekly',
      status: user.stats.winStreak >= 5 ? 'completed' : 'active',
      progress: Math.min(user.stats.winStreak, 5),
      maxProgress: 5,
      rewards: [{ type: 'gold', amount: 15000 }, { type: 'item', amount: 1, name: '연승 배지' }],
      difficulty: 'hard',
      icon: '🔥',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'mission_4',
      title: '레벨업 달성',
      description: '레벨 20에 도달하세요',
      type: 'achievement',
      status: user.level >= 20 ? 'completed' : user.level >= 10 ? 'active' : 'locked',
      progress: user.level,
      maxProgress: 20,
      rewards: [{ type: 'gold', amount: 50000 }, { type: 'item', amount: 1, name: '마스터 타이틀' }],
      difficulty: 'extreme',
      icon: '⭐',
      requirements: ['레벨 10 달성']
    }
  ] as Mission[]);

  // Fetch API data
  const fetchData = async () => {
    try {
      // 이벤트 데이터 가져오기
      const eventsData = await eventMissionApi.events.getAll();
      if (eventsData && Array.isArray(eventsData)) {
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const formattedEvents = eventsData.map((event: EventBackend) => ({
          id: String(event.id),
          title: event.title,
          description: event.description || '',
          type: event.event_type,
          status: event.is_active ? 'active' : 'inactive',
          startDate: new Date(event.start_date),
          endDate: new Date(event.end_date),
          rewards: Object.entries(event.rewards || {}).map(([type, amount]) => ({
            type,
            amount: Number(amount),
          })),
          participants: Math.floor(Math.random() * 1000), // 임시 데이터
          maxParticipants: 10000, // 임시 데이터
          requirements: Object.keys(event.requirements || {}),
          icon: '🎮', // 임시 아이콘
          progress: event.user_participation?.progress || {},
          completed: event.user_participation?.completed || false,
          claimed: event.user_participation?.claimed || false,
          joined: event.user_participation?.joined || false,
        }));
        setEvents(formattedEvents);
      }

      // 미션 데이터 가져오기
      const missionsData = await eventMissionApi.missions.getAll();
      if (missionsData && Array.isArray(missionsData)) {
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const formattedMissions = missionsData.map((missionData: UserMissionBackend) => {
          const mission = missionData.mission;
          return {
            id: String(mission.id),
            title: mission.title,
            description: mission.description || '',
            type: mission.mission_type,
            category: mission.category || 'general',
            status: missionData.completed
              ? 'completed'
              : missionData.current_progress > 0
                ? 'in-progress'
                : 'available',
            target: mission.target_value,
            progress: missionData.current_progress,
            rewards: Object.entries(mission.rewards || {}).map(([type, amount]) => ({
              type,
              amount: Number(amount),
            })),
            icon: mission.icon || '🎯',
            deadline: mission.reset_period
              ? `${mission.reset_period === 'daily' ? '오늘' : '이번 주'} 자정`
              : '없음',
            claimed: missionData.claimed,
          };
        });
        setMissions(formattedMissions);
      }
    } catch (error) {
      console.error('이벤트/미션 데이터 로드 중 오류:', error);

      // 안전하게 오류 정보 출력
      if (error instanceof Error) {
        console.error('오류 세부 정보:', {
          message: error.message,
          stack: error.stack,
        });
        onAddNotification(
          `이벤트와 미션 데이터를 불러오는 중 문제가 발생했습니다: ${error.message}`
        );
      } else {
        onAddNotification('이벤트와 미션 데이터를 불러오는 중 알 수 없는 문제가 발생했습니다.');
      }
    }
  };

  // 인증 상태 확인
  const checkAuthStatus = () => {
    try {
      // tokenStorage에서 가져오는 대신 window 객체에서 직접 확인
      if (typeof window === 'undefined') return false;

      const tokens = localStorage.getItem('cc_auth_tokens');
      console.log('인증 상태 확인:', tokens ? '로그인됨' : '로그인되지 않음');
      return !!tokens;
    } catch (e) {
      console.error('인증 상태 확인 오류:', e);
      return false;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    console.log('EventMissionPanel 컴포넌트 마운트');

    // 사용자 객체 확인
    console.log('User 객체 확인:', user ? `ID: ${user.id}, 사용자 정보 있음` : '사용자 정보 없음');

    const isAuthenticated = checkAuthStatus();
    console.log('인증 상태에 따른 데이터 로드 시도:', isAuthenticated ? '인증됨' : '인증 필요');

    // 인증 여부와 상관없이 일단 API 호출 시도 (디버깅 목적)
    console.log('데이터 로드 시도 중...');
    fetchData();

    if (!isAuthenticated) {
      onAddNotification('로그인이 필요합니다. 데이터를 불러올 수 없습니다.');
    }
  }, []);

  // Statistics
  const activeEvents = events.filter((e: Event) => e.status === 'active').length;
  const completedMissions = missions.filter((m: Mission) => m.status === 'completed').length;
  const totalParticipants = events.reduce((sum: number, e: Event) => sum + (e.participants || 0), 0);

  // Handle mission completion
  const handleCompleteMission = async (missionId: string) => {
  const mission = missions.find((m: Mission) => m.id === missionId);
    if (!mission) return;
    
    try {
      if (mission.progress >= mission.maxProgress && mission.status !== 'completed') {
        // 미션이 완료 조건을 충족했지만 아직 보상을 받지 않은 경우
        await eventMissionApi.missions.claimRewards(parseInt(missionId));
        onAddNotification('미션 보상을 받았습니다!');
      } else if (mission.status !== 'completed') {
        // 미션이 진행 중인 경우, 진행 상태를 업데이트
        await eventMissionApi.missions.updateProgress(parseInt(missionId), 1);
        onAddNotification('미션 진행 상태가 업데이트 되었습니다!');
      }
      fetchData(); // 데이터 리로드
    } catch (error) {
      console.error('미션 처리 중 오류:', error);
      onAddNotification('미션 진행 상태 업데이트에 실패했습니다.');
    }
  };
  
  // 미션 보상 수령 처리
  const handleClaimMissionReward = async (missionId: string) => {
    try {
      // API를 통한 미션 보상 수령
      const response = await eventMissionApi.missions.claimRewards(parseInt(missionId));
      
      if (response && response.success) {
        // 보상 내역 표시
        const rewardMessage = Object.entries(response.rewards)
          .map(([type, amount]) => `${type}: ${amount}`)
          .join(', ');
          
        onAddNotification(`보상 수령 완료: ${rewardMessage}`);
        
        // 사용자 정보 업데이트
        const totalGold = response.rewards.gold || 0;
        const totalExp = response.rewards.exp || 0;
        
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
        
        // 데이터 다시 로드
        fetchData();
      }
    } catch (error) {
      console.error('미션 보상 수령 중 오류:', error);
      onAddNotification('미션 보상을 받는 중 문제가 발생했습니다.');
    }
  };

  // Handle event participation
  const handleJoinEvent = async (eventId: string) => {
    try {
      // API를 통한 이벤트 참여
      await eventMissionApi.events.join(parseInt(eventId));
      
      // 로컬 상태 업데이트
  setEvents((prev: Event[]) => prev.map((e: Event) => 
        e.id === eventId 
          ? { ...e, participants: (e.participants || 0) + 1, joined: true }
          : e
      ));
      
      onAddNotification(`🎉 이벤트에 참여했습니다! 조건을 달성하여 보상을 받으세요.`);
      
      // 최신 데이터로 업데이트
      fetchData();
    } catch (error) {
      console.error('이벤트 참여 중 오류:', error);
      onAddNotification('이벤트 참여 중 문제가 발생했습니다.');
    }
  };
  
  // 이벤트 보상 수령
  const handleClaimEventReward = async (eventId: string) => {
    try {
      const response = await eventMissionApi.events.claimRewards(parseInt(eventId));
      
      if (response && response.success) {
        // 보상 내역 표시
        const rewardMessage = Object.entries(response.rewards)
          .map(([type, amount]) => `${type}: ${amount}`)
          .join(', ');
          
        onAddNotification(`이벤트 보상 수령 완료: ${rewardMessage}`);
        
        // 사용자 정보 업데이트
        const totalGold = response.rewards.gold || 0;
        const totalGems = response.rewards.gems || 0;
        
        onUpdateUser({
          ...user,
          goldBalance: user.goldBalance + totalGold
          // 젬은 사용자 타입에 없으면 추가해야 함
        });
        
        // 데이터 다시 로드
        fetchData();
      }
    } catch (error) {
      console.error('이벤트 보상 수령 중 오류:', error);
      onAddNotification('이벤트 보상을 받는 중 문제가 발생했습니다.');
    }
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
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
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
                  onChange={(e: any) => setSearchQuery(e.target.value as string)}
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
              {events.map((event: Event, index: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-6 card-hover-float relative overflow-hidden"
                >
                  {/* Event Status Badge */}
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(String(event.status || ''))}`}>
                    {event.status === 'active' ? '진행중' : 
                     event.status === 'scheduled' ? '예정' : 
                     event.status === 'ended' ? '종료' : (event.status || '')}
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
                          {event.endDate ? (typeof event.endDate === 'string' ? new Date(event.endDate).toLocaleDateString() : event.endDate.toLocaleDateString()) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(event.participants || 0).toLocaleString()}
                          {event.maxParticipants ? `/${event.maxParticipants.toLocaleString()}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Limited Events */}
                  {event.maxParticipants && (
                    <div className="mb-4">
                      <Progress 
                        value={event.participants && event.maxParticipants ? (event.participants / event.maxParticipants) * 100 : 0} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {event.participants && event.maxParticipants ? `${Math.round((event.participants / event.maxParticipants) * 100)}% 달성` : '0% 달성'}
                      </div>
                    </div>
                  )}

                  {/* Rewards */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-foreground mb-2">보상:</div>
                    <div className="flex flex-wrap gap-2">
                      {(event.rewards || []).map((reward: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reward.type === 'gold' ? `${reward.amount.toLocaleString()}G` :
                           reward.type === 'exp' ? `${reward.amount.toLocaleString()}XP` :
                           reward.name || `아이템 x${reward.amount}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  {event.requirements && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-foreground mb-2">조건:</div>
                      <div className="space-y-1">
                        {event.requirements.map((req: string, idx: number) => (
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
                    onClick={() => handleJoinEvent(String(event.id))}
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
              {['daily', 'weekly', 'achievement', 'special'].map((type: string) => {
                const typeMissions = missions.filter((m: Mission) => m.type === type);
                const completed = typeMissions.filter((m: Mission) => m.status === 'completed').length;
                
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
              {missions.map((mission: Mission, index: number) => (
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
                            className={`text-xs ${getDifficultyColor(String(mission.difficulty || ''))}`}
                          >
                            {mission.difficulty === 'easy' ? '쉬움' :
                             mission.difficulty === 'medium' ? '보통' :
                             mission.difficulty === 'hard' ? '어려움' : '극한'}
                          </Badge>
                          
                          <Badge 
                            className={`text-xs text-white ${getStatusColor(String(mission.status || ''))}`}
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
                              {mission.progress}/{mission.maxProgress}
                            </span>
                          </div>
                            <Progress 
                            value={mission.progress && mission.maxProgress ? (mission.progress / mission.maxProgress) * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                        
                        {/* Rewards */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(mission.rewards || []).map((reward: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reward.type === 'gold' ? `${reward.amount.toLocaleString()}G` :
                               reward.type === 'exp' ? `${reward.amount.toLocaleString()}XP` :
                               reward.name || `아이템 x${reward.amount}`}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Expiry */}
                        {mission.expiresAt && (
                          <div className="text-xs text-error flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {mission.expiresAt ? Math.ceil(((typeof mission.expiresAt === 'string' ? new Date(mission.expiresAt) : mission.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 0}시간 남음
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
                      ) : (mission.progress && mission.maxProgress && mission.progress >= mission.maxProgress) ? (
                        <Button
                          onClick={() => handleCompleteMission(String(mission.id))}
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