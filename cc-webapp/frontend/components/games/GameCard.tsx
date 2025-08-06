'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { GameDashboardGame } from '../../types';
import { getDifficultyColor } from '../../utils/gameUtils';

interface GameCardProps {
  game: GameDashboardGame;
  index: number;
  userGoldBalance: number;
  onGameClick: (gameId: string) => void;
}

export function GameCard({ game, index, userGoldBalance, onGameClick }: GameCardProps) {
  const canAfford = userGoldBalance >= game.cost;
  
  // 안전한 값 처리
  const bestScore = game.bestScore || 0;
  const playCount = game.playCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className={`glass-metal rounded-2xl p-6 relative overflow-hidden glass-metal-hover ${
        game.trending ? 'border-2 border-primary metal-pulse' : ''
      }`}
    >
      {/* 🎯 배지 영역 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {game.trending && (
          <div className="bg-gradient-to-r from-error to-primary text-white text-xs px-3 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-1">
            🔥 HOT
          </div>
        )}
        <div className={`${getDifficultyColor(game.difficulty)} bg-secondary/80 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm`}>
          {game.difficulty}
        </div>
      </div>

      {/* 🎮 게임 정보 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 bg-gradient-to-r ${game.color} rounded-xl flex items-center justify-center glass-metal metal-shine`}>
          <game.icon className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gradient-primary mb-2">{game.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
        </div>
      </div>

      {/* 💎 핵심 정보 1개 - 최고 기록 */}
      <div className="glass-metal bg-secondary/30 rounded-xl p-4 mb-6 text-center">
        <div className="text-2xl font-black text-gradient-gold mb-1">
          {bestScore.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          최고 기록 ({playCount}회 플레이)
        </div>
      </div>

      {/* 🎯 실행 버튼 */}
      <Button
        onClick={() => onGameClick(game.id)}
        disabled={!canAfford}
        className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white font-bold py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift glass-metal-hover rounded-xl border-0 metal-shine`}
      >
        <Play className="w-6 h-6" />
        {!canAfford ? (
          <span className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            골드 부족 ({game.cost}G 필요)
          </span>
        ) : (
          <span className="flex items-center gap-2">
            지금 플레이
            <div className="flex items-center gap-1 text-sm opacity-80">
              <Coins className="w-4 h-4" />
              -{game.cost}G
            </div>
          </span>
        )}
      </Button>
    </motion.div>
  );
}