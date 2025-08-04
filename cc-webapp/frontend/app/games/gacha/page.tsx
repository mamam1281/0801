'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import GlowCard from '@/components/ui/GlowCard';

export default function GachaListPage() {
  const router = useRouter();
  
  const gachaGames = [
    {
      id: 'premium',
      title: '프리미엄 가챠',
      description: '최고급 아이템을 획득할 수 있는 가챠',
      cost: 1000,
      image: '/images/gacha-premium.jpg',
      rarity: 'legendary'
    },
    {
      id: 'standard',
      title: '스탠다드 가챠',
      description: '일반적인 아이템을 획득할 수 있는 가챠',
      cost: 100,
      image: '/images/gacha-standard.jpg',
      rarity: 'epic'
    },
    {
      id: 'daily',
      title: '데일리 가챠',
      description: '매일 한 번 무료로 플레이 가능',
      cost: 0,
      image: '/images/gacha-daily.jpg',
      rarity: 'rare'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </button>
          
          <div className="flex items-center gap-2 text-yellow-400">
            <Coins className="w-5 h-5" />
            <span className="font-bold">125,000</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            가챠 게임
          </h1>
          <p className="text-gray-400">운을 시험해보세요!</p>
        </div>

        {/* Gacha Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gachaGames.map((gacha) => (
            <motion.div
              key={gacha.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlowCard className="cursor-pointer">
                <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">🎰</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{gacha.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{gacha.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">
                      {gacha.cost === 0 ? 'FREE' : gacha.cost.toLocaleString()}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => router.push(`/games/gacha/${gacha.id}`)}
                    size="sm"
                  >
                    플레이
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
