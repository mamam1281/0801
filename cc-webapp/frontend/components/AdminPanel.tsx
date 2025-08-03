'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, TrendingUp, DollarSign, Activity, Search, Plus, Edit, Trash2, Ban, Gift,
  BarChart3, AlertTriangle, Clock, Eye, Filter, Download, RefreshCw, Settings, Shield,
  Mail, Phone, Calendar, Target, Award, Coins, Star, ChevronRight, ChevronDown, Database,
  Server, X, Package, Upload, FileText, Save, Bell, Lock, Unlock, History, RotateCcw,
  Zap, Monitor, HardDrive, Wifi, AlertCircle, CheckCircle, XCircle, Info, Video, Heart,
  Crown, MessageSquare, Sparkles, PlayCircle, PauseCircle, Volume2, VolumeX, Camera, Mic, MicOff,
  UserPlus, UserMinus, UserCheck, UserX, Headphones, Gamepad2, CreditCard, Gem,
  User as UserIcon, ShoppingCart, Tag, Percent
} from 'lucide-react';
import { User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface AdminPanelProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

// 🛡️ 보안 모니터링 필터 인터페이스
interface SecurityFilter {
  id: string;
  name: string;
  condition: string;
  value: string | number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// 👥 개별 유저 관리 인터페이스
interface AdminUser {
  id: string;
  nickname: string;
  email: string;
  goldBalance: number;
  level: number;
  status: 'active' | 'banned' | 'suspended';
  joinDate: Date;
  lastLogin: Date;
  totalSpent: number;
  gamesPlayed: number;
  isVip: boolean;
}

// 🎁 보상 시스템 인터페이스
interface RewardSystem {
  id: string;
  name: string;
  type: 'login' | 'achievement' | 'purchase' | 'event' | 'level';
  goldAmount: number;
  itemReward?: string;
  condition: string;
  enabled: boolean;
  description: string;
  icon: string;
}

// 🛍️ 상점 아이템 인터페이스
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'skin' | 'powerup' | 'currency' | 'vip' | 'special';
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  enabled: boolean;
  stock: number;
  soldCount: number;
  discountPercent: number;
}

// 📺 방송 설정 인터페이스 (단순화)
interface StreamConfig {
  title: string;
  description: string;
  isLive: boolean;
  maxViewers: number;
  chatEnabled: boolean;
  giftsEnabled: boolean;
  vipPrice: number;
  privateRoomPrice: number;
  autoModeration: boolean;
  announcement: string;
}

export function AdminPanel({ user, onBack, onUpdateUser, onAddNotification }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 📊 대시보드 통계
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 12847,
    activeUsers: 3521,
    bannedUsers: 23,
    totalRevenue: 1250000,
    todayRevenue: 45000,
    liveViewers: 247,
    totalRewards: 156780,
    totalShopItems: 156,
    totalSales: 892
  });

  // 🛡️ 보안 필터 설정
  const [securityFilters, setSecurityFilters] = useState<SecurityFilter[]>([
    {
      id: '1',
      name: '비정상 승률 감지',
      condition: 'win_rate',
      value: 85,
      enabled: true,
      severity: 'high',
      description: '승률이 85% 이상인 사용자 감지'
    },
    {
      id: '2', 
      name: '동일 IP 다중 로그인',
      condition: 'same_ip_logins',
      value: 5,
      enabled: true,
      severity: 'medium',
      description: '동일 IP에서 5개 이상 계정 로그인'
    },
    {
      id: '3',
      name: '비정상 골드 증가',
      condition: 'gold_increase',
      value: 100000,
      enabled: true,
      severity: 'critical',
      description: '단시간 내 10만G 이상 증가'
    },
    {
      id: '4',
      name: '의심스러운 패턴',
      condition: 'suspicious_pattern',
      value: 10,
      enabled: true,
      severity: 'high',
      description: '연속 10회 이상 동일한 패턴'
    }
  ]);

  // 👥 사용자 관리
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    {
      id: '1',
      nickname: 'ProGamer2024',
      email: 'gamer@email.com',
      goldBalance: 125000,
      level: 35,
      status: 'active',
      joinDate: new Date('2024-01-15'),
      lastLogin: new Date(),
      totalSpent: 89000,
      gamesPlayed: 1247,
      isVip: true
    },
    {
      id: '2',
      nickname: 'CasualPlayer',
      email: 'casual@email.com',
      goldBalance: 15000,
      level: 12,
      status: 'active',
      joinDate: new Date('2024-03-22'),
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
      totalSpent: 12000,
      gamesPlayed: 234,
      isVip: false
    },
    {
      id: '3',
      nickname: 'Suspicious123',
      email: 'sus@email.com',
      goldBalance: 500000,
      level: 99,
      status: 'suspended',
      joinDate: new Date('2024-12-01'),
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
      totalSpent: 0,
      gamesPlayed: 2000,
      isVip: false
    }
  ]);

  // 🎁 보상 시스템
  const [rewardSystems, setRewardSystems] = useState<RewardSystem[]>([
    {
      id: '1',
      name: '일일 로그인 보너스',
      type: 'login',
      goldAmount: 1000,
      condition: 'daily_login',
      enabled: true,
      description: '매일 로그인 시 1000G 지급',
      icon: '📅'
    },
    {
      id: '2',
      name: '레벨업 보상',
      type: 'level',
      goldAmount: 5000,
      condition: 'level_up',
      enabled: true,
      description: '레벨업 시 5000G 지급',
      icon: '⬆️'
    },
    {
      id: '3',
      name: '첫 구매 보너스',
      type: 'purchase',
      goldAmount: 10000,
      itemReward: '레어 스킨',
      condition: 'first_purchase',
      enabled: true,
      description: '첫 구매 시 10000G + 레어 스킨',
      icon: '🛍️'
    },
    {
      id: '4',
      name: '주간 이벤트',
      type: 'event',
      goldAmount: 50000,
      condition: 'weekly_event',
      enabled: false,
      description: '주간 이벤트 완료 시 50000G',
      icon: '🎊'
    }
  ]);

  // 🛍️ 상점 아이템
  const [shopItems, setShopItems] = useState<ShopItem[]>([
    {
      id: '1',
      name: '네온 전사 스킨',
      description: '빛나는 네온 효과가 있는 전사 스킨',
      price: 15000,
      type: 'skin',
      category: '스킨',
      rarity: 'epic',
      icon: '⚔️',
      enabled: true,
      stock: 999,
      soldCount: 156,
      discountPercent: 0
    },
    {
      id: '2',
      name: '골드 부스터',
      description: '1시간 동안 골드 획득량 2배',
      price: 5000,
      type: 'powerup',
      category: '부스터',
      rarity: 'rare',
      icon: '💰',
      enabled: true,
      stock: 999,
      soldCount: 423,
      discountPercent: 20
    },
    {
      id: '3',
      name: 'VIP 멤버십 (30일)',
      description: '30일간 VIP 혜택을 누려보세요',
      price: 29900,
      type: 'vip',
      category: 'VIP',
      rarity: 'legendary',
      icon: '👑',
      enabled: true,
      stock: 999,
      soldCount: 78,
      discountPercent: 0
    },
    {
      id: '4',
      name: '럭키 스타 스킨팩',
      description: '5개의 랜덤 스킨이 들어있는 팩',
      price: 25000,
      type: 'special',
      category: '패키지',
      rarity: 'legendary',
      icon: '🎁',
      enabled: true,
      stock: 50,
      soldCount: 23,
      discountPercent: 15
    }
  ]);

  // 📺 방송 설정 (단순화)
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    title: 'Luna Star의 개인방',
    description: '프리미엄 모델 Luna Star와 함께하는 특별한 시간',
    isLive: true,
    maxViewers: 500,
    chatEnabled: true,
    giftsEnabled: true,
    vipPrice: 9900,
    privateRoomPrice: 19900,
    autoModeration: true,
    announcement: '🎉 특별 이벤트 진행 중! VIP 50% 할인!'
  });

  // 다이얼로그 상태들
  const [userDialog, setUserDialog] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    user: null as AdminUser | null
  });

  const [rewardDialog, setRewardDialog] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    reward: null as RewardSystem | null
  });

  const [shopDialog, setShopDialog] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    item: null as ShopItem | null
  });

  // 보안 알림 상태
  const [securityAlerts, setSecurityAlerts] = useState([
    {
      id: '1',
      type: 'suspicious_activity',
      severity: 'high',
      message: 'Suspicious123 사용자의 비정상적 승률 감지 (98%)',
      userId: 'Suspicious123',
      timestamp: new Date(),
      status: 'active'
    },
    {
      id: '2',
      type: 'multiple_login',
      severity: 'medium',
      message: 'IP 192.168.1.100에서 6개 계정 동시 로그인',
      userId: 'MultiAccount1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'investigating'
    }
  ]);

  // 🛡️ 보안 필터 업데이트
  const updateSecurityFilter = (filterId: string, updates: Partial<SecurityFilter>) => {
    setSecurityFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
    onAddNotification('🛡️ 보안 필터가 업데이트되었습니다.');
  };

  // 👥 사용자 관리 함수들
  const handleUserAction = (userId: string, action: 'ban' | 'unban' | 'suspend' | 'delete' | 'makeVip') => {
    setAdminUsers(prev => prev.map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'ban':
            return { ...user, status: 'banned' as const };
          case 'unban':
            return { ...user, status: 'active' as const };
          case 'suspend':
            return { ...user, status: 'suspended' as const };
          case 'makeVip':
            return { ...user, isVip: !user.isVip };
          default:
            return user;
        }
      }
      return user;
    }));

    if (action === 'delete') {
      setAdminUsers(prev => prev.filter(user => user.id !== userId));
    }

    onAddNotification(`👥 사용자 ${action} 작업이 완료되었습니다.`);
  };

  // 사용자 추가/편집
  const handleUserSave = (userData: Partial<AdminUser>) => {
    if (userDialog.mode === 'add') {
      const newUser: AdminUser = {
        id: Date.now().toString(),
        nickname: userData.nickname || '',
        email: userData.email || '',
        goldBalance: userData.goldBalance || 10000,
        level: userData.level || 1,
        status: 'active',
        joinDate: new Date(),
        lastLogin: new Date(),
        totalSpent: 0,
        gamesPlayed: 0,
        isVip: userData.isVip || false
      };
      setAdminUsers(prev => [...prev, newUser]);
      onAddNotification('👥 새 사용자가 추가되었습니다.');
    } else {
      setAdminUsers(prev => prev.map(user => 
        user.id === userDialog.user?.id 
          ? { ...user, ...userData }
          : user
      ));
      onAddNotification('👥 사용자 정보가 업데이트되었습니다.');
    }
    setUserDialog({ open: false, mode: 'add', user: null });
  };

  // 🎁 보상 시스템 관리
  const handleRewardSave = (rewardData: Partial<RewardSystem>) => {
    if (rewardDialog.mode === 'add') {
      const newReward: RewardSystem = {
        id: Date.now().toString(),
        name: rewardData.name || '',
        type: rewardData.type || 'login',
        goldAmount: rewardData.goldAmount || 1000,
        itemReward: rewardData.itemReward,
        condition: rewardData.condition || '',
        enabled: true,
        description: rewardData.description || '',
        icon: rewardData.icon || '🎁'
      };
      setRewardSystems(prev => [...prev, newReward]);
      onAddNotification('🎁 새 보상이 추가되었습니다.');
    } else {
      setRewardSystems(prev => prev.map(reward => 
        reward.id === rewardDialog.reward?.id 
          ? { ...reward, ...rewardData }
          : reward
      ));
      onAddNotification('🎁 보상이 업데이트되었습니다.');
    }
    setRewardDialog({ open: false, mode: 'add', reward: null });
  };

  const handleRewardDelete = (rewardId: string) => {
    setRewardSystems(prev => prev.filter(reward => reward.id !== rewardId));
    onAddNotification('🎁 보상이 삭제되었습니다.');
  };

  const updateRewardSystem = (rewardId: string, updates: Partial<RewardSystem>) => {
    setRewardSystems(prev => prev.map(reward => 
      reward.id === rewardId ? { ...reward, ...updates } : reward
    ));
    onAddNotification('🎁 보상 시스템이 업데이트되었습니다.');
  };

  // 🛍️ 상점 아이템 관리
  const handleShopItemSave = (itemData: Partial<ShopItem>) => {
    if (shopDialog.mode === 'add') {
      const newItem: ShopItem = {
        id: Date.now().toString(),
        name: itemData.name || '',
        description: itemData.description || '',
        price: itemData.price || 1000,
        type: itemData.type || 'skin',
        category: itemData.category || '기타',
        rarity: itemData.rarity || 'common',
        icon: itemData.icon || '🎁',
        enabled: true,
        stock: itemData.stock || 999,
        soldCount: 0,
        discountPercent: itemData.discountPercent || 0
      };
      setShopItems(prev => [...prev, newItem]);
      onAddNotification('🛍️ 새 상품이 추가되었습니다.');
    } else {
      setShopItems(prev => prev.map(item => 
        item.id === shopDialog.item?.id 
          ? { ...item, ...itemData }
          : item
      ));
      onAddNotification('🛍️ 상품이 업데이트되었습니다.');
    }
    setShopDialog({ open: false, mode: 'add', item: null });
  };

  const handleShopItemDelete = (itemId: string) => {
    setShopItems(prev => prev.filter(item => item.id !== itemId));
    onAddNotification('🛍️ 상품이 삭제되었습니다.');
  };

  const updateShopItem = (itemId: string, updates: Partial<ShopItem>) => {
    setShopItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
    onAddNotification('🛍️ 상품이 업데이트되었습니다.');
  };

  // 📺 방송 설정 업데이트
  const updateStreamConfig = (key: keyof StreamConfig, value: any) => {
    setStreamConfig(prev => ({ ...prev, [key]: value }));
    onAddNotification('📺 방송 설정이 업데이트되었습니다.');
  };

  // 상태별 사용자 수 계산
  const userCounts = {
    active: adminUsers.filter(u => u.status === 'active').length,
    banned: adminUsers.filter(u => u.status === 'banned').length,
    suspended: adminUsers.filter(u => u.status === 'suspended').length,
    vip: adminUsers.filter(u => u.isVip).length
  };

  // Rarity 색상 함수
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground border-muted';
      case 'rare': return 'text-info border-info';
      case 'epic': return 'text-primary border-primary';
      case 'legendary': return 'text-gold border-gold';
      default: return 'text-muted-foreground border-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-error-soft relative overflow-hidden">
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
              onClick={onBack}
              className="border-border-secondary hover:border-primary btn-hover-lift"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-error">
                🔐 관리자 패널 v2.0
              </h1>
              <p className="text-sm text-muted-foreground">통합 시스템 관리 도구</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNotification('📊 데이터를 새로고침했습니다.')}
              className="border-border-secondary hover:border-success btn-hover-lift"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            
            <div className="text-right">
              <div className="text-sm text-error font-bold">관리자: {user.nickname}</div>
              <div className="text-xs text-muted-foreground">최고 권한</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 📑 2줄 탭 레이아웃 */}
          <div className="space-y-2">
            <TabsList className="grid w-full grid-cols-5 bg-secondary/30 text-xs">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">📊 대시보드</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-success">👥 사용자관리</TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-gold">🎁 보상관리</TabsTrigger>
              <TabsTrigger value="streaming" className="data-[state=active]:bg-primary">📺 방송설정</TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-error">🛡️ 보안모니터링</TabsTrigger>
            </TabsList>
            
            <TabsList className="grid w-full grid-cols-4 bg-secondary/30 text-xs">
              <TabsTrigger value="shop" className="data-[state=active]:bg-warning">🛍️ 상점관리</TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-info">📋 로그관리</TabsTrigger>
              <TabsTrigger value="backup" className="data-[state=active]:bg-warning">💾 백업/복원</TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-gold">⚙️ 시스템설정</TabsTrigger>
            </TabsList>
          </div>

          {/* 📊 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-soft rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{dashboardStats.totalUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">총 사용자</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-success-soft rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{dashboardStats.activeUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">활성 사용자</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold-soft rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">${(dashboardStats.totalRevenue / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-muted-foreground">총 수익</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-soft rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{dashboardStats.liveViewers}</div>
                      <div className="text-sm text-muted-foreground">라이브 시청자</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    시스템 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">서버 상태</span>
                    <Badge className="bg-success text-white">정상</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">방송 상태</span>
                    <Badge className={streamConfig.isLive ? "bg-success text-white" : "bg-error text-white"}>
                      {streamConfig.isLive ? "라이브" : "오프라인"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">보안 알림</span>
                    <span className="font-bold text-warning">{securityAlerts.filter(a => a.status === 'active').length}건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">오늘 수익</span>
                    <span className="font-bold text-gold">${dashboardStats.todayRevenue.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-error" />
                    사용자 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">활성 사용자</span>
                    <span className="font-bold text-success">{userCounts.active}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">정지된 사용자</span>
                    <span className="font-bold text-warning">{userCounts.suspended}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">차단된 사용자</span>
                    <span className="font-bold text-error">{userCounts.banned}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">VIP 사용자</span>
                    <span className="font-bold text-gold">{userCounts.vip}명</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 👥 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">사용자 관리</h2>
                <p className="text-sm text-muted-foreground">개별 사용자 추가, 편집, 삭제 및 관리</p>
              </div>
              
              <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog({ ...userDialog, open })}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setUserDialog({ open: true, mode: 'add', user: null })}
                    className="bg-gradient-game btn-hover-lift"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    사용자 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-metal max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {userDialog.mode === 'add' ? '새 사용자 추가' : '사용자 정보 수정'}
                    </DialogTitle>
                    <DialogDescription>
                      {userDialog.mode === 'add' 
                        ? '새로운 사용자 계정을 생성합니다.' 
                        : '선택한 사용자의 정보를 수정합니다.'}
                    </DialogDescription>
                  </DialogHeader>
                  <UserEditForm
                    user={userDialog.user}
                    onSave={handleUserSave}
                    onCancel={() => setUserDialog({ open: false, mode: 'add', user: null })}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card className="glass-metal">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>사용자 목록</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="사용자 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminUsers
                    .filter(user => 
                      user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((adminUser) => (
                    <motion.div
                      key={adminUser.id}
                      layout
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          adminUser.status === 'active' ? 'bg-success-soft' :
                          adminUser.status === 'banned' ? 'bg-error-soft' : 'bg-warning-soft'
                        }`}>
                          <UserIcon className={`w-6 h-6 ${
                            adminUser.status === 'active' ? 'text-success' :
                            adminUser.status === 'banned' ? 'text-error' : 'text-warning'
                          }`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{adminUser.nickname}</span>
                            {adminUser.isVip && <Crown className="w-4 h-4 text-gold" />}
                            <Badge variant={
                              adminUser.status === 'active' ? 'default' :
                              adminUser.status === 'banned' ? 'destructive' : 'secondary'
                            }>
                              {adminUser.status === 'active' ? '활성' :
                               adminUser.status === 'banned' ? '차단' : '정지'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{adminUser.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Lv.{adminUser.level} • {adminUser.goldBalance.toLocaleString()}G • {adminUser.gamesPlayed}게임
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setUserDialog({ open: true, mode: 'edit', user: adminUser })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(adminUser.id, 'makeVip')}
                        >
                          <Crown className={`w-4 h-4 ${adminUser.isVip ? 'text-gold' : 'text-muted-foreground'}`} />
                        </Button>
                        
                        {adminUser.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(adminUser.id, 'suspend')}
                          >
                            <UserMinus className="w-4 h-4 text-warning" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(adminUser.id, 'unban')}
                          >
                            <UserCheck className="w-4 h-4 text-success" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(adminUser.id, 'delete')}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🎁 보상 관리 탭 */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">보상 시스템 관리</h2>
                <p className="text-sm text-muted-foreground">게임 내 보상과 이벤트를 관리합니다</p>
              </div>

              <Dialog open={rewardDialog.open} onOpenChange={(open) => setRewardDialog({ ...rewardDialog, open })}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setRewardDialog({ open: true, mode: 'add', reward: null })}
                    className="bg-gradient-gold btn-hover-lift"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    보상 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-metal max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {rewardDialog.mode === 'add' ? '새 보상 추가' : '보상 수정'}
                    </DialogTitle>
                    <DialogDescription>
                      {rewardDialog.mode === 'add' 
                        ? '새로운 보상 시스템을 생성합니다.' 
                        : '선택한 보상의 설정을 수정합니다.'}
                    </DialogDescription>
                  </DialogHeader>
                  <RewardEditForm
                    reward={rewardDialog.reward}
                    onSave={handleRewardSave}
                    onCancel={() => setRewardDialog({ open: false, mode: 'add', reward: null })}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Coins className="w-8 h-8 text-gold" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{dashboardStats.totalRewards.toLocaleString()}G</div>
                      <div className="text-sm text-muted-foreground">총 지급된 보상</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{rewardSystems.filter(r => r.enabled).length}</div>
                      <div className="text-sm text-muted-foreground">활성 보상</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-success" />
                    <div>
                      <div className="text-lg font-bold text-foreground">7</div>
                      <div className="text-sm text-muted-foreground">일일 이벤트</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8 text-warning" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{rewardSystems.length}</div>
                      <div className="text-sm text-muted-foreground">총 보상</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-metal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gold" />
                  보상 시스템 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rewardSystems.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          reward.type === 'login' ? 'bg-primary-soft' :
                          reward.type === 'level' ? 'bg-success-soft' :
                          reward.type === 'purchase' ? 'bg-gold-soft' : 'bg-warning-soft'
                        }`}>
                          <span className="text-2xl">{reward.icon}</span>
                        </div>
                        
                        <div>
                          <div className="font-medium text-foreground">{reward.name}</div>
                          <div className="text-sm text-muted-foreground">{reward.description}</div>
                          <div className="text-xs text-gold font-bold">
                            {reward.goldAmount.toLocaleString()}G
                            {reward.itemReward && ` + ${reward.itemReward}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRewardDialog({ open: true, mode: 'edit', reward })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRewardDelete(reward.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        
                        <Switch
                          checked={reward.enabled}
                          onCheckedChange={(checked) => updateRewardSystem(reward.id, { enabled: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🛍️ 상점 관리 탭 */}
          <TabsContent value="shop" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">상점 관리</h2>
                <p className="text-sm text-muted-foreground">상점 아이템 추가, 편집, 삭제 및 관리</p>
              </div>

              <Dialog open={shopDialog.open} onOpenChange={(open) => setShopDialog({ ...shopDialog, open })}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShopDialog({ open: true, mode: 'add', item: null })}
                    className="bg-gradient-game btn-hover-lift"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    상품 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-metal max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {shopDialog.mode === 'add' ? '새 상품 추가' : '상품 수정'}
                    </DialogTitle>
                    <DialogDescription>
                      {shopDialog.mode === 'add' 
                        ? '새로운 상점 아이템을 생성합니다.' 
                        : '선택한 상품의 정보를 수정합니다.'}
                    </DialogDescription>
                  </DialogHeader>
                  <ShopItemEditForm
                    item={shopDialog.item}
                    onSave={handleShopItemSave}
                    onCancel={() => setShopDialog({ open: false, mode: 'add', item: null })}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{shopItems.length}</div>
                      <div className="text-sm text-muted-foreground">총 상품</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-success" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{shopItems.filter(i => i.enabled).length}</div>
                      <div className="text-sm text-muted-foreground">활성 상품</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-gold" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{dashboardStats.totalSales}</div>
                      <div className="text-sm text-muted-foreground">총 판매</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Percent className="w-8 h-8 text-warning" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{shopItems.filter(i => i.discountPercent > 0).length}</div>
                      <div className="text-sm text-muted-foreground">할인 상품</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-metal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  상품 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shopItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          item.type === 'skin' ? 'bg-primary-soft' :
                          item.type === 'powerup' ? 'bg-success-soft' :
                          item.type === 'vip' ? 'bg-gold-soft' : 'bg-warning-soft'
                        }`}>
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{item.name}</span>
                            <Badge className={getRarityColor(item.rarity)}>
                              {item.rarity}
                            </Badge>
                            {item.discountPercent > 0 && (
                              <Badge variant="destructive">
                                -{item.discountPercent}%
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.price.toLocaleString()}G • 재고: {item.stock} • 판매: {item.soldCount}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShopDialog({ open: true, mode: 'edit', item })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShopItemDelete(item.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => updateShopItem(item.id, { enabled: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📺 방송 설정 탭 */}
          <TabsContent value="streaming" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">방송 설정 관리</h2>
              <p className="text-sm text-muted-foreground">내부 방송 설정 및 홍보 관리</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    기본 방송 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">방송 제목</Label>
                    <Input
                      id="title"
                      value={streamConfig.title}
                      onChange={(e) => updateStreamConfig('title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">방송 설명</Label>
                    <Textarea
                      id="description"
                      value={streamConfig.description}
                      onChange={(e) => updateStreamConfig('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="announcement">공지사항</Label>
                    <Textarea
                      id="announcement"
                      value={streamConfig.announcement}
                      onChange={(e) => updateStreamConfig('announcement', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxViewers">최대 시청자</Label>
                      <Input
                        id="maxViewers"
                        type="number"
                        value={streamConfig.maxViewers}
                        onChange={(e) => updateStreamConfig('maxViewers', Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vipPrice">VIP 가격</Label>
                      <Input
                        id="vipPrice"
                        type="number"
                        value={streamConfig.vipPrice}
                        onChange={(e) => updateStreamConfig('vipPrice', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gold" />
                    방송 기능 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">라이브 상태</Label>
                      <p className="text-sm text-muted-foreground">방송 온/오프 설정</p>
                    </div>
                    <Switch
                      checked={streamConfig.isLive}
                      onCheckedChange={(checked) => updateStreamConfig('isLive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">채팅 기능</Label>
                      <p className="text-sm text-muted-foreground">실시간 채팅 허용</p>
                    </div>
                    <Switch
                      checked={streamConfig.chatEnabled}
                      onCheckedChange={(checked) => updateStreamConfig('chatEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">선물 시스템</Label>
                      <p className="text-sm text-muted-foreground">선물 주고받기 기능</p>
                    </div>
                    <Switch
                      checked={streamConfig.giftsEnabled}
                      onCheckedChange={(checked) => updateStreamConfig('giftsEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">자동 모더레이션</Label>
                      <p className="text-sm text-muted-foreground">부적절한 내용 자동 차단</p>
                    </div>
                    <Switch
                      checked={streamConfig.autoModeration}
                      onCheckedChange={(checked) => updateStreamConfig('autoModeration', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="privatePrice">개인방 가격</Label>
                    <Input
                      id="privatePrice"
                      type="number"
                      value={streamConfig.privateRoomPrice}
                      onChange={(e) => updateStreamConfig('privateRoomPrice', Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-metal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-success" />
                  방송 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{dashboardStats.liveViewers}</div>
                    <div className="text-sm text-muted-foreground">현재 시청자</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-gold">152</div>
                    <div className="text-sm text-muted-foreground">VIP 구독자</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-success">1,247</div>
                    <div className="text-sm text-muted-foreground">오늘 하트</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-warning">23</div>
                    <div className="text-sm text-muted-foreground">개인방 신청</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🛡️ 보안 모니터링 탭 */}
          <TabsContent value="security" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">보안 모니터링</h2>
              <p className="text-sm text-muted-foreground">이용자 감지 조건 설정 및 보안 알림 관리</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-warning" />
                    감지 조건 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{filter.name}</span>
                            <Badge variant={
                              filter.severity === 'critical' ? 'destructive' :
                              filter.severity === 'high' ? 'destructive' :
                              filter.severity === 'medium' ? 'secondary' : 'outline'
                            }>
                              {filter.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{filter.description}</div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              value={filter.value}
                              onChange={(e) => updateSecurityFilter(filter.id, { value: Number(e.target.value) })}
                              className="w-24 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              {filter.condition === 'win_rate' && '%'}
                              {filter.condition === 'same_ip_logins' && '개'}
                              {filter.condition === 'gold_increase' && 'G'}
                              {filter.condition === 'suspicious_pattern' && '회'}
                            </span>
                          </div>
                        </div>
                        
                        <Switch
                          checked={filter.enabled}
                          onCheckedChange={(checked) => updateSecurityFilter(filter.id, { enabled: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-metal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-error" />
                    보안 알림
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityAlerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'high' ? 'bg-error-soft border-error' :
                        alert.severity === 'medium' ? 'bg-warning-soft border-warning' :
                        'bg-info-soft border-info'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`w-4 h-4 ${
                              alert.severity === 'high' ? 'text-error' :
                              alert.severity === 'medium' ? 'text-warning' : 'text-info'
                            }`} />
                            <span className="font-medium text-foreground">{alert.message}</span>
                          </div>
                          <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                            {alert.status === 'active' ? '진행중' : '조사중'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          사용자: {alert.userId} • {alert.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-metal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-info" />
                  실시간 모니터링
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-error">{securityAlerts.filter(a => a.status === 'active').length}</div>
                    <div className="text-sm text-muted-foreground">활성 알림</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-warning">{securityFilters.filter(f => f.enabled).length}</div>
                    <div className="text-sm text-muted-foreground">활성 필터</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-success">98.7%</div>
                    <div className="text-sm text-muted-foreground">시스템 안정성</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기타 탭들 - 간단한 플레이스홀더 */}
          <TabsContent value="logs">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">로그 관리</h3>
              <p className="text-muted-foreground">시스템 로그 및 사용자 활동 기록</p>
            </div>
          </TabsContent>

          <TabsContent value="backup">
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">백업/복원</h3>
              <p className="text-muted-foreground">데이터 백업 및 복원 관리</p>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">시스템 설정</h3>
              <p className="text-muted-foreground">게임 설정 및 시스템 구성</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 👥 사용자 편집 폼 컴포넌트
function UserEditForm({ 
  user, 
  onSave, 
  onCancel 
}: { 
  user: AdminUser | null; 
  onSave: (user: Partial<AdminUser>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    goldBalance: user?.goldBalance || 10000,
    level: user?.level || 1,
    status: user?.status || 'active',
    isVip: user?.isVip || false
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          value={formData.nickname}
          onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
          placeholder="사용자 닉네임"
        />
      </div>
      
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="user@email.com"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goldBalance">골드</Label>
          <Input
            id="goldBalance"
            type="number"
            value={formData.goldBalance}
            onChange={(e) => setFormData(prev => ({ ...prev, goldBalance: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="level">레벨</Label>
          <Input
            id="level"
            type="number"
            value={formData.level}
            onChange={(e) => setFormData(prev => ({ ...prev, level: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">상태</Label>
        <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="suspended">정지</SelectItem>
            <SelectItem value="banned">차단</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isVip">VIP 사용자</Label>
        <Switch
          id="isVip"
          checked={formData.isVip}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVip: checked }))}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          취소
        </Button>
        <Button 
          onClick={() => onSave(formData)} 
          className="flex-1 bg-gradient-game"
          disabled={!formData.nickname || !formData.email}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

// 🎁 보상 편집 폼 컴포넌트
function RewardEditForm({ 
  reward, 
  onSave, 
  onCancel 
}: { 
  reward: RewardSystem | null; 
  onSave: (reward: Partial<RewardSystem>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: reward?.name || '',
    type: reward?.type || 'login',
    goldAmount: reward?.goldAmount || 1000,
    itemReward: reward?.itemReward || '',
    condition: reward?.condition || '',
    description: reward?.description || '',
    icon: reward?.icon || '🎁'
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">보상 이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="보상 이름"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">보상 유형</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="login">로그인</SelectItem>
              <SelectItem value="level">레벨업</SelectItem>
              <SelectItem value="purchase">구매</SelectItem>
              <SelectItem value="event">이벤트</SelectItem>
              <SelectItem value="achievement">업적</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="icon">아이콘</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="🎁"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goldAmount">골드 보상</Label>
          <Input
            id="goldAmount"
            type="number"
            value={formData.goldAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, goldAmount: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="itemReward">아이템 보상 (선택)</Label>
          <Input
            id="itemReward"
            value={formData.itemReward}
            onChange={(e) => setFormData(prev => ({ ...prev, itemReward: e.target.value }))}
            placeholder="레어 스킨"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="condition">조건</Label>
        <Input
          id="condition"
          value={formData.condition}
          onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
          placeholder="daily_login"
        />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="보상에 대한 설명"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          취소
        </Button>
        <Button 
          onClick={() => onSave(formData)} 
          className="flex-1 bg-gradient-gold"
          disabled={!formData.name || !formData.condition}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

// 🛍️ 상점 아이템 편집 폼 컴포넌트
function ShopItemEditForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: ShopItem | null; 
  onSave: (item: Partial<ShopItem>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 1000,
    type: item?.type || 'skin',
    category: item?.category || '기타',
    rarity: item?.rarity || 'common',
    icon: item?.icon || '🎁',
    stock: item?.stock || 999,
    discountPercent: item?.discountPercent || 0
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">상품 이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="상품 이름"
        />
      </div>
      
      <div>
        <Label htmlFor="description">상품 설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="상품에 대한 설명"
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">가격</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="icon">아이콘</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="🎁"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">상품 유형</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skin">스킨</SelectItem>
              <SelectItem value="powerup">부스터</SelectItem>
              <SelectItem value="currency">골드</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="special">특별</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rarity">등급</Label>
          <Select value={formData.rarity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, rarity: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common">일반</SelectItem>
              <SelectItem value="rare">레어</SelectItem>
              <SelectItem value="epic">에픽</SelectItem>
              <SelectItem value="legendary">전설</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">카테고리</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="스킨"
          />
        </div>
        <div>
          <Label htmlFor="stock">재고</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="discountPercent">할인율 (%)</Label>
          <Input
            id="discountPercent"
            type="number"
            value={formData.discountPercent}
            onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          취소
        </Button>
        <Button 
          onClick={() => onSave(formData)} 
          className="flex-1 bg-gradient-game"
          disabled={!formData.name || !formData.description}
        >
          저장
        </Button>
      </div>
    </div>
  );
}