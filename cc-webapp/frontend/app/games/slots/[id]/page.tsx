"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Coins, Zap, Volume2, VolumeX } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import GlowCard from '@/components/ui/GlowCard';
import SlotMachine from '@/components/games/SlotMachine';
import GameResultModal from '@/components/games/GameResultModal';
import { useApi } from '@/hooks/useApi';
// import { useSound } from '@/hooks/useSound';

const betAmounts = [100, 500, 1000, 5000, 10000];

export default async function SlotGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = useRouter();
  const [balance, setBalance] = useState(50000);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  
  // const { playSound } = useSound();
  const { post: spinSlot } = useApi();

  const handleSpin = async () => {
    if (isSpinning || balance < betAmount) return;
    
    setIsSpinning(true);
    // if (soundEnabled) playSound('spin');
    
    try {
      const result = await spinSlot('/api/games/slot/spin', { bet_amount: betAmount });
      
      setTimeout(() => {
        setIsSpinning(false);
        setBalance(result.balance);
        setLastResult(result);
        setShowResult(true);
        
        if (result.reward > 0 && soundEnabled) {
          // playSound('win');
        }
      }, 3000);
    } catch (error) {
      setIsSpinning(false);
      console.error('Spin error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/patterns/casino-pattern.png')] opacity-10" />
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10"
        />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <IconButton onClick={() => router.back()} className="bg-black/30 backdrop-blur-sm">
          <X className="w-6 h-6" />
        </IconButton>
        
        <h1 className="text-2xl font-bold text-white">럭키 슬롯</h1>
        
        <IconButton 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="bg-black/30 backdrop-blur-sm"
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </IconButton>
      </header>
      
      {/* Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 mb-8"
      >
        <GlowCard glowColor="from-yellow-500 to-orange-500">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-gray-300">보유 토큰</span>
            </div>
            <AnimatedNumber 
              value={balance} 
              className="text-2xl font-bold text-white"
              suffix=" 토큰"
            />
          </div>
        </GlowCard>
      </motion.div>
      
      {/* Slot Machine */}
      <div className="relative z-10 px-4 mb-8">
        <SlotMachine 
          isSpinning={isSpinning}
          result={lastResult}
          onComplete={() => {}}
        />
      </div>
      
      {/* Betting Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-4"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
          <h3 className="text-white font-bold mb-3 text-center">베팅 금액</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {betAmounts.map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBetAmount(amount)}
                className={`py-2 rounded-lg font-bold transition-all ${
                  betAmount === amount
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {amount.toLocaleString()}
              </motion.button>
            ))}
          </div>
          
          <Button
            onClick={handleSpin}
            disabled={isSpinning || balance < betAmount}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-xl py-4 shadow-xl"
            size="lg"
          >
            {isSpinning ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span>돌리는 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" />
                <span>스핀! ({betAmount.toLocaleString()} 토큰)</span>
              </div>
            )}
          </Button>
          
          {balance < betAmount && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-center mt-2 text-sm"
            >
              토큰이 부족합니다! 💸
            </motion.p>
          )}
        </div>
      </motion.div>
      
      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        result={lastResult}
        onPlayAgain={handleSpin}
        onGoToGames={() => router.push('/games')}
      />
    </div>
  );
}