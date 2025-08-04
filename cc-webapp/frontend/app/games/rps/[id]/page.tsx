"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Coins, Trophy, Target } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import GlowCard from '@/components/ui/GlowCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import GameResultModal from '@/components/games/GameResultModal';
import { useApi } from '@/hooks/useApi';

const choices = [
  { id: 'rock', label: '바위', emoji: '✊', beats: 'scissors' },
  { id: 'paper', label: '보', emoji: '✋', beats: 'rock' },
  { id: 'scissors', label: '가위', emoji: '✌️', beats: 'paper' },
];

const betAmounts = [100, 500, 1000, 2500, 5000];

export default async function RPSGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = useRouter();
  const [balance, setBalance] = useState(50000);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  
  const { post: playRPS } = useApi();

  const handlePlay = async () => {
    if (!selectedChoice || isPlaying || balance < betAmount) return;
    
    setIsPlaying(true);
    setComputerChoice(null);
    
    try {
      const result = await playRPS('/api/games/rps/play', { 
        choice: selectedChoice,
        bet_amount: betAmount 
      });
      
      // Animate computer choice
      let animationCount = 0;
      const animationInterval = setInterval(() => {
        setComputerChoice(choices[animationCount % 3].id);
        animationCount++;
        
        if (animationCount > 9) {
          clearInterval(animationInterval);
          setComputerChoice(result.computer_choice);
          setBalance(result.balance);
          setLastResult(result);
          setIsPlaying(false);
          
          // Update stats
          if (result.result === 'win') {
            setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
          } else if (result.result === 'lose') {
            setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
          } else {
            setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          }
          
          setTimeout(() => setShowResult(true), 500);
        }
      }, 200);
    } catch (error) {
      setIsPlaying(false);
      console.error('RPS error:', error);
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'from-green-500 to-emerald-500';
      case 'lose': return 'from-red-500 to-pink-500';
      case 'draw': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-blue-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <IconButton onClick={() => router.back()} className="bg-black/30 backdrop-blur-sm">
          <X className="w-6 h-6" />
        </IconButton>
        
        <h1 className="text-2xl font-bold text-white">가위바위보</h1>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-sm text-gray-300">승률: </span>
          <span className="text-sm font-bold text-green-400">
            {stats.wins + stats.losses + stats.draws > 0 
              ? Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100)
              : 0}%
          </span>
        </div>
      </header>
      
      {/* Balance & Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 mb-6"
      >
        <GlowCard glowColor="from-blue-500 to-purple-500">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
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
            
            {/* Win/Loss Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-500/20 rounded-lg p-2">
                <div className="text-xs text-green-400">승리</div>
                <div className="text-lg font-bold text-white">{stats.wins}</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-2">
                <div className="text-xs text-yellow-400">무승부</div>
                <div className="text-lg font-bold text-white">{stats.draws}</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-2">
                <div className="text-xs text-red-400">패배</div>
                <div className="text-lg font-bold text-white">{stats.losses}</div>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>
      
      {/* Game Area */}
      <div className="relative z-10 px-4 mb-6">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
          {/* Battle Arena */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Player Side */}
            <div className="text-center">
              <h3 className="text-white font-bold mb-3">나</h3>
              <motion.div
                animate={isPlaying ? {
                  y: [0, -10, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl"
              >
                <div className="text-6xl">
                  {selectedChoice ? choices.find(c => c.id === selectedChoice)?.emoji : '❓'}
                </div>
              </motion.div>
            </div>
            
            {/* Computer Side */}
            <div className="text-center">
              <h3 className="text-white font-bold mb-3">컴퓨터</h3>
              <motion.div
                animate={isPlaying ? {
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                }}
                className="bg-gradient-to-br from-pink-600 to-red-600 rounded-2xl p-8 shadow-xl"
              >
                <div className="text-6xl">
                  {computerChoice ? choices.find(c => c.id === computerChoice)?.emoji : '❓'}
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* VS Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{
                scale: isPlaying ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: isPlaying ? Infinity : 0,
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-16 h-16 flex items-center justify-center font-bold text-white text-xl shadow-xl"
            >
              VS
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Choice Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-4"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
          <h3 className="text-white font-bold mb-3 text-center">선택하세요</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {choices.map((choice) => (
              <motion.button
                key={choice.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChoice(choice.id)}
                disabled={isPlaying}
                className={`p-4 rounded-xl transition-all ${
                  selectedChoice === choice.id
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-4xl mb-2">{choice.emoji}</div>
                <div className="text-sm font-medium">{choice.label}</div>
              </motion.button>
            ))}
          </div>
          
          {/* Bet Amount */}
          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-2 text-center">베팅 금액</h4>
            <div className="flex gap-2 justify-center">
              {betAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={isPlaying}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    betAmount === amount
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          
          <Button
            onClick={handlePlay}
            disabled={!selectedChoice || isPlaying || balance < betAmount}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl py-4 shadow-xl"
            size="lg"
          >
            {isPlaying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                <span>대결 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6" />
                <span>승부! ({betAmount.toLocaleString()} 토큰)</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
      
      {/* Game Result Modal */}
      <GameResultModal
        isOpen={showResult}
        onClose={() => {
          setShowResult(false);
          setSelectedChoice(null);
          setComputerChoice(null);
        }}
        result={lastResult}
        onPlayAgain={() => {
          setShowResult(false);
          setSelectedChoice(null);
          setComputerChoice(null);
          handlePlay();
        }}
        onGoToGames={() => router.push('/games')}
      />
    </div>
  );
}