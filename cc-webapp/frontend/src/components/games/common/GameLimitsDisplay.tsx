import React, { useState, useEffect } from 'react';

interface GameLimit {
  max: number;
  remaining: number;
  used: number;
}

interface GameLimitsResponse {
  user_id: string;
  daily_limits: {
    [gameType: string]: GameLimit;
  };
  vip_status: boolean;
  reset_time: string;
}

interface GameLimitsDisplayProps {
  userId: string;
  onLoaded?: (limits: GameLimitsResponse) => void;
}

const GameLimitsDisplay: React.FC<GameLimitsDisplayProps> = ({ userId, onLoaded }) => {
  const [limits, setLimits] = useState<GameLimitsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/game-limits?user_id=${userId}`);

        if (!response.ok) {
          throw new Error(`Error fetching game limits: ${response.status}`);
        }

        const data: GameLimitsResponse = await response.json();
        setLimits(data);

        if (onLoaded) {
          onLoaded(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Failed to fetch game limits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [userId, onLoaded]);

  if (loading) {
    return (
      <div className="p-3 bg-gray-800 rounded-lg animate-pulse">게임 제한 정보 로딩 중...</div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
        <p className="text-red-400 text-sm">게임 제한 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (!limits) {
    return null;
  }

  // Format reset time
  const resetTime = new Date(limits.reset_time);
  const formattedResetTime = resetTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const gameTypeLabels: Record<string, string> = {
    slot: '슬롯 머신',
    crash: '크래시 게임',
    rps: '가위바위보',
    gacha: '가챠 시스템',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-medium text-white flex items-center justify-between">
        일일 게임 제한
        {limits.vip_status && (
          <span className="text-xs font-bold px-2 py-1 bg-yellow-500 text-black rounded-full">
            VIP
          </span>
        )}
      </h3>

      <div className="space-y-2">
        {Object.entries(limits.daily_limits).map(([gameType, limit]) => (
          <div key={gameType} className="flex items-center justify-between">
            <span className="text-gray-300">{gameTypeLabels[gameType] || gameType}</span>
            <div className="flex items-center">
              <div className="w-24 h-2 bg-gray-700 rounded-full mr-2">
                <div
                  className={`h-full rounded-full ${limit.remaining > 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                  style={{ width: `${(limit.remaining / limit.max) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-400">
                {limit.remaining}/{limit.max}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-2">다음 리셋: 오늘 {formattedResetTime}</div>
    </div>
  );
};

export default GameLimitsDisplay;
