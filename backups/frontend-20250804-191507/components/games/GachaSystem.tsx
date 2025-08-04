'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Coins, 
  RefreshCw,
  Package,
  Heart,
  Crown
} from 'lucide-react';
import { User } from '../../App';
import { Button } from '../ui/button';
import { GACHA_BANNERS, ANIMATION_DURATIONS } from './gacha/constants';
import { 
  generateParticles,
  generateHeartParticles,
  getRandomItem,
  updateUserInventory,
  getRarityMessage,
  getTenPullMessage,
  Particle,
  HeartParticle
} from './gacha/utils';
import {
  SexyBannerSelector,
  SexyPullResultsModal,
  SexyInventoryModal,
  BackgroundEffects
} from './gacha/components';
import type { GachaItem, GachaBanner } from './gacha/constants';

interface GachaSystemProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

export function GachaSystem({ user, onBack, onUpdateUser, onAddNotification }: GachaSystemProps) {
  const [selectedBanner, setSelectedBanner] = useState<GachaBanner>(GACHA_BANNERS[0]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResults, setPullResults] = useState<GachaItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentPullIndex, setCurrentPullIndex] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [pullAnimation, setPullAnimation] = useState<'opening' | 'revealing' | null>(null);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);

  // Clear particles after animation
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => setParticles([]), ANIMATION_DURATIONS.particle);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  // Generate heart particles for ambient effect
  useEffect(() => {
    const generateHearts = () => {
      const newHearts = generateHeartParticles();
      setHeartParticles(prev => [...prev.slice(-10), ...newHearts]);
    };

    const interval = setInterval(generateHearts, 3000);
    return () => clearInterval(interval);
  }, []);

  // Perform single pull
  const performSinglePull = async () => {
    if (user.goldBalance < selectedBanner.cost) {
      onAddNotification('❌ 골드가 부족합니다!');
      return;
    }

    setIsPulling(true);
    setPullAnimation('opening');
    
    // Deduct cost and update stats
    let updatedUser = {
      ...user,
      goldBalance: user.goldBalance - selectedBanner.cost,
      gameStats: {
        ...user.gameStats,
        gacha: {
          ...user.gameStats.gacha,
          pulls: user.gameStats.gacha.pulls + 1,
          totalSpent: user.gameStats.gacha.totalSpent + selectedBanner.cost
        }
      }
    };

    // Opening animation with sexy vibes
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.opening));
    setPullAnimation('revealing');
    
    // Get item
    const item = getRandomItem(selectedBanner, updatedUser);
    const newParticles = generateParticles(item.rarity);
    setParticles(newParticles);
    
    // Update inventory and stats
    updatedUser = updateUserInventory(updatedUser, item);
    
    // Update epic/legendary counts
    if (item.rarity === 'epic') {
      updatedUser.gameStats.gacha.epicCount += 1;
    } else if (item.rarity === 'legendary' || item.rarity === 'mythic') {
      updatedUser.gameStats.gacha.legendaryCount += 1;
    }

    setPullResults([item]);
    setCurrentPullIndex(0);
    setShowResults(true);
    
    onUpdateUser(updatedUser);
    onAddNotification(getRarityMessage(item));
    
    setIsPulling(false);
    setPullAnimation(null);
  };

  // Perform 10-pull
  const performTenPull = async () => {
    const totalCost = selectedBanner.cost * 10 * 0.9; // 10% discount
    
    if (user.goldBalance < totalCost) {
      onAddNotification('❌ 골드가 부족합니다!');
      return;
    }

    setIsPulling(true);
    setPullAnimation('opening');
    
    // Opening animation
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.opening + 500));
    setPullAnimation('revealing');
    
    const items: GachaItem[] = [];
    let updatedUser = {
      ...user,
      goldBalance: user.goldBalance - totalCost,
      gameStats: {
        ...user.gameStats,
        gacha: {
          ...user.gameStats.gacha,
          pulls: user.gameStats.gacha.pulls + 10,
          totalSpent: user.gameStats.gacha.totalSpent + totalCost
        }
      }
    };

    // Pull 10 items
    for (let i = 0; i < 10; i++) {
      const item = getRandomItem(selectedBanner, updatedUser);
      items.push(item);
      
      // Update inventory
      updatedUser = updateUserInventory(updatedUser, item);

      // Update stats
      if (item.rarity === 'epic') {
        updatedUser.gameStats.gacha.epicCount += 1;
      } else if (item.rarity === 'legendary' || item.rarity === 'mythic') {
        updatedUser.gameStats.gacha.legendaryCount += 1;
      }
    }

    // Generate particles for best item
    const bestItem = items.reduce((best, current) => {
      const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
      return rarityOrder[current.rarity as keyof typeof rarityOrder] > rarityOrder[best.rarity as keyof typeof rarityOrder] ? current : best;
    });
    const newParticles = generateParticles(bestItem.rarity);
    setParticles(newParticles);

    setPullResults(items);
    setCurrentPullIndex(0);
    setShowResults(true);
    
    onUpdateUser(updatedUser);
    onAddNotification(getTenPullMessage(items));
    
    setIsPulling(false);
    setPullAnimation(null);
  };

  // Navigate to next result
  const handleNextResult = () => {
    if (currentPullIndex < pullResults.length - 1) {
      setCurrentPullIndex(prev => prev + 1);
    }
  };

  // Close results modal
  const handleCloseResults = () => {
    setShowResults(false);
    setPullResults([]);
    setCurrentPullIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-pink-900/20 to-purple-900/30 relative overflow-hidden">
      {/* Floating Heart Particles */}
      <AnimatePresence>
        {heartParticles.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              opacity: 0,
              scale: 0,
              x: `${heart.x}vw`,
              y: `${heart.y}vh`
            }}
            animate={{ 
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              y: `${heart.y - 50}vh`,
              rotate: [0, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.heartFloat, ease: "easeOut" }}
            className="fixed text-pink-400 text-2xl pointer-events-none z-20"
          >
            💖
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Particle Effects */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 0,
              scale: 0,
              x: `${particle.x}vw`,
              y: `${particle.y}vh`
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: `${particle.y - 30}vh`,
              rotate: 360
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.particle, ease: "easeOut" }}
            className="fixed rounded-full pointer-events-none z-30"
            style={{ 
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size
            }}
          />
        ))}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-pink-500/30 backdrop-blur-sm bg-black/20"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-pink-500/50 hover:border-pink-400 text-pink-300 hover:text-pink-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <div>
              <motion.h1 
                animate={{ 
                  textShadow: [
                    '0 0 20px rgba(236, 72, 153, 0.5)',
                    '0 0 30px rgba(236, 72, 153, 0.8)',
                    '0 0 20px rgba(236, 72, 153, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl lg:text-2xl font-black text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text"
              >
                가챠
              </motion.h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowInventory(true)}
              className="border-pink-500/50 hover:border-pink-400 text-pink-300 hover:text-pink-200"
            >
              <Package className="w-4 h-4 mr-2" />
              컬렉션
            </Button>
            
            <div className="text-right">
              <div className="text-sm text-pink-300/60">보유 골드</div>
              <div className="text-xl font-bold text-yellow-400">
                {user.goldBalance.toLocaleString()}G
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 max-w-6xl mx-auto">
        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="glass-effect rounded-xl p-4 text-center bg-pink-900/20 border-pink-500/30">
            <div className="text-xl font-bold text-pink-300">
              {user.gameStats.gacha.pulls}
            </div>
            <div className="text-sm text-pink-400/60">총 뽑기</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center bg-purple-900/20 border-purple-500/30">
            <div className="text-xl font-bold text-purple-300">
              {user.gameStats.gacha.epicCount}
            </div>
            <div className="text-sm text-purple-400/60">에픽 획득</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center bg-yellow-900/20 border-yellow-500/30">
            <div className="text-xl font-bold text-yellow-300">
              {user.gameStats.gacha.legendaryCount}
            </div>
            <div className="text-sm text-yellow-400/60">레전더리+</div>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center bg-red-900/20 border-red-500/30">
            <div className="text-xl font-bold text-red-300">
              {user.gameStats.gacha.totalSpent.toLocaleString()}G
            </div>
            <div className="text-sm text-red-400/60">총 소모</div>
          </div>
        </motion.div>

        {/* Banner Selection */}
        <SexyBannerSelector
          banners={GACHA_BANNERS}
          selectedBanner={selectedBanner}
          onSelectBanner={setSelectedBanner}
          isPulling={isPulling}
        />

        {/* Gacha Machine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-3xl p-8 mb-6 relative overflow-hidden bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30"
        >
          {/* Machine Animation Overlay */}
          <AnimatePresence>
            {pullAnimation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 rounded-3xl"
              >
                <motion.div
                  animate={pullAnimation === 'opening' ? { 
                    scale: [1, 1.5, 1],
                    rotate: [0, 360],
                    filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                  } : {
                    scale: [1, 2, 1],
                    opacity: [0.5, 1, 0.5],
                    textShadow: [
                      '0 0 20px rgba(236, 72, 153, 0.5)',
                      '0 0 40px rgba(236, 72, 153, 1)',
                      '0 0 20px rgba(236, 72, 153, 0.5)'
                    ]
                  }}
                  transition={{ duration: pullAnimation === 'opening' ? 2 : 1, repeat: Infinity }}
                  className="text-8xl"
                >
                  {pullAnimation === 'opening' ? '🎁' : '✨'}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sexy Background Elements */}
          <BackgroundEffects />

          <div className="text-center relative z-10">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
                textShadow: [
                  '0 0 20px rgba(236, 72, 153, 0.5)',
                  '0 0 30px rgba(236, 72, 153, 0.8)',
                  '0 0 20px rgba(236, 72, 153, 0.5)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🎰
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-black text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text mb-4"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {selectedBanner.name}
            </motion.h2>
            
            <p className="text-pink-300/80 mb-8 text-lg">
              {selectedBanner.description}
            </p>

            {/* Pull Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-lg mx-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={performSinglePull}
                  disabled={isPulling || user.goldBalance < selectedBanner.cost}
                  className="w-full h-20 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold text-lg relative overflow-hidden border-0"
                  style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                      뽑는 중...
                    </>
                  ) : (
                    <>
                      <Heart className="w-6 h-6 mr-2" />
                      <div className="flex flex-col">
                        <span>섹시 단발 뽑기</span>
                        <span className="text-sm opacity-80">
                          {selectedBanner.cost}G
                        </span>
                      </div>
                    </>
                  )}
                  
                  <motion.div
                    animate={{ 
                      x: ['100%', '-100%'],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={performTenPull}
                  disabled={isPulling || user.goldBalance < selectedBanner.cost * 10 * 0.9}
                  className="w-full h-20 bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-400 hover:to-red-400 text-white font-bold text-lg relative overflow-hidden border-0"
                  style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' }}
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                      뽑는 중...
                    </>
                  ) : (
                    <>
                      <Crown className="w-6 h-6 mr-2" />
                      <div className="flex flex-col">
                        <span>글래머 10연 뽑기</span>
                        <span className="text-sm opacity-80">
                          {Math.floor(selectedBanner.cost * 10 * 0.9)}G (10% 할인!)
                        </span>
                      </div>
                    </>
                  )}
                  
                  <motion.div
                    animate={{ 
                      x: ['100%', '-100%'],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </Button>
              </motion.div>
            </div>

            {/* 🔧 Sexiness Level Display - 고유 키 사용 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-4 bg-black/30 rounded-xl border border-pink-500/30"
            >
              <div className="text-pink-300 text-sm mb-2">💕 SEXINESS LEVEL 💕</div>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div
                    key={`sexiness-level-${level}-${Date.now()}`}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      delay: level * 0.1
                    }}
                    className="text-2xl"
                  >
                    💖
                  </motion.div>
                ))}
              </div>
              <div className="text-xs text-pink-400/60 mt-1">
                더 섹시할수록 더 레어한 아이템!
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        <SexyPullResultsModal
          results={pullResults}
          showResults={showResults}
          currentIndex={currentPullIndex}
          onNext={handleNextResult}
          onClose={handleCloseResults}
        />
        
        <SexyInventoryModal
          user={user}
          showInventory={showInventory}
          onClose={() => setShowInventory(false)}
        />
      </AnimatePresence>
    </div>
  );
}