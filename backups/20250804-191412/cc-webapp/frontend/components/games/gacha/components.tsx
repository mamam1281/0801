import React from 'react';
import { motion } from 'framer-motion';
import { Package, Star, Crown, Heart, Sparkles } from 'lucide-react';
import { Button } from '../../ui/button';
import { GachaItem, GachaBanner, RARITY_COLORS, SEXY_EMOJIS } from './constants';
import { getBannerStyle, generateSparkles, getAnimationDelay } from './utils';
import { User } from '../../../App';

interface SexyBannerSelectorProps {
  banners: GachaBanner[];
  selectedBanner: GachaBanner;
  onSelectBanner: (banner: GachaBanner) => void;
  isPulling: boolean;
}

export function SexyBannerSelector({ banners, selectedBanner, onSelectBanner, isPulling }: SexyBannerSelectorProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {banners.map((banner, index) => {
        const sparkles = generateSparkles();
        const isSelected = selectedBanner.id === banner.id;
        
        return (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: getAnimationDelay(index, 0.3) }}
            whileHover={{ scale: 1.02, rotateY: 5 }}
            onClick={() => onSelectBanner(banner)}
            className="relative rounded-xl p-6 cursor-pointer transition-all overflow-hidden"
            style={{
              ...getBannerStyle(banner, isSelected),
              boxShadow: isSelected ? RARITY_COLORS.legendary.glow : 'none'
            }}
          >
            {/* Sparkle Effects */}
            <div className="absolute inset-0">
              {sparkles.map((sparkle) => (
                <motion.div
                  key={sparkle.id}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: sparkle.delay
                  }}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: sparkle.top,
                    left: sparkle.left
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                {banner.name}
              </h3>
              <p className="text-sm text-white/80 mb-4 drop-shadow">
                {banner.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-bold text-yellow-300 drop-shadow">
                  {banner.cost}G
                </span>
                {banner.guaranteedRarity && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/30 text-yellow-300 border border-yellow-400/50">
                    {banner.guaranteedRarity.toUpperCase()} 확정
                  </span>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-white drop-shadow-lg mb-2">
                  {banner.theme}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {banner.featuredItems.slice(0, 3).map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-center"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                    >
                      <div className="text-2xl mb-1 drop-shadow-lg">{item.icon}</div>
                      <div className="text-xs text-white/80 drop-shadow truncate">
                        {item.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface SexyPullResultsModalProps {
  results: GachaItem[];
  showResults: boolean;
  currentIndex: number;
  onNext: () => void;
  onClose: () => void;
}

export function SexyPullResultsModal({ results, showResults, currentIndex, onNext, onClose }: SexyPullResultsModalProps) {
  if (!showResults || results.length === 0) return null;

  const item = results[currentIndex];
  const isLastItem = currentIndex === results.length - 1;
  const rarityStyle = RARITY_COLORS[item.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.3, opacity: 0, y: 100 }}
        className={`glass-effect rounded-3xl p-12 max-w-lg w-full text-center border-4 relative overflow-hidden ${rarityStyle.border}`}
        style={{
          background: `linear-gradient(135deg, ${rarityStyle.bg.split(' ')[1]}, ${rarityStyle.bg.split(' ')[3]})`,
          boxShadow: rarityStyle.glow
        }}
      >
        {/* Rarity Effect */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        
        {/* New Item Badge */}
        {item.isNew && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold"
          >
            💋 NEW!
          </motion.div>
        )}
        
        {/* Item Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-8xl mb-6 relative z-10"
        >
          {item.icon}
        </motion.div>
        
        {/* Sexiness Stars */}
        {item.sexiness && (
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: item.sexiness }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
              >
                <Heart className={`w-6 h-6 ${rarityStyle.text} fill-current`} />
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Item Details */}
        <h3 className={`text-3xl font-black mb-2 relative z-10 ${rarityStyle.text}`}>
          {item.name}
        </h3>
        
        <p className="text-white/80 mb-4 relative z-10">
          {item.description}
        </p>
        
        <div className="text-yellow-300 font-bold text-lg mb-6 relative z-10">
          가치: {item.value?.toLocaleString()}G
        </div>
        
        {/* Sexiness Level */}
        {item.sexiness && (
          <div className="mb-6 relative z-10">
            <div className="text-pink-300 text-sm mb-2">💕 SEXINESS LEVEL 💕</div>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <motion.div
                  key={level}
                  animate={level <= item.sexiness! ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  } : {}}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: level * 0.1
                  }}
                  className={`text-xl ${level <= item.sexiness! ? '' : 'opacity-30'}`}
                >
                  💖
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Navigation */}
        {results.length > 1 && (
          <div className="text-sm text-white/60 mb-4 relative z-10">
            {currentIndex + 1} / {results.length}
          </div>
        )}
        
        <Button
          onClick={isLastItem ? onClose : onNext}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-bold py-3 px-8 relative z-10"
        >
          {isLastItem ? '완료' : '다음'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

interface SexyInventoryModalProps {
  user: User;
  showInventory: boolean;
  onClose: () => void;
}

export function SexyInventoryModal({ user, showInventory, onClose }: SexyInventoryModalProps) {
  if (!showInventory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-effect rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
            <Crown className="w-6 h-6 text-pink-400" />
            💋 섹시 컬렉션 💋
          </h3>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-pink-500/50 hover:border-pink-400 text-pink-300"
          >
            닫기
          </Button>
        </div>
        
        {user.inventory.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.inventory.map((item, index) => {
              const rarityStyle = RARITY_COLORS[item.rarity];
              const gachaItem = item as GachaItem;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: getAnimationDelay(index, 0.05) }}
                  className={`glass-effect rounded-xl p-4 border-2 ${rarityStyle.border} relative overflow-hidden`}
                  style={{ boxShadow: rarityStyle.glow }}
                >
                  {/* Ambient sparkles */}
                  <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          opacity: [0, 0.7, 0],
                          scale: [0, 1, 0],
                          rotate: 360
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          delay: i * 1.3
                        }}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          top: `${20 + (i * 25)}%`,
                          left: `${15 + (i * 30)}%`
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-center relative z-10">
                    <motion.div 
                      className="text-3xl mb-2"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                    >
                      {item.icon}
                    </motion.div>
                    <div className={`font-bold ${rarityStyle.text} drop-shadow`}>
                      {item.name}
                    </div>
                    <div className="text-sm text-white/70 mb-2 drop-shadow">
                      {item.description}
                    </div>
                    
                    {/* Sexiness Level for Gacha Items */}
                    {gachaItem.sexiness && (
                      <div className="mb-2">
                        <div className="text-xs text-pink-300 mb-1">섹시도</div>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <span 
                              key={level}
                              className={`text-xs ${level <= gachaItem.sexiness! ? 'text-pink-400' : 'text-gray-600'}`}
                            >
                              💖
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-yellow-400 font-bold">
                      수량: {item.quantity}
                    </div>
                    {item.value && (
                      <div className="text-xs text-gray-400">
                        가치: {item.value.toLocaleString()}G
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-pink-300/60 py-12">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-4"
            >
              💋
            </motion.div>
            <p className="text-lg mb-2">아직 섹시한 아이템이 없네요...</p>
            <p>가챠를 돌려서 첫 아이템을 획득해보세요! ✨</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface BackgroundEffectsProps {
  sexyEmojis?: string[];
}

export function BackgroundEffects({ sexyEmojis = SEXY_EMOJIS }: BackgroundEffectsProps) {
  return (
    <div className="absolute inset-0 opacity-10">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 4 + (i * 0.5),
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute text-6xl"
          style={{
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 80}%`,
          }}
        >
          {sexyEmojis[i % sexyEmojis.length]}
        </motion.div>
      ))}
    </div>
  );
}