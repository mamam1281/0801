'use client';

import { Coins, Flame } from 'lucide-react';

interface StatsDisplayProps {
  tokens: number;
  streak: number;
  wins: number;
  missions: number;
  className?: string;
}

/**
 * 핵심 통계만 깔끔하게 표시
 * 한국 사용자가 중요하게 생각하는 지표 위주
 */
export default function StatsDisplay({ 
  tokens, 
  streak, 
  wins, 
  missions, 
  className = '' 
}: StatsDisplayProps) {
  return (
    <div className={`grid grid-cols-2 gap-5 ${className}`} role="region" aria-label="계정 통계">
      {/* 토큰 (가장 중요) - 400px 너비에 최적화 */}
      <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/30 
                      rounded-xl p-5 text-center focus-within:ring-2 focus-within:ring-amber-400/50"
           tabIndex={0}
           role="button"
           aria-label={`보유 토큰 ${tokens.toLocaleString()}개`}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Coins className="w-6 h-6 text-amber-400" />
          <span className="text-base text-amber-300">보유 토큰</span>
        </div>
        <div className="text-3xl font-bold text-amber-400">
          {tokens.toLocaleString()}
        </div>
      </div>
      
      {/* 연속 출석 (한국인 출석 문화) */}
      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-400/30 
                      rounded-xl p-5 text-center focus-within:ring-2 focus-within:ring-orange-400/50"
           tabIndex={0}
           role="button"
           aria-label={`연속 출석 ${streak}일째`}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-orange-400" />
          <span className="text-base text-orange-300">연속 출석</span>
        </div>
        <div className="text-3xl font-bold text-orange-400">
          {streak}일
        </div>
      </div>
      
      {/* 승리/미션 통계 - 400px 너비 활용 */}
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-400/30 
                      rounded-xl p-4 text-center focus-within:ring-2 focus-within:ring-green-400/50"
           tabIndex={0}
           role="button"
           aria-label={`총 ${wins}승 달성`}>
        <div className="text-2xl font-bold text-green-400">{wins}</div>
        <div className="text-sm text-green-300">승리</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-400/30 
                      rounded-xl p-4 text-center focus-within:ring-2 focus-within:ring-blue-400/50"
           tabIndex={0}
           role="button"
           aria-label={`${missions}개 미션 완료`}>
        <div className="text-2xl font-bold text-blue-400">{missions}</div>
        <div className="text-sm text-blue-300">미션완료</div>
      </div>
    </div>
  );
}
