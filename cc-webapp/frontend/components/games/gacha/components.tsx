import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Crown } from 'lucide-react';
import { User } from '../../../types';
import { Button } from '../../ui/button';
import { GachaBanner, GachaItem, HeartParticle } from '../../../types/gacha';
import {
  generateSparkles,
  getAnimationDelay,
  getBannerStyle,
  generateHeartParticles,
} from './utils';
import { SEXY_EMOJIS, RARITY_COLORS } from './constants';

// 배너 선택 컴포넌트
export function SexyBannerSelector({
  banners,
  onSelectBanner,
  selectedBanner,
}: {
  banners: GachaBanner[];
  onSelectBanner: (banner: GachaBanner) => void;
  selectedBanner: GachaBanner;
}) {
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
            style={getBannerStyle(banner, isSelected)}
          >
            <div
              className={`absolute inset-0 ${RARITY_COLORS[(banner.guaranteedRarity as keyof typeof RARITY_COLORS) ? (banner.guaranteedRarity as keyof typeof RARITY_COLORS) : 'common']}40 opacity-20`}
            />

            {isSelected && (
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 animate-pulse" />
            )}

            {/* 배너 내용 */}
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-1">{banner.name}</h3>
              <p className="text-sm text-pink-100 mb-3">{banner.description}</p>
              <div className="flex items-center">
                <span className="text-yellow-300 font-bold">{banner.cost} G</span>
              </div>
            </div>

            {/* 반짝이 효과 */}
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.id}
                className="absolute text-white pointer-events-none"
                style={{
                  left: sparkle.left,
                  top: sparkle.top,
                  fontSize: `${sparkle.size}px`,
                  animationDelay: sparkle.animationDelay,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                {sparkle.emoji}
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}

// 아이템 카드 컴포넌트
export function SexyItemCard({
  item,
  isNew = false,
  animate = false,
  showDetails = false,
  onClick,
}: {
  item: GachaItem;
  isNew?: boolean;
  animate?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative rounded-lg p-4 bg-gradient-to-br ${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]}20 to-transparent border border-${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]}40 cursor-pointer overflow-hidden`}
    >
      {isNew && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-pink-500 text-xs text-white font-bold px-2 py-1 rounded-full animate-pulse">
            NEW
          </div>
        </div>
      )}

      <div className="flex items-center justify-center mb-3 h-16">
        <motion.div
          animate={
            animate
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }
              : {}
          }
          transition={{ duration: 0.8, repeat: animate ? Infinity : 0, repeatDelay: 1 }}
          className="text-4xl"
        >
          {item.icon}
        </motion.div>
      </div>

      <h3 className="text-center font-bold mb-1 text-white">{item.name}</h3>

      <p
        className={`text-xs text-center text-${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]}`}
      >
        {item.rarity.toUpperCase()} 등급
      </p>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
          className="mt-2 text-xs text-gray-300"
        >
          <p>{item.description}</p>
          <div className="mt-1 flex justify-between">
            <span>가치: {item.value} G</span>
            <div className="flex">
              {Array(item.sexiness || 1)
                .fill(0)
                .map((_, i) => (
                  <Heart key={i} size={10} className="text-pink-400" />
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// 결과 표시 컴포넌트
export function SexyResultOverlay({
  isVisible,
  item,
  onClose,
  onContinue,
  isTenPull = false,
  items = [],
}: {
  isVisible: boolean;
  item?: GachaItem;
  onClose?: () => void;
  onContinue?: () => void;
  isTenPull?: boolean;
  items?: GachaItem[];
}) {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  React.useEffect(() => {
    if (isVisible) {
      setHearts(generateHeartParticles());
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="relative bg-gradient-to-br from-pink-900/60 to-purple-900/60 rounded-2xl p-8 max-w-md w-full text-center"
      >
        {isTenPull ? (
          <>
            <h2 className="text-2xl font-bold text-pink-300 mb-6">10연 가챠 결과</h2>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.id}_${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: getAnimationDelay(index, 0.1) }}
                >
                  <SexyItemCard item={item} isNew={item.isNew} />
                </motion.div>
              ))}
            </div>
          </>
        ) : item ? (
          <>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="mb-4"
            >
              {item.rarity === 'legendary' && (
                <Crown className="mx-auto text-yellow-300 animate-pulse" size={40} />
              )}
            </motion.div>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="mb-6">
              <SexyItemCard item={item} animate isNew={item.isNew} showDetails />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xl font-bold text-${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]} mb-2`}
            >
              {item.rarity === 'common'
                ? '아이템 획득!'
                : item.rarity === 'rare'
                  ? '레어 아이템 획득!'
                  : item.rarity === 'epic'
                    ? '에픽 아이템 획득!'
                    : item.rarity === 'legendary'
                      ? '레전더리 아이템 획득!'
                      : '미식 아이템 획득!'}
            </motion.h2>
          </>
        ) : null}

        {/* 심장 파티클 */}
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ x: heart.x + '%', y: heart.y + '%', opacity: 0 }}
            animate={{
              y: [heart.y + '%', heart.y - 20 + '%'],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute text-pink-500"
          >
            ❤️
          </motion.div>
        ))}

        <div className="flex justify-center gap-3 mt-6">
          {onContinue && (
            <Button
              onClick={onContinue}
              variant="default"
              className="bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white"
            >
              계속 뽑기
            </Button>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="border-pink-500 text-pink-500 hover:bg-pink-500/20"
            >
              닫기
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// 이모지 반짝임 효과
export function SexyEmojis() {
  const sexyEmojis = SEXY_EMOJIS;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {sexyEmojis.map((emoji, index) => (
        <motion.div
          key={`emoji_${index}`}
          initial={{
            opacity: 0,
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            scale: 0.5,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: index * 0.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 5,
          }}
          className="absolute text-2xl"
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

// 배경 효과 컴포넌트 추가
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/30 to-indigo-900/20 z-0" />
      
      {/* 움직이는 배경 파티클 */}
      <div className="particles-container">
        {Array.from({ length: 15 }).map((_, index) => (
          <motion.div
            key={`particle_${index}`}
            className="absolute rounded-full bg-pink-500/20"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{
              x: [
                Math.random() * 100 + '%', 
                Math.random() * 100 + '%',
                Math.random() * 100 + '%'
              ],
              y: [
                Math.random() * 100 + '%',
                Math.random() * 100 + '%',
                Math.random() * 100 + '%'
              ],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: `${Math.random() * 150 + 50}px`,
              height: `${Math.random() * 150 + 50}px`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </div>
      
      {/* 섹시 이모지 효과도 함께 표시 */}
      <SexyEmojis />
    </div>
  );
}

// 가챠 결과 모달 컴포넌트
export function SexyPullResultsModal({
  results,
  showResults,
  currentIndex = 0,
  onNext,
  onClose,
  isAnimationComplete,
}: {
  results: GachaItem[];
  showResults: boolean;
  currentIndex?: number;
  onNext?: () => void;
  onClose?: () => void;
  isAnimationComplete?: boolean;
}) {
  const [localIndex, setLocalIndex] = useState(currentIndex);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  
  // props로 currentIndex가 전달되면 그것을 사용하고, 아니면 local state 사용
  const displayIndex = currentIndex !== undefined ? currentIndex : localIndex;
  
  // 하트 파티클 생성 효과
  const generateHearts = () => {
    setHeartParticles(generateHeartParticles(20));
    setTimeout(() => {
      setHeartParticles([]);
    }, 3000);
  };
  
  // 다음 아이템으로 넘기기
  const handleNext = () => {
    if (onNext) {
      // 부모 컴포넌트에서 제공한 onNext 함수 호출
      onNext();
      generateHearts();
    } else if (localIndex < results.length - 1) {
      // 내부 상태로 관리
      setLocalIndex(prev => prev + 1);
      generateHearts();
    } else if (onClose) {
      onClose();
    }
  };
  
  // 현재 표시할 아이템
  const currentItem = results[displayIndex];
  const isLastItem = displayIndex === results.length - 1;
  
  // 획득한 아이템의 레어도에 따른 스타일 설정
  const getBgClass = () => {
    if (!currentItem) return 'bg-gray-900';
    
    switch (currentItem.rarity) {
      case 'mythic': return 'bg-gradient-to-br from-gold via-gold/80 to-gold/50';
      case 'legendary': return 'bg-gradient-to-br from-purple-500 via-purple-400 to-purple-300';
      case 'epic': return 'bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300';
      case 'rare': return 'bg-gradient-to-br from-green-500 via-green-400 to-green-300';
      case 'common': return 'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-300';
      default: return 'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-300';
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl overflow-hidden glass-effect shadow-xl p-6">
        <div className={`absolute inset-0 opacity-20 ${getBgClass()}`}></div>
        
        {/* 현재 아이템 표시 */}
        <div className="relative z-10">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white">
              {results.length > 1 ? `아이템 획득! (${displayIndex + 1}/${results.length})` : '아이템 획득!'}
            </h3>
            <p className={`text-sm ${RARITY_COLORS[currentItem?.rarity || 'N']}`}>
              {currentItem?.rarity || 'N'} 등급
            </p>
          </div>
          
          <div className="flex justify-center mb-6">
            <SexyItemCard item={currentItem} isNew={true} animate={true} showDetails={true} />
          </div>
          
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-white mb-1">{currentItem?.name}</h4>
            <p className="text-sm text-gray-300">{currentItem?.description}</p>
          </div>
          
          <Button 
            onClick={handleNext} 
            className="w-full bg-gradient-game"
          >
            {isLastItem ? '닫기' : '다음'}
          </Button>
        </div>
        
        {/* 하트 파티클 효과 */}
        {heartParticles.map((particle, index) => (
          <motion.div
            key={`heart_${index}`}
            initial={{ 
              x: particle.x, 
              y: particle.y, 
              scale: 0,
              opacity: 0.8
            }}
            animate={{ 
              y: particle.y - 100,
              scale: particle.scale,
              opacity: 0
            }}
            transition={{ 
              duration: 2, 
              ease: "easeOut" 
            }}
            className="absolute pointer-events-none"
          >
            <Heart 
              size={particle.size} 
              className="text-primary/80"
              fill="currentColor"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
