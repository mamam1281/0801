'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Coins, 
  Trophy, 
  Timer,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Crown,
  Sparkles
} from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/button';

interface RockPaperScissorsGameProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'draw';

interface GameRound {
  playerChoice: Choice;
  aiChoice: Choice;
  result: GameResult;
  winnings: number;
  isSpecialMove: boolean;
}

interface SoundEffect {
  name: string;
  duration: number;
  visual: string;
}

const CHOICES = {
  rock: { emoji: '✊', name: '바위', beats: 'scissors', color: 'text-orange-400' },
  paper: { emoji: '✋', name: '보', beats: 'rock', color: 'text-blue-400' },
  scissors: { emoji: '✌️', name: '가위', beats: 'paper', color: 'text-red-400' }
};

const SOUND_EFFECTS: Record<string, SoundEffect> = {
  countdown: { name: '카운트다운', duration: 800, visual: '⏰' },
  playerAttack: { name: '플레이어 공격', duration: 500, visual: '💥' },
  aiAttack: { name: 'AI 공격', duration: 500, visual: '⚡' },
  clash: { name: '충돌', duration: 300, visual: '💢' },
  victory: { name: '승리', duration: 1000, visual: '🎉' },
  defeat: { name: '패배', duration: 800, visual: '😵' },
  draw: { name: '무승부', duration: 600, visual: '🤝' },
  combo: { name: '콤보', duration: 1200, visual: '🔥' },
  perfect: { name: '퍼펙트', duration: 1500, visual: '⭐' }
};

export function RockPaperScissorsGame({ 
  user, 
  onBack, 
  onUpdateUser, 
  onAddNotification 
}: RockPaperScissorsGameProps) {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundHistory, setRoundHistory] = useState<GameRound[]>([]);
  const [streak, setStreak] = useState(0);
  const [betAmount, setBetAmount] = useState(50);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSoundEffect, setCurrentSoundEffect] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [comboCount, setComboCount] = useState(0);
  const [isSpecialMove, setIsSpecialMove] = useState(false);

  // Play sound effect (visual simulation)
  const playSoundEffect = (effectName: string) => {
    if (!soundEnabled) return;
    
    const effect = SOUND_EFFECTS[effectName];
    if (effect) {
      setCurrentSoundEffect(effect.visual);
      setTimeout(() => setCurrentSoundEffect(null), effect.duration);
    }
  };

  // Generate particles
  const generateParticles = (result: GameResult) => {
    const colors = {
      win: ['#00ff88', '#ffeb3b', '#ff006e'],
      lose: ['#ff3366', '#666'],
      draw: ['#ffaa00', '#00ccff']
    };
    
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[result][Math.floor(Math.random() * colors[result].length)]
    }));
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  // Simple AI choice calculation (no patterns)
  const calculateAiChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * 3)];
  };

  // Determine winner
  const determineWinner = (player: Choice, ai: Choice): GameResult => {
    if (player === ai) return 'draw';
    if (CHOICES[player].beats === ai) return 'win';
    return 'lose';
  };

  // Handle game play with improved timing
  const playGame = async (choice: Choice) => {
    if (isPlaying) return;
    
    if (user.goldBalance < betAmount) {
      onAddNotification('❌ 골드가 부족합니다!');
      return;
    }

    setIsPlaying(true);
    // 🚫 사용자 선택을 미리 보여주지 않음!
    setPlayerChoice(null);
    setAiChoice(null);
    setShowResult(false);
    setGameResult(null);

    // 🎯 카운트다운 (선택 숨김 상태에서)
    playSoundEffect('countdown');
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    setCountdown(null);

    // 🤖 AI와 플레이어 동시에 선택 공개 (동시성 보장)
    const ai = calculateAiChoice();
    
    // 동시에 선택 공개
    setPlayerChoice(choice);
    setAiChoice(ai);
    
    // Sound effects
    playSoundEffect('playerAttack');
    await new Promise(resolve => setTimeout(resolve, 200));
    playSoundEffect('aiAttack');
    await new Promise(resolve => setTimeout(resolve, 300));
    playSoundEffect('clash');

    // Determine result
    const result = determineWinner(choice, ai);
    setGameResult(result);

    // Check for special moves
    const isSpecial = streak >= 2 && result === 'win';
    setIsSpecialMove(isSpecial);

    // Calculate winnings with bonuses
    let winnings = 0;
    let comboMultiplier = 1;
    
    if (result === 'win') {
      winnings = betAmount * 2;
      
      // Streak bonuses
      if (streak >= 2) {
        comboMultiplier = 1 + (streak * 0.2);
        setComboCount(streak + 1);
        playSoundEffect('combo');
      }
      
      if (streak >= 4) {
        comboMultiplier *= 1.5;
        playSoundEffect('perfect');
      }
      
      winnings = Math.floor(winnings * comboMultiplier);
    } else if (result === 'draw') {
      winnings = betAmount; // Return bet
    }

    // Update user stats
    const updatedUser = {
      ...user,
      goldBalance: user.goldBalance - betAmount + winnings,
      gameStats: {
        ...user.gameStats,
        rps: {
          ...user.gameStats.rps,
          totalGames: user.gameStats.rps.totalGames + 1,
          wins: result === 'win' ? user.gameStats.rps.wins + 1 : user.gameStats.rps.wins,
          currentStreak: result === 'win' ? user.gameStats.rps.currentStreak + 1 : 0,
          bestStreak: result === 'win' 
            ? Math.max(user.gameStats.rps.bestStreak, user.gameStats.rps.currentStreak + 1)
            : user.gameStats.rps.bestStreak
        }
      },
      stats: {
        ...user.stats,
        gamesPlayed: user.stats.gamesPlayed + 1,
        gamesWon: result === 'win' ? user.stats.gamesWon + 1 : user.stats.gamesWon,
        totalEarnings: user.stats.totalEarnings + (winnings - betAmount),
        winStreak: result === 'win' ? user.stats.winStreak + 1 : 0
      }
    };

    // Update streak
    if (result === 'win') {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
      setComboCount(0);
    }

    // Generate visual effects
    generateParticles(result);
    
    // Play result sound
    playSoundEffect(result);

    // Add to round history
    const round: GameRound = {
      playerChoice: choice,
      aiChoice: ai,
      result,
      winnings: winnings - betAmount,
      isSpecialMove: isSpecial
    };
    setRoundHistory(prev => [round, ...prev.slice(0, 9)]);

    onUpdateUser(updatedUser);
    
    // 🎯 중요한 알림만
    if (result === 'win' && (comboMultiplier > 1.5 || winnings - betAmount >= 200)) {
      const baseMessage = `🎉 승리! +${(winnings - betAmount).toLocaleString()}G`;
      let finalMessage = baseMessage;
      if (comboMultiplier > 1) {
        finalMessage += ` (${comboMultiplier.toFixed(1)}x 콤보!)`;
      }
      onAddNotification(finalMessage);
    }

    setShowResult(true);
    setIsPlaying(false);
  };

  // Reset game
  const resetGame = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setGameResult(null);
    setShowResult(false);
    setCountdown(null);
    setIsSpecialMove(false);
    setComboCount(0);
    setParticles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-success/10 relative overflow-hidden">
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
              y: `${particle.y - 20}vh`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed w-3 h-3 rounded-full pointer-events-none z-30"
            style={{ backgroundColor: particle.color }}
          />
        ))}
      </AnimatePresence>

      {/* Sound Effect Visual */}
      <AnimatePresence>
        {currentSoundEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 text-4xl z-50 pointer-events-none bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            {currentSoundEffect}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  textShadow: [
                    '0 0 20px rgba(255,0,110,0.5)',
                    '0 0 40px rgba(255,0,110,1)',
                    '0 0 20px rgba(255,0,110,0.5)'
                  ]
                }}
                transition={{ duration: 0.6 }}
                className="text-9xl font-black text-primary"
              >
                {countdown}
              </motion.div>
              
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 border-8 border-primary rounded-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-border-secondary/50 backdrop-blur-xl bg-card/80"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="glass-effect hover:bg-primary/10 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">
              가위바위보 대전
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="glass-effect hover:bg-primary/10 transition-all duration-300"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            <div className="glass-effect rounded-xl p-3 border border-gold/20">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">보유 골드</div>
                <div className="text-xl font-black text-gradient-gold">
                  {user.goldBalance.toLocaleString()}G
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Combo Banner */}
      {comboCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-gradient-to-r from-error to-warning text-white text-center py-3 font-bold"
        >
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-5 h-5" />
            <span>🔥 {comboCount} COMBO STREAK! 🔥</span>
            <Flame className="w-5 h-5" />
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 max-w-4xl mx-auto">
        {/* 배팅액 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 mb-6"
        >
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              배팅액 설정
            </h3>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.max(10, betAmount - 50))}
                disabled={isPlaying || betAmount <= 10}
                className="border-border-secondary hover:border-primary"
              >
                -50G
              </Button>
              
              <div className="bg-gradient-to-r from-gold to-gold-light text-black px-6 py-3 rounded-lg font-bold text-xl min-w-[120px]">
                {betAmount.toLocaleString()}G
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.min(1000, betAmount + 50))}
                disabled={isPlaying || betAmount >= 1000}
                className="border-border-secondary hover:border-primary"
              >
                +50G
              </Button>
            </div>
            
            <div className="flex gap-2 justify-center flex-wrap">
              {[10, 50, 100, 200, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  disabled={isPlaying}
                  className={`border-border-secondary hover:border-primary ${
                    betAmount === amount ? 'bg-primary text-white' : ''
                  }`}
                >
                  {amount}G
                </Button>
              ))}
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              승리 시 2배 지급 • 무승부 시 베팅금 반환
            </div>
          </div>
        </motion.div>

        {/* 🎯 완전 대칭적인 게임 화면 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-3xl p-12 mb-6 relative overflow-hidden"
        >
          {/* Result Effect */}
          <AnimatePresence>
            {showResult && gameResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 pointer-events-none z-10 ${
                  gameResult === 'win' ? 'bg-success/10' : 
                  gameResult === 'lose' ? 'bg-error/10' : 'bg-warning/10'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      `0 0 20px ${gameResult === 'win' ? 'rgba(0,255,136,0.3)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,0.3)' : 'rgba(255,170,0,0.3)'}`,
                      `0 0 40px ${gameResult === 'win' ? 'rgba(0,255,136,0.6)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,0.6)' : 'rgba(255,170,0,0.6)'}`,
                      `0 0 20px ${gameResult === 'win' ? 'rgba(0,255,136,0.3)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,0.3)' : 'rgba(255,170,0,0.3)'}`
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`absolute inset-0 border-4 rounded-3xl ${
                    gameResult === 'win' ? 'border-success' : 
                    gameResult === 'lose' ? 'border-error' : 'border-warning'
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🔄 완전 대칭적인 플레이어들 */}
          <div className="grid grid-cols-2 gap-16 mb-12">
            {/* 🧑 플레이어 - 왼쪽 */}
            <div className="text-center">
              <div className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                {isSpecialMove && <Sparkles className="w-5 h-5 text-gold" />}
                당신
                {streak >= 3 && <Crown className="w-5 h-5 text-gold" />}
              </div>
              <motion.div
                animate={
                  playerChoice ? { 
                    scale: [1, 1.3, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}
                }
                transition={{ duration: 0.6 }}
                className={`w-40 h-40 mx-auto bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-8xl mb-6 shadow-2xl border-4 border-primary/30 ${
                  isSpecialMove ? 'animate-pulse' : ''
                }`}
              >
                {playerChoice ? CHOICES[playerChoice].emoji : '❓'}
                
                {isSpecialMove && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute inset-0 border-4 border-gold rounded-full"
                  />
                )}
              </motion.div>
              <div className={`text-lg font-bold ${playerChoice ? CHOICES[playerChoice].color : 'text-muted-foreground'}`}>
                {playerChoice ? CHOICES[playerChoice].name : '선택하세요'}
              </div>
            </div>

            {/* 🤖 AI - 오른쪽 (완전 대칭) */}
            <div className="text-center">
              <div className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <span>🤖</span>
                AI 대전상대
                <span>⚡</span>
              </div>
              <motion.div
                animate={
                  aiChoice ? { 
                    scale: [1, 1.3, 1],
                    rotate: [0, -10, 10, 0]
                  } : isPlaying ? { 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  } : {}
                }
                transition={{ 
                  duration: isPlaying ? 2 : 0.6, 
                  repeat: isPlaying ? Infinity : 0,
                  ease: isPlaying ? "linear" : "easeInOut"
                }}
                className="w-40 h-40 mx-auto bg-gradient-to-br from-warning to-gold rounded-full flex items-center justify-center text-8xl mb-6 shadow-2xl border-4 border-warning/30"
              >
                {aiChoice ? CHOICES[aiChoice].emoji : '🤖'}
              </motion.div>
              <div className={`text-lg font-bold ${aiChoice ? CHOICES[aiChoice].color : 'text-muted-foreground'}`}>
                {aiChoice ? CHOICES[aiChoice].name : isPlaying ? '생각 중...' : 'AI 대기'}
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                textShadow: [
                  '0 0 20px rgba(255,0,110,0.5)',
                  '0 0 40px rgba(255,0,110,1)',
                  '0 0 20px rgba(255,0,110,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl font-black text-gradient-primary"
            >
              ⚔️ VS ⚔️
            </motion.div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {showResult && gameResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="text-center mb-6"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    textShadow: [
                      `0 0 20px ${gameResult === 'win' ? 'rgba(0,255,136,0.5)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,0.5)' : 'rgba(255,170,0,0.5)'}`,
                      `0 0 40px ${gameResult === 'win' ? 'rgba(0,255,136,1)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,1)' : 'rgba(255,170,0,1)'}`,
                      `0 0 20px ${gameResult === 'win' ? 'rgba(0,255,136,0.5)' : 
                                  gameResult === 'lose' ? 'rgba(255,51,102,0.5)' : 'rgba(255,170,0,0.5)'}`
                    ]
                  }}
                  transition={{ duration: 0.8, repeat: 3 }}
                  className={`text-4xl font-black mb-2 ${
                    gameResult === 'win' ? 'text-success' : 
                    gameResult === 'lose' ? 'text-error' : 'text-warning'
                  }`}
                >
                  {gameResult === 'win' ? '🎉 VICTORY!' : 
                   gameResult === 'lose' ? '💀 DEFEAT!' : '🤝 DRAW!'}
                </motion.div>
                
                {streak > 1 && gameResult === 'win' && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="text-lg text-gold font-bold"
                  >
                    🔥 {streak}연승 콤보! 🔥
                  </motion.div>
                )}
                
                {isSpecialMove && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.6, repeat: 3 }}
                    className="text-lg text-gradient-gold font-bold"
                  >
                    ⭐ SPECIAL MOVE! ⭐
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Choice Buttons */}
          <div className="grid grid-cols-3 gap-6">
            {(Object.keys(CHOICES) as Choice[]).map((choice) => (
              <motion.div
                key={choice}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => playGame(choice)}
                  disabled={isPlaying || user.goldBalance < betAmount}
                  className="h-32 w-full bg-gradient-to-r from-secondary to-secondary-hover hover:from-primary hover:to-primary-light text-white font-bold text-xl flex flex-col items-center gap-3 relative overflow-hidden btn-hover-glow"
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                  
                  <span className="text-5xl relative z-10">{CHOICES[choice].emoji}</span>
                  <span className="text-lg relative z-10">{CHOICES[choice].name}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Game Stats & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              게임 통계
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-xl font-bold text-primary">{user.gameStats.rps.wins}</div>
                <div className="text-sm text-muted-foreground">승리</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-error/10 border border-error/20">
                <div className="text-xl font-bold text-error">
                  {user.gameStats.rps.totalGames - user.gameStats.rps.wins - roundHistory.filter(r => r.result === 'draw').length}
                </div>
                <div className="text-sm text-muted-foreground">패배</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="text-xl font-bold text-warning">{roundHistory.filter(r => r.result === 'draw').length}</div>
                <div className="text-sm text-muted-foreground">무승부</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="text-xl font-bold text-success">{streak}</div>
                <div className="text-sm text-muted-foreground">연승</div>
              </div>
            </div>
          </motion.div>

          {/* Recent History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              최근 게임
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {roundHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  아직 게임 기록이 없습니다
                </div>
              ) : (
                roundHistory.slice(0, 5).map((round, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      round.result === 'win' ? 'bg-success/10 border border-success/20' :
                      round.result === 'lose' ? 'bg-error/10 border border-error/20' :
                      'bg-warning/10 border border-warning/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{CHOICES[round.playerChoice].emoji}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span>{CHOICES[round.aiChoice].emoji}</span>
                    </div>
                    <div className={`font-bold ${
                      round.result === 'win' ? 'text-success' :
                      round.result === 'lose' ? 'text-error' : 'text-warning'
                    }`}>
                      {round.result === 'win' ? '+' : round.result === 'lose' ? '-' : ''}
                      {Math.abs(round.winnings).toLocaleString()}G
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <Button
            onClick={resetGame}
            variant="outline"
            className="border-border-secondary hover:border-primary btn-hover-lift"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            게임 초기화
          </Button>
        </motion.div>
      </div>
    </div>
  );
}