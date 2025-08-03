'use client';

import { Coins, Gift, Trophy, Settings } from 'lucide-react';

interface QuickActionsProps {
  onChargeTokens: () => void;
  onViewRewards: () => void;
  onViewHistory: () => void;
  onSettings: () => void;
}

/**
 * 한국 사용자 친화적인 빠른 액션 버튼들
 * Primary/Secondary 액션 명확히 구분
 */
export default function QuickActions({ 
  onChargeTokens, 
  onViewRewards, 
  onViewHistory, 
  onSettings 
}: QuickActionsProps) {
  return (
    <div className="space-y-5">
      {/* Primary Actions - 400px 너비 최적화 */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onChargeTokens}
          className="flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                     text-white font-bold rounded-lg hover:from-blue-500 hover:to-purple-500
                     transform hover:scale-105 active:scale-95 transition-all duration-200
                     shadow-lg hover:shadow-xl text-base"
        >
          <Coins size={20} />
          <span>토큰 충전</span>
        </button>
        
        <button 
          onClick={onViewRewards}
          className="flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-amber-600 to-orange-600 
                     text-white font-bold rounded-lg hover:from-amber-500 hover:to-orange-500
                     transform hover:scale-105 active:scale-95 transition-all duration-200
                     shadow-lg hover:shadow-xl text-base"
        >
          <Gift size={20} />
          <span>보상 받기</span>
        </button>
      </div>
      
      {/* Secondary Actions - 400px 너비 활용 */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onViewHistory}
          className="flex items-center justify-center gap-2 h-12 bg-gray-700/50 
                     text-gray-300 font-medium rounded-lg hover:bg-gray-600/50 hover:text-white
                     transform hover:scale-105 active:scale-95 transition-all duration-200
                     border border-gray-600/30 text-base"
        >
          <Trophy size={18} />
          <span>전적 보기</span>
        </button>
        
        <button 
          onClick={onSettings}
          className="flex items-center justify-center gap-2 h-12 bg-gray-700/50 
                     text-gray-300 font-medium rounded-lg hover:bg-gray-600/50 hover:text-white
                     transform hover:scale-105 active:scale-95 transition-all duration-200
                     border border-gray-600/30 text-base"
        >
          <Settings size={18} />
          <span>설정</span>
        </button>
      </div>
    </div>
  );
}
