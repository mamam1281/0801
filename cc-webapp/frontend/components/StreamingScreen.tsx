'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Heart,
  Eye,
  Star,
  Gift,
  Crown,
  ThumbsUp,
  Share2,
  Volume2,
  VolumeX,
  Send,
  Diamond,
  Users,
  Play,
  Pause,
  Lock,
  Info,
  Video,
  Image,
  Calendar,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { User } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface StreamingScreenProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

// 전속 VJ 정보
const EXCLUSIVE_VJ = {
  name: 'Luna Star',
  nickname: '루나',
  age: 25,
  location: '서울',
  followers: 125400,
  totalHearts: 2847320,
  currentViewers: 18750,
  isLive: true,
  status: '💃 섹시 댄스 라이브쇼',
  profileImage: '/images/streaming/model-1.png', // 스트리밍용 이미지로 변경
  streamThumbnail: '/images/streaming/model-1.png', // 스트리밍용 이미지로 변경
  bio: '매일 밤 9시 특별한 시간을 함께해요 💕 개인 메시지 환영!',
  specialties: ['댄스', '토크', '게임', '노래'],
  vipPrice: 5000,
  privatePrice: 10000
};

// 선물 목록
const GIFTS = [
  { id: 'heart', name: '하트', icon: '❤️', price: 100, effect: 'hearts', benefit: '기본 애정 표현' },
  { id: 'rose', name: '장미', icon: '🌹', price: 500, effect: 'roses', benefit: '특별한 인사 + VJ 멘션' },
  { id: 'kiss', name: '키스', icon: '💋', price: 1000, effect: 'kisses', benefit: '개인 메시지 + 에어키스' },
  { id: 'diamond', name: '다이아몬드', icon: '💎', price: 5000, effect: 'diamonds', benefit: '프리미엄 댄스 + 개인 영상' },
  { id: 'crown', name: '왕관', icon: '👑', price: 10000, effect: 'crowns', benefit: 'VIP 대우 + 커스텀 쇼' },
];

// 영상 갤러리
const VIDEO_GALLERY = [
  {
    id: 1,
    title: '🔥 섹시 댄스 하이라이트',
    thumbnail: '/images/streaming/model-2.png', // 스트리밍용 이미지로 변경
    duration: '15:32',
    views: 45230,
    hearts: 8920,
    date: '2일 전',
    isHot: true,
    price: 1000
  },
  {
    id: 2,
    title: '💋 개인방 미리보기',
    thumbnail: '/images/streaming/model-3.png', // 스트리밍용 이미지로 변경
    duration: '8:45',
    views: 32100,
    hearts: 12400,
    date: '1주 전',
    isPrivate: true,
    price: 3000
  },
  {
    id: 3,
    title: '✨ 코스프레 변신쇼',
    thumbnail: '/images/streaming/model-4.png', // 스트리밍용 이미지로 변경
    duration: '22:18',
    views: 28750,
    hearts: 6850,
    date: '3일 전',
    isNew: true,
    price: 1500
  },
  {
    id: 4,
    title: '🌙 밤이 되면 미리보기',
    thumbnail: '/images/streaming/model-1.png', // 스트리밍용 이미지로 변경
    duration: '12:05',
    views: 19800,
    hearts: 5940,
    date: '5일 전',
    price: 800
  },
  {
    id: 5,
    title: '💎 VIP 전용 스페셜',
    thumbnail: '/images/streaming/model-2.png', // 스트리밍용 이미지로 변경
    duration: '25:14',
    views: 15600,
    hearts: 9240,
    date: '1주 전',
    isVip: true,
    price: 5000
  },
  {
    id: 6,
    title: '🎵 노래하는 루나',
    thumbnail: '/images/streaming/model-3.png', // 스트리밍용 이미지로 변경
    duration: '18:33',
    views: 41200,
    hearts: 7650,
    date: '4일 전',
    price: 700
  }
];

export function StreamingScreen({ user, onBack, onUpdateUser, onAddNotification }: StreamingScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentViewers, setCurrentViewers] = useState(EXCLUSIVE_VJ.currentViewers);
  const [heartAnimations, setHeartAnimations] = useState<Array<{id: number, x: number, y: number, type: string}>>([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [benefitType, setBenefitType] = useState<'gift' | 'vip' | 'private' | null>(null);
  const [myHearts, setMyHearts] = useState(user.stats.gamesWon * 15);
  const [selectedVideo, setSelectedVideo] = useState<typeof VIDEO_GALLERY[0] | null>(null);

  // 실시간 뷰어 수 변화
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentViewers(prev => prev + Math.floor(Math.random() * 100) - 50);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 하트 애니메이션 생성
  const generateHeartEffect = (type: string = 'heart') => {
    const newHearts = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      type
    }));
    
    setHeartAnimations(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setHeartAnimations(prev => prev.filter(heart => !newHearts.find(h => h.id === heart.id)));
    }, 3000);
  };

  // 혜택 모달 열기
  const showBenefits = (type: 'gift' | 'vip' | 'private') => {
    setBenefitType(type);
    setShowBenefitsModal(true);
  };

  // 선물 보내기
  const sendGift = (gift: typeof GIFTS[0]) => {
    if (user.goldBalance < gift.price) {
      onAddNotification(`❌ ${gift.price}G가 필요합니다!`);
      return;
    }

    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - gift.price
    };
    
    onUpdateUser(updatedUser);
    generateHeartEffect(gift.effect);
    onAddNotification(`${gift.icon} ${gift.name}을 보냈습니다! (${gift.price}G)`);
    setShowGiftMenu(false);
  };

  // VIP 구독
  const subscribeVip = () => {
    if (user.goldBalance < EXCLUSIVE_VJ.vipPrice) {
      onAddNotification(`❌ VIP 구독에 ${EXCLUSIVE_VJ.vipPrice}G가 필요합니다!`);
      return;
    }

    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - EXCLUSIVE_VJ.vipPrice
    };
    
    onUpdateUser(updatedUser);
    onAddNotification(`👑 VIP 구독 완료! 특별 혜택을 누리세요!`);
    generateHeartEffect('crowns');
  };

  // 개인방 신청
  const requestPrivate = () => {
    if (user.goldBalance < EXCLUSIVE_VJ.privatePrice) {
      onAddNotification(`❌ 개인방에 ${EXCLUSIVE_VJ.privatePrice}G가 필요합니다!`);
      return;
    }

    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - EXCLUSIVE_VJ.privatePrice
    };
    
    onUpdateUser(updatedUser);
    onAddNotification(`💎 개인방 신청 완료! 곧 연결됩니다...`);
    generateHeartEffect('diamonds');
  };

  // 영상 구매/시청
  const watchVideo = (video: typeof VIDEO_GALLERY[0]) => {
    if (video.isVip && user.level < 30) {
      onAddNotification(`❌ VIP 영상은 레벨 30 이상부터 시청 가능합니다!`);
      return;
    }

    if (user.goldBalance < video.price) {
      onAddNotification(`❌ ${video.price}G가 필요합니다!`);
      return;
    }

    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - video.price
    };
    
    onUpdateUser(updatedUser);
    setSelectedVideo(video);
    onAddNotification(`🎬 영상 시청 시작! ${video.price}G 차감`);
    generateHeartEffect('hearts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-pink-900/10 relative overflow-hidden">
      {/* 하트 애니메이션 */}
      <AnimatePresence>
        {heartAnimations.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              opacity: 0,
              scale: 0,
              x: `${heart.x}vw`,
              y: `${heart.y}vh`
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
              y: `${heart.y - 30}vh`,
              rotate: [0, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="fixed text-pink-400 pointer-events-none z-20"
          >
            {heart.type === 'hearts' && '❤️'}
            {heart.type === 'roses' && '🌹'}
            {heart.type === 'kisses' && '💋'}
            {heart.type === 'diamonds' && '💎'}
            {heart.type === 'crowns' && '👑'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 간소화된 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-30 p-4 border-b border-border-secondary backdrop-blur-sm"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-border-secondary hover:border-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
                💕 전속 VJ 루나의 방
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-border-secondary hover:border-primary"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">보유 골드</div>
              <div className="text-xl font-bold text-gold">
                {user.goldBalance.toLocaleString()}G
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-20 p-4 max-w-7xl mx-auto space-y-6">
        
        {/* 라이브 스트림 섹션 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl overflow-hidden"
        >
          {/* 방송 화면 */}
          <div className="relative aspect-video bg-gradient-to-br from-pink-900/20 to-purple-900/20">
            <img 
              src={EXCLUSIVE_VJ.streamThumbnail}
              alt="Live Stream"
              className="w-full h-full object-cover"
            />
            
            {/* 라이브 배지 */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-500 text-white animate-pulse px-3 py-1">
                🔴 LIVE
              </Badge>
            </div>
            
            {/* 시청자 수 */}
            <div className="absolute top-4 right-4 bg-black/60 rounded-lg px-3 py-1 text-white text-sm">
              <Eye className="w-4 h-4 inline mr-1" />
              {currentViewers.toLocaleString()}
            </div>
            
            {/* 재생 컨트롤 */}
            <div className="absolute bottom-4 left-4">
              <Button
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/60 hover:bg-black/80 text-white border-none"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>

            {/* 플로팅 하트들 */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -100],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }}
                  className="absolute text-pink-400 text-2xl"
                  style={{
                    left: `${20 + i * 15}%`,
                    bottom: '10%'
                  }}
                >
                  ❤️
                </motion.div>
              ))}
            </div>
          </div>

          {/* VJ 정보 및 인터랙션 */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400">
                <img 
                  src={EXCLUSIVE_VJ.profileImage}
                  alt={EXCLUSIVE_VJ.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-foreground">{EXCLUSIVE_VJ.name}</h2>
                  <Badge className="bg-gold text-black">전속 VJ</Badge>
                  {user.level >= 10 && (
                    <Badge className="bg-purple-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{EXCLUSIVE_VJ.bio}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {EXCLUSIVE_VJ.specialties.map((specialty, idx) => (
                    <span 
                      key={idx}
                      className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full text-xs"
                    >
                      #{specialty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {EXCLUSIVE_VJ.followers.toLocaleString()} 팔로워
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-pink-400" />
                    {EXCLUSIVE_VJ.totalHearts.toLocaleString()} 하트
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 선물하기 카드 */}
              <Card 
                className="cursor-pointer hover:scale-105 transition-transform border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10"
                onClick={() => showBenefits('gift')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-400" />
                    선물하기
                    <Info className="w-3 h-3 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">100G ~ 10,000G</p>
                  <p className="text-xs">특별한 반응과 개인 메시지를 받아보세요!</p>
                </CardContent>
              </Card>

              {/* VIP 구독 카드 */}
              <Card 
                className="cursor-pointer hover:scale-105 transition-transform border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-gold/10"
                onClick={() => showBenefits('vip')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    VIP 구독
                    <Info className="w-3 h-3 text-muted-foreground ml-auto" />
                  </CardTitle>     
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{EXCLUSIVE_VJ.vipPrice}G / 월</p>
                  <p className="text-xs">독점 콘텐츠와 특별 혜택을 누리세요!</p>
                </CardContent>
              </Card>

              {/* 개인방 카드 */}
              <Card 
                className="cursor-pointer hover:scale-105 transition-transform border-gold/30 bg-gradient-to-br from-gold/10 to-pink-500/10"
                onClick={() => showBenefits('private')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-gold" />
                    개인방
                    <Info className="w-3 h-3 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{EXCLUSIVE_VJ.privatePrice}G / 세션</p>
                  <p className="text-xs">1:1 프라이빗 세션을 경험해보세요!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* 영상 갤러리 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-effect rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400" />
            💕 루나의 영상 모음
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIDEO_GALLERY.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => watchVideo(video)}
                className="glass-effect rounded-lg overflow-hidden cursor-pointer relative group"
              >
                {/* 배지들 */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {video.isHot && (
                    <Badge className="bg-red-500 text-white text-xs">
                      🔥 HOT
                    </Badge>
                  )}
                  {video.isNew && (
                    <Badge className="bg-green-500 text-white text-xs">
                      ✨ NEW
                    </Badge>
                  )}
                  {video.isVip && (
                    <Badge className="bg-purple-500 text-white text-xs">
                      👑 VIP
                    </Badge>
                  )}
                  {video.isPrivate && (
                    <Badge className="bg-gold text-black text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      PRIVATE
                    </Badge>
                  )}
                </div>

                {/* 가격 */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black/60 text-gold px-2 py-1 rounded text-xs font-bold">
                    {video.price}G
                  </div>
                </div>

                {/* 썸네일 */}
                <div className="relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* 재생 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-1" />
                    </div>
                  </div>

                  {/* 재생시간 */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </div>

                {/* 영상 정보 */}
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-400" />
                        {video.hearts.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {video.date}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 혜택 설명 모달 */}
      <AnimatePresence>
        {showBenefitsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBenefitsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-8 max-w-md w-full"
            >
              {benefitType === 'gift' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">선물하기 혜택</h3>
                    <p className="text-muted-foreground text-sm">VJ와 특별한 소통을 경험하세요!</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {GIFTS.map((gift) => (
                      <div key={gift.id} className="bg-secondary/30 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{gift.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{gift.name}</div>
                            <div className="text-xs text-gold">{gift.price}G</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{gift.benefit}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowBenefitsModal(false)} className="flex-1">
                      닫기
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowBenefitsModal(false);
                        setShowGiftMenu(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    >
                      선물하기
                    </Button>
                  </div>
                </>
              )}

              {benefitType === 'vip' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-gold rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">VIP 구독 혜택</h3>
                    <p className="text-muted-foreground text-sm">월 {EXCLUSIVE_VJ.vipPrice}G로 프리미엄 경험을!</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-purple-400 mb-1">👑 VIP 전용 콘텐츠</div>
                      <div className="text-xs text-muted-foreground">일반 회원이 볼 수 없는 특별 영상</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-purple-400 mb-1">💎 우선 채팅</div>
                      <div className="text-xs text-muted-foreground">VJ가 먼저 확인하는 특별 채팅</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-purple-400 mb-1">🎁 월간 선물</div>
                      <div className="text-xs text-muted-foreground">매달 특별 선물과 보너스 골드</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-purple-400 mb-1">⭐ 개인방 할인</div>
                      <div className="text-xs text-muted-foreground">개인방 이용료 30% 할인</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowBenefitsModal(false)} className="flex-1">
                      닫기
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowBenefitsModal(false);
                        subscribeVip();
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-gold text-white"
                    >
                      VIP 구독
                    </Button>
                  </div>
                </>
              )}

              {benefitType === 'private' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-gold to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Diamond className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">개인방 혜택</h3>
                    <p className="text-muted-foreground text-sm">세션당 {EXCLUSIVE_VJ.privatePrice}G로 1:1 프라이빗!</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-gold mb-1">💎 완전 개인 공간</div>
                      <div className="text-xs text-muted-foreground">오직 당신만을 위한 전용 방송</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-gold mb-1">🎭 커스텀 쇼</div>
                      <div className="text-xs text-muted-foreground">원하는 컨셉과 스타일로 진행</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-gold mb-1">💬 실시간 소통</div>
                      <div className="text-xs text-muted-foreground">음성/텍스트 실시간 대화</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="text-sm font-medium text-gold mb-1">📹 녹화 서비스</div>
                      <div className="text-xs text-muted-foreground">개인방 영상을 저장해드려요</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowBenefitsModal(false)} className="flex-1">
                      닫기
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowBenefitsModal(false);
                        requestPrivate();
                      }}
                      className="flex-1 bg-gradient-to-r from-gold to-pink-500 text-white"
                    >
                      개인방 신청
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 선물 메뉴 */}
      <AnimatePresence>
        {showGiftMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center justify-between">
                💝 선물 보내기
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowGiftMenu(false)}
                >
                  닫기
                </Button>
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {GIFTS.map((gift) => (
                  <motion.button
                    key={gift.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendGift(gift)}
                    className="bg-secondary/50 hover:bg-secondary/80 rounded-lg p-3 text-center transition-all"
                  >
                    <div className="text-2xl mb-1">{gift.icon}</div>
                    <div className="text-xs font-medium text-foreground">{gift.name}</div>
                    <div className="text-xs text-gold">{gift.price}G</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 영상 시청 모달 */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl overflow-hidden max-w-2xl w-full"
            >
              <div className="relative aspect-video">
                <img 
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center animate-pulse">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4"
                >
                  닫기
                </Button>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-2">{selectedVideo.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedVideo.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedVideo.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-pink-400" />
                    {selectedVideo.hearts.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}