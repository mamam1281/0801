import { BaseCard } from './Basecard';
import { TrendingUp, Star } from 'lucide-react';

interface PointsCardProps {
  currentPoints: number;
  weeklyChange: number;
  rank: number;
  nextReward?: string;
}

export function PointsCard({ currentPoints, weeklyChange, rank, nextReward }: PointsCardProps) {
  const isPositive = weeklyChange >= 0;

  return (
    <BaseCard variant="accent" className="w-full max-w-sm min-h-[300px]">
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-16 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-medium text-white">포인트</h3>
            </div>
            <div className="text-gray-300 text-sm">#{rank}</div>
          </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="text-2xl font-bold text-amber-400">
            {currentPoints.toLocaleString()}P
          </div>
          
          <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
            <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{weeklyChange}P
            </span>
            <span className="text-gray-300 text-sm">이번 주</span>
          </div>
        </div>

        {nextReward && (
          <div className="p-3 rounded-lg bg-black/30 border border-white/10" style={{ marginTop: '1.1rem' }}>
            <div className="text-gray-400 text-xs">다음 보상</div>
            <div className="text-white text-sm font-medium mt-1">{nextReward}</div>
          </div>
        )}
      </div>
      </div>
    </BaseCard>
  );
}