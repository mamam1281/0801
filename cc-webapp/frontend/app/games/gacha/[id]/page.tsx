"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Gift, Sparkles, TrendingUp, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import GlowCard from '@/components/ui/GlowCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import GachaSpinComponent from '@/components/games/GachaSpinComponent';
import GameResultModal from '@/components/games/GameResultModal';
import { useApi } from '@/hooks/useApi';

const gachaOptions = [
  { id: 1, pulls: 1, price: 1000, label: '1회 뽑기' },
  { id: 2, pulls: 10, price: 9000, label: '10회 뽑기', discount: '10% 할인' },
];

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-500',
};

export default async function GachaGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = useRouter();
  const [balance, setBalance] = useState(50000);
  const [selectedOption, setSelectedOption] = useState(gachaOptions[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showRates, setShowRates] = useState(false);
  
  const { post: spinGacha } = useApi();

  const handleSpin = async () => {
    if (isSpinning || balance < selectedOption.price) return;
    
    setIsSpinning(true);
    
    try {
      const result = await spinGacha('/api/games/gacha/spin', { 
        gacha_id: id,
        quantity: selectedOption.pulls 
      });
      
      setTimeout(() => {
        setIsSpinning(false);
        setBalance(result.balance);
        setLastResult(result);
        setShowResult(true);
      }, 3000);
    } catch (error) {
      setIsSpinning(false);
      console.error('Gacha error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,rgba(168,85,247,0.1),transparent)] opacity-50"
        />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <IconButton onClick={() => router.back()} className="bg-black/30 backdrop-blur-sm">
          <X className="w-6 h-6" />
        </IconButton>
        
        <h1 className="text-2xl font-bold text-white">럭키 박스</h1>
        
        <IconButton 
          onClick={() => setShowRates(!showRates)}
          className="bg-black/30 backdrop-blur-sm"
        >
          <Info className="w-6 h-6" />
        </IconButton>
      </header>
      
      {/* Balance & Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 mb-6"
      >
        <GlowCard glowColor="from-cyan-500 to-blue-500">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-cyan-400" />
                <span className="text-gray-300">보유 토큰</span>
              </div>
              <AnimatedNumber 
                value={balance} 
                className="text-2xl font-bold text-white"
                suffix=" 토큰"
              />
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>오늘 <span className="text-yellow-500 font-bold">2,341명</span>이 뽑았어요!</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-xs">+15%</span>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>
      
      {/* Gacha Machine */}
      <div className="relative z-10 px-4 mb-6">
        <GachaSpinComponent 
          isSpinning={isSpinning}
          result={lastResult}
          onComplete={() => {}}
        />
      </div>
      
      {/* Pull Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-4"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
          <h3 className="text-white font-bold mb-3 text-center">뽑기 옵션</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {gachaOptions.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedOption(option)}
                className={`relative p-4 rounded-xl transition-all ${
                  selectedOption.id === option.id
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="text-lg font-bold mb-1">{option.label}</div>
                <div className="text-xl">{option.price.toLocaleString()} 토큰</div>
                {option.discount && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {option.discount}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          
          <Button
            onClick={handleSpin}
            disabled={isSpinning || balance < selectedOption.price}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl py-4 shadow-xl"
            size="lg"
          >
            {isSpinning ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span>뽑는 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6" />
                <span>{selectedOption.label} ({selectedOption.price.toLocaleString()} 토큰)</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
      
      {/* Probability Rates Modal */}
      <AnimatePresence>
        {showRates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">확률 정보</h3>
              <div className="space-y-3">
                {Object.entries(rarityColors).map(([rarity, gradient]) => (
                  <div key={rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${gradient}`} />
                      <span className="text-white capitalize">{rarity}</span>
                    </div>
                    <span className="text-gray-400">
                      {rarity === 'legendary' ? '2%' : rarity === 'epic' ? '8%' : rarity === 'rare' ? '25%' : '65%'}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowRates(false)}
                className="w-full mt-6"
                variant="secondary"
              >
                닫기
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        result={lastResult}
        onPlayAgain={handleSpin}
      />
    </div>
  );
}