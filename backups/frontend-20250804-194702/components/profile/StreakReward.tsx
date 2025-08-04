'use client';

import { Gift, Clock, CheckCircle } from 'lucide-react';

interface StreakRewardProps {
  streak: number;
  onClaimReward: () => void;
}

/**
 * 연속 출석 보상 알림
 * 한국인의 출석 문화에 맞춘 UI
 */
export default function StreakReward({ streak, onClaimReward }: StreakRewardProps) {
  // 7일 이상일 때만 표시
  if (streak < 7) return null;

  const isWeeklyMilestone = streak % 7 === 0;
  const nextMilestone = Math.ceil(streak / 7) * 7;
  const daysToNext = nextMilestone - streak;

  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/20 border-2 border-purple-400/40 
                    rounded-xl p-4 relative overflow-hidden">
      
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {isWeeklyMilestone ? (
          // 주간 달성 시
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-lg font-bold text-green-300">
                {streak}일 연속 출석 달성! 🎉
              </span>
            </div>
            <button 
              onClick={onClaimReward}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 
                         text-white font-bold rounded-lg hover:from-green-500 hover:to-emerald-500
                         transform hover:scale-105 active:scale-95 transition-all duration-200
                         shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              특별 보상 받기
            </button>
          </div>
        ) : (
          // 진행 중
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-base font-medium text-purple-300">
                연속 출석 {streak}일째
              </span>
            </div>
            <div className="text-sm text-purple-200">
              {daysToNext}일 더 출석하면 특별 보상!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
