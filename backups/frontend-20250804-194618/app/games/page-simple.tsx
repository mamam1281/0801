'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Gamepad2,
  Play,
  Star,
  Users,
  Coins,
  Heart,
  TrendingUp
} from 'lucide-react';

interface GameData {
  id: string;
  name: string;
  emoji: string;
  category: string;
  rtp: number;
  players: number;
  rating: number;
  isHot?: boolean;
  isNew?: boolean;
}

const SimpleGamesPage: React.FC = () => {
  const router = useRouter();

  // 간단한 게임 데이터
  const games: GameData[] = [
    {
      id: 'rps',
      name: '가위바위보',
      emoji: '🪨',
      category: '클래식',
      rtp: 98.5,
      players: 1247,
      rating: 4.8,
      isHot: true
    },
    {
      id: 'slots',
      name: '슬롯머신',
      emoji: '🎰',
      category: '슬롯',
      rtp: 96.2,
      players: 2156,
      rating: 4.6,
      isNew: true
    },
    {
      id: 'roulette',
      name: '룰렛',
      emoji: '🎯',
      category: '테이블',
      rtp: 97.3,
      players: 892,
      rating: 4.7
    },
    {
      id: 'gacha',
      name: '랜덤뽑기',
      emoji: '🎁',
      category: '특별',
      rtp: 94.8,
      players: 1683,
      rating: 4.5,
      isNew: true
    },
    {
      id: 'blackjack',
      name: '블랙잭',
      emoji: '🃏',
      category: '테이블',
      rtp: 99.2,
      players: 567,
      rating: 4.9
    },
    {
      id: 'poker',
      name: '포커',
      emoji: '♠️',
      category: '토너먼트',
      rtp: 96.5,
      players: 234,
      rating: 4.4
    }
  ];

  const handleGameClick = (gameId: string) => {
    console.log(`🎮 게임 클릭: ${gameId}`);
    router.push(`/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">🎮 게임 센터</h1>
                <p className="text-purple-200">재미있는 게임들을 즐겨보세요!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Coins className="w-5 h-5" />
                <span className="text-xl font-bold">12,750</span>
              </div>
              <p className="text-purple-200 text-sm">토큰</p>
            </div>
          </div>
        </motion.div>

        {/* 게임 그리드 */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => handleGameClick(game.id)}
            >
              {/* 게임 헤더 */}
              <div className="relative h-32 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <div className="text-6xl">{game.emoji}</div>
                
                {/* 배지 */}
                <div className="absolute top-3 left-3 flex flex-col space-y-1">
                  {game.isNew && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      ✨ NEW
                    </span>
                  )}
                  {game.isHot && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      🔥 HOT
                    </span>
                  )}
                </div>

                {/* 플레이 버튼 (호버 시) */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <motion.button
                    className="bg-white text-purple-600 p-3 rounded-full font-bold hover:scale-110 transition-transform"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* 게임 정보 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{game.name}</h3>
                  <button className="text-gray-400 hover:text-red-400 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-purple-200 text-sm mb-3">{game.category}</p>

                {/* 통계 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      평점
                    </span>
                    <span className="text-yellow-400 font-bold">{game.rating}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      플레이어
                    </span>
                    <span className="text-blue-400 font-bold">{game.players.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      RTP
                    </span>
                    <span className="text-green-400 font-bold">{game.rtp}%</span>
                  </div>
                </div>

                {/* 플레이 버튼 */}
                <button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameClick(game.id);
                  }}
                >
                  지금 플레이
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 하단 여백 (바텀 네비 공간) */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default SimpleGamesPage;
