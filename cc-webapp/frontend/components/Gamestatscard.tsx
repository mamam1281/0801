import { BaseCard } from './Basecard';
import { Gamepad2, Trophy, TrendingUp } from 'lucide-react';

interface GameStatsCardProps {
  gamesPlayed: number;
  winRate: number;
  bestScore: number;
  totalPlayTime: string;
}

export function GameStatsCard({ gamesPlayed, winRate, bestScore, totalPlayTime }: GameStatsCardProps) {
  return (
    <BaseCard variant="info" className="w-full max-w-sm min-h-[300px]">
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-16 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-medium text-white">게임 통계</h3>
          </div>

        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="text-gray-400 text-sm">플레이 횟수</div>
            <div className="text-lg font-semibold text-white">{gamesPlayed}</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="text-gray-400 text-sm">승률</div>
            <div className="text-lg font-semibold text-green-400">{winRate}%</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400 text-sm">최고 점수</span>
            </div>
            <span className="text-amber-400 font-medium">{bestScore.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10" style={{ marginTop: '0.5rem' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">총 플레이 시간</span>
            </div>
            <span className="text-blue-400 font-medium">{totalPlayTime}</span>
          </div>
        </div>
      </div>
      </div>
    </BaseCard>
  );
}