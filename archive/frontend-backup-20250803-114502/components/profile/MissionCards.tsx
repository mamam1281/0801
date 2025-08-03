'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Card } from '../ui/basic/card';
import { Button } from '../ui/basic/button';
import ProgressCircle from './ProgressCircle';
import { SimpleProgressBar } from '../SimpleProgressBar';
import type { Mission } from './types';

interface MissionCardsProps {
  missions: Mission[];
  onMissionClick?: (mission: Mission) => void;
  onVisitSite?: () => void;
}

export default function MissionCards({
  missions,
  onMissionClick,
  onVisitSite
}: MissionCardsProps) {
  const getMissionTypeColor = (type: Mission['type']) => {
    switch (type) {
      case 'DAILY':
        return {
          bg: 'from-gray-800/95 to-gray-900/95',
          border: 'border-gray-600/40',
          text: 'text-gray-200',
          icon: '📅',
          glow: 'shadow-gray-600/20'
        };
      case 'WEEKLY':
        return {
          bg: 'from-gray-800/95 to-gray-900/95',
          border: 'border-gray-600/40',
          text: 'text-gray-200',
          icon: '📊',
          glow: 'shadow-gray-600/20'
        };
      case 'SPECIAL':
        return {
          bg: 'from-gray-800/95 to-gray-900/95',
          border: 'border-yellow-500/40',
          text: 'text-yellow-200',
          icon: '⭐',
          glow: 'shadow-yellow-500/20'
        };
      default:
        return {
          bg: 'from-gray-800/95 to-gray-900/95',
          border: 'border-gray-600/40',
          text: 'text-gray-200',
          icon: '🎯',
          glow: 'shadow-gray-600/20'
        };
    }
  };

  const getMissionTypeLabel = (type: Mission['type']) => {
    switch (type) {
      case 'DAILY': return '일일';
      case 'WEEKLY': return '주간';
      case 'SPECIAL': return '특별';
      default: return '미션';
    }
  };

  return (
    <div className="space-y-4">
      {/* 420px 너비 최적화 - 데일리 모달 스타일 통일 */}
      <div className="space-y-3">
        {missions.map((mission, index) => {
          const colors = getMissionTypeColor(mission.type);
          const progressPercentage = (mission.progress / mission.target) * 100;
          const isCompleted = mission.isCompleted || mission.progress >= mission.target;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                rotate: [0, -1, 1, -1, 0], // 떨림 애니메이션
                transition: {
                  rotate: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
                  scale: { duration: 0.2 }
                }
              }}
              className="w-full"
            >
              {/* 데일리 모달과 동일한 카드 스타일 - 고정 높이 적용 */}
              <div
                className={`
                  rounded-xl min-h-[250px] relative overflow-hidden bg-gray-800/95 
                  backdrop-blur-sm border border-gray-600/50 shadow-lg w-full
                  cursor-pointer transition-all duration-300 flex flex-col
                  ${isCompleted ? 'opacity-75' : 'hover:shadow-xl hover:shadow-gray-600/20'}
                `}
                style={{
                  padding: '24px',
                  maxWidth: '100% !important',
                  width: '100% !important'
                }}
                onClick={() => onMissionClick?.(mission)}
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-900/30 pointer-events-none" />

                <div className="relative z-10 space-y-2 flex-1 flex flex-col">
                  {/* Header with Mission Type Badge */}
                  <div className="flex items-start justify-between mt-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white leading-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ fontSize: '18px' }}>
                        {mission.title}
                      </h4>
                      <p className="text-white/90 leading-tight font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ fontSize: '16px' }}>
                        {mission.description}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex-shrink-0 ml-2">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                          className="w-8 h-8 rounded-full bg-green-500/30 border border-green-500/50 
                                     flex items-center justify-center"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </motion.div>
                      ) : null}
                    </div>
                  </div>                    {/* Progress Section - 하단 고정 */}
                  <div className="mt-auto space-y-2">
                    {/* Progress Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${colors.text} px-3 py-2 rounded-lg 
                                        bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/30 
                                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.3)] 
                                        whitespace-nowrap transform hover:scale-105 transition-all duration-200`}
                          style={{ fontSize: '12px' }}>
                          {mission.progress}/{mission.target}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 
                                     border-2 border-yellow-400/40 
                                     shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_3px_6px_rgba(0,0,0,0.4)] 
                                     transform hover:scale-105 transition-all duration-200">
                        <span className="text-lg">💎</span>
                        <span className="font-bold text-yellow-200 whitespace-nowrap drop-shadow-lg" style={{ fontSize: '12px' }}>
                          +{mission.reward.amount}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <SimpleProgressBar
                        progress={progressPercentage}
                        size="md"
                        showPercentage={false}
                        className="w-full [&>div]:bg-gray-700 [&>div>div]:bg-gradient-to-r [&>div>div]:from-gray-400 [&>div>div]:to-gray-200"
                      />

                      <div className="flex items-center justify-between text-white/60" style={{ fontSize: '11px' }}>
                        <span>0%</span>
                        <span className={`font-bold ${colors.text}`}>
                          {Math.round(progressPercentage)}%
                        </span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Time Left */}
                  {mission.timeLeft && (
                    <div className="flex items-center gap-2 text-white/60 whitespace-nowrap" style={{ fontSize: '11px' }}>
                      <Clock className="w-3 h-3" />
                      <span>{mission.timeLeft}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visit Site Button - 핑크 색상으로 업데이트 */}
      {onVisitSite && (
        <Button
          onClick={onVisitSite}
          variant="outline"
          className="w-full h-12 border-pink-400/50 text-white bg-gradient-to-r from-pink-500/20 to-rose-500/20
                     hover:from-pink-500/30 hover:to-rose-500/30 hover:border-pink-400/70
                     flex items-center justify-center gap-2 rounded-lg
                     transform hover:scale-[1.01] transition-all duration-200"
          style={{
            borderColor: '#f472b6',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)'
          }}
        >
          <ExternalLink className="w-4 h-4" />
          더 많은 미션 보기
        </Button>
      )}
    </div>
  );
}
