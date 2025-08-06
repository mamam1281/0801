import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Crown, X, Package, Gift } from 'lucide-react';
import { User } from '../../../types';
import { Button } from '../../ui/button';
import { GachaBanner, GachaItem, HeartParticle } from '../../../types/gacha';
import {
  generateSparkles,
  getAnimationDelay,
  getBannerStyle,
  generateHeartParticles,
  generateParticles,
  Particle,
} from './utils';
import { SEXY_EMOJIS, RARITY_COLORS, ANIMATION_DURATIONS } from './constants';

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
  // key prop은 React에서 내부적으로 처리되므로 여기서는 무시됨
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
  const [hearts, setHearts] = useState([] as HeartParticle[]);

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
        {hearts.map((heart: HeartParticle) => (
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

// 배경 효과 컴포넌트
export function BackgroundEffects({ particles }: { particles: Particle[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-800/20 to-purple-900/30" />

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left || particle.x || '0%',
            top: particle.top || particle.y || '0%',
          }}
          animate={{
            y: [particle.top ? parseInt(particle.top as string) : 0, window.innerHeight + 100],
            opacity: [1, 0],
          }}
          transition={{
            duration: particle.duration,
            ease: 'linear',
          }}
        />
      ))}

      <SexyEmojis />
    </div>
  );
}

// 뽑기 결과 모달 컴포넌트
export function SexyPullResultsModal({
  isOpen,
  onClose,
  onContinue,
  item,
  items = [],
  isTenPull = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  item?: GachaItem;
  items?: GachaItem[];
  isTenPull?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="bg-gradient-to-br from-pink-900/80 to-purple-900/80 rounded-xl border border-pink-500/30 p-6 max-w-lg w-full relative"
          >
            <Button
              variant="ghost"
              className="absolute right-2 top-2 text-pink-300 hover:text-pink-100 hover:bg-pink-800/30"
              onClick={onClose}
            >
              <X size={20} />
            </Button>

            <h2 className="text-2xl font-bold text-center text-pink-300 mb-6">
              {isTenPull ? '10연속 뽑기 결과' : '뽑기 결과'}
            </h2>

            {!isTenPull && item ? (
              <div className="flex flex-col items-center">
                <SexyItemCard item={item} animate showDetails isNew={item.isNew} />
                <p className="mt-4 text-center text-pink-200">
                  {item.rarity === 'legendary'
                    ? '축하합니다! 최고 레어도 아이템을 획득했습니다!'
                    : item.rarity === 'epic'
                      ? '멋져요! 에픽 아이템을 획득했습니다!'
                      : '새로운 아이템을 획득했습니다!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}_${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SexyItemCard item={item} isNew={item.isNew} />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={onContinue}
                className="bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white"
              >
                계속 뽑기
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-pink-400 text-pink-400 hover:bg-pink-500/20"
              >
                닫기
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 인벤토리 모달 컴포넌트
export function SexyInventoryModal({
  isOpen,
  onClose,
  inventory,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  inventory: GachaItem[];
  user: User;
}) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = inventory.filter((item) => {
    // 검색어로 필터링
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 희귀도로 필터링
    if (activeFilter !== 'all' && item.rarity !== activeFilter) {
      return false;
    }

    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="bg-gradient-to-br from-pink-900/80 to-purple-900/80 rounded-xl border border-pink-500/30 p-6 max-w-3xl w-full relative"
          >
            <Button
              variant="ghost"
              className="absolute right-2 top-2 text-pink-300 hover:text-pink-100 hover:bg-pink-800/30"
              onClick={onClose}
            >
              <X size={20} />
            </Button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-pink-300">내 컬렉션</h2>
                <p className="text-pink-200/80 text-sm">수집한 아이템: {inventory.length}개</p>
              </div>
              <div className="flex items-center gap-3">
                <Package className="text-pink-300" size={20} />
                <span className="text-lg font-bold text-pink-300">
                  {user.inventory?.length || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                className={
                  activeFilter === 'all'
                    ? 'bg-pink-700 hover:bg-pink-800'
                    : 'border-pink-500 text-pink-500'
                }
                onClick={() => setActiveFilter('all')}
              >
                전체
              </Button>
              <Button
                variant={activeFilter === 'legendary' ? 'default' : 'outline'}
                className={
                  activeFilter === 'legendary'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'border-yellow-500 text-yellow-500'
                }
                onClick={() => setActiveFilter('legendary')}
              >
                레전더리
              </Button>
              <Button
                variant={activeFilter === 'epic' ? 'default' : 'outline'}
                className={
                  activeFilter === 'epic'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'border-purple-500 text-purple-500'
                }
                onClick={() => setActiveFilter('epic')}
              >
                에픽
              </Button>
              <Button
                variant={activeFilter === 'rare' ? 'default' : 'outline'}
                className={
                  activeFilter === 'rare'
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : 'border-blue-500 text-blue-500'
                }
                onClick={() => setActiveFilter('rare')}
              >
                레어
              </Button>
              <Button
                variant={activeFilter === 'common' ? 'default' : 'outline'}
                className={
                  activeFilter === 'common'
                    ? 'bg-gray-700 hover:bg-gray-800'
                    : 'border-gray-500 text-gray-500'
                }
                onClick={() => setActiveFilter('common')}
              >
                일반
              </Button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="아이템 검색..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-pink-900/50 border border-pink-500/30 text-white placeholder-pink-300/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto pr-2">
                {filteredItems.map((item) => (
                  <SexyItemCard key={item.id} item={item} showDetails />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <Gift className="text-pink-500/50 mb-4" size={40} />
                <p className="text-pink-300/70 text-center">아이템이 없습니다</p>
                <p className="text-pink-300/50 text-sm text-center">
                  가챠에서 아이템을 획득해보세요!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
