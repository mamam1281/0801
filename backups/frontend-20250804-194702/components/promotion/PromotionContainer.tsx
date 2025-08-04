'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Zap, 
  Gift, 
  Target, 
  Crown,
  Flame,
  Percent,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Trophy,
  Coins,
  Check,
  Sparkles
} from 'lucide-react';

export default function PromotionContainer() {
  const [selectedTab, setSelectedTab] = useState<'current' | 'upcoming'>('current');

  // 프로모션 데이터
  const currentPromotions = [
    {
      id: 'welcome-bonus',
      title: '신규 가입 보너스',
      description: '첫 입금 시 500% 보너스',
      type: 'bonus',
      discount: '500%',
      timeLeft: '상시 진행',
      isNew: true,
      icon: Crown,
      color: 'from-amber-500/20 to-yellow-500/20',
      borderColor: 'border-amber-400/30'
    },
    {
      id: 'flash-sale',
      title: '플래시 세일',
      description: '모든 토큰 패키지 90% 할인',
      type: 'flash',
      discount: '90%',
      timeLeft: '23:45:12',
      isUrgent: true,
      icon: Zap,
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-400/30'
    },
    {
      id: 'vip-exclusive',
      title: 'VIP 전용 보너스',
      description: 'VIP 회원만의 특별 혜택',
      type: 'vip',
      discount: '300%',
      timeLeft: '7일 남음',
      isVip: true,
      icon: Trophy,
      color: 'from-purple-500/20 to-indigo-500/20',
      borderColor: 'border-purple-400/30'
    },
    {
      id: 'weekly-bonus',
      title: '주간 보너스',
      description: '매주 새로운 보너스 기회',
      type: 'weekly',
      discount: '200%',
      timeLeft: '3일 남음',
      isNew: false,
      icon: Calendar,
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-400/30'
    }
  ];

  const upcomingPromotions = [
    {
      id: 'mega-event',
      title: '메가 이벤트',
      description: '곧 시작되는 특별 이벤트',
      type: 'event',
      discount: '777%',
      timeLeft: '내일 시작',
      isNew: true,
      icon: Sparkles,
      color: 'from-pink-500/20 to-rose-500/20',
      borderColor: 'border-pink-400/30'
    },
    {
      id: 'weekend-special',
      title: '주말 스페셜',
      description: '주말 한정 특가 혜택',
      type: 'weekend',
      discount: '400%',
      timeLeft: '이번 주말',
      isNew: false,
      icon: Gift,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-400/30'
    }
  ];

  const displayPromotions = selectedTab === 'current' ? currentPromotions : upcomingPromotions;

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">🎁 프로모션</h1>
          <p className="text-slate-300 text-sm">특별한 혜택과 보너스를 확인하세요</p>
        </motion.div>
      </div>

      {/* 탭 */}
      <div className="px-5 mb-6">
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-600/30">
          {[
            { key: 'current', label: '진행중' },
            { key: 'upcoming', label: '예정' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as 'current' | 'upcoming')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                selectedTab === tab.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 프로모션 목록 */}
      <div className="px-5 pb-20 space-y-4">
        {displayPromotions.map((promotion, index) => {
          const IconComponent = promotion.icon;
          
          return (
            <motion.div
              key={promotion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-xl p-6 transition-all duration-300 cursor-pointer 
                         bg-gradient-to-r ${promotion.color} 
                         border ${promotion.borderColor} 
                         hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm`}
            >
              {/* 배지들 */}
              <div className="absolute top-4 right-4 flex flex-col gap-1">
                {promotion.isNew && (
                  <span className="px-2 py-0.5 bg-green-500/80 text-white text-xs font-medium rounded-full">
                    NEW
                  </span>
                )}
                {promotion.isUrgent && (
                  <span className="px-2 py-0.5 bg-red-500/80 text-white text-xs font-medium rounded-full">
                    긴급
                  </span>
                )}
                {promotion.isVip && (
                  <span className="px-2 py-0.5 bg-purple-500/80 text-white text-xs font-medium rounded-full">
                    VIP
                  </span>
                )}
              </div>

              {/* 메인 컨텐츠 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{promotion.title}</h3>
                  <p className="text-slate-300 text-sm mb-3 leading-relaxed">{promotion.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{promotion.discount}</span>
                      <div className="text-xs text-slate-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {promotion.timeLeft}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 
                               text-white text-sm font-medium rounded-lg 
                               border border-white/30 transition-all duration-200
                               flex items-center gap-1"
                    >
                      참여
                      <ChevronRight className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
