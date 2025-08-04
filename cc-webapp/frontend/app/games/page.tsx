'use client';

import './games.css';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  Zap, 
  TrendingUp, 
  Dice1, 
  Target, 
  Sparkles,
  Trophy,
  Coins,
  Play,
  ArrowLeft,
  Crown,
  Flame
} from 'lucide-react';

type GameType = 'home' | 'slots' | 'roulette' | 'rps' | 'gacha';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gameType: GameType;
  accent: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  minBet: number;
  maxWin: number;
  isNew?: boolean;
  isHot?: boolean;
}

function GameCard({ 
  title, 
  description, 
  icon, 
  gameType, 
  accent, 
  difficulty, 
  minBet, 
  maxWin, 
  isNew, 
  isHot
}: GameCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // 실제 브라우저 팝업 창으로 게임 열기
    const popupConfig = {
      width: 420,
      height: 850,
      resizable: 'no',
      scrollbars: 'no',
      status: 'no',
      toolbar: 'no',
      menubar: 'no',
      location: 'no'
    };
    
    const configString = Object.entries(popupConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    let popupUrl = '';
    switch (gameType) {
      case 'slots':
        popupUrl = `${window.location.origin}/games/slots/popup`;
        break;
      case 'roulette':
        popupUrl = `${window.location.origin}/games/roulette/popup`;
        break;
      case 'rps':
        popupUrl = `${window.location.origin}/games/rps/popup`;
        break;
      case 'gacha':
        popupUrl = `${window.location.origin}/games/gacha/popup`;
        break;
      default:
        return;
    }
    const popup = window.open(popupUrl, '_blank', configString);
    if (!popup) {
      alert('팝업이 차단되었습니다. 브라우저 팝업 차단을 해제해 주세요.');
    }
  };

  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 게임 타이틀 영역 복원 */}
      <div className="w-full flex items-center justify-center py-3">
        <span className="text-lg font-bold text-white drop-shadow-md tracking-wide">
          {title}
        </span>
      </div>
    </motion.div>
  );
}

function HomePage() {
  const games: GameCardProps[] = [
    {
      title: "코스믹 포츈",
      description: "우주 슬롯머신의 짜릿한 재미",
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      gameType: "slots",
      accent: "purple-400",
      difficulty: "Easy",
      minBet: 10,
      maxWin: 100000,
      isNew: true,
      isHot: true
    },
    {
      title: "갤럭시 룰렛",
      description: "운명의 숫자를 맞춰보세요",
      icon: <Target className="w-5 h-5 text-blue-400" />,
      gameType: "roulette",
      accent: "blue-400",
      difficulty: "Medium",
      minBet: 50,
      maxWin: 350000,
      isHot: true
    },
    {
      title: "코스믹 배틀",
      description: "가위바위보 우주 대결",
      icon: <Dice1 className="w-5 h-5 text-emerald-400" />,
      gameType: "rps",
      accent: "emerald-400",
      difficulty: "Easy",
      minBet: 20,
      maxWin: 80000
    },
    {
      title: "스텔라 랜덤뽑기",
      description: "행운의 랜덤뽑기로 특별한 보상을 획득하세요!",
      icon: <Star className="w-5 h-5 text-orange-400" />,
      gameType: "gacha",
      accent: "orange-400",
      difficulty: "Hard",
      minBet: 100,
      maxWin: 1000000,
      isNew: true
    }
  ];

  return (
    <div className="game-dashboard w-full max-w-[420px] mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                    relative overflow-hidden">
      
      {/* 깔끔한 별빛 효과만 유지 */}
      <div className="absolute inset-0 opacity-20">
        {[
          { left: 15, top: 20, delay: 0.5, duration: 3.2 },
          { left: 85, top: 35, delay: 1.2, duration: 4.1 },
          { left: 45, top: 15, delay: 2.0, duration: 3.8 },
          { left: 25, top: 70, delay: 0.8, duration: 3.5 },
          { left: 75, top: 60, delay: 1.8, duration: 4.2 },
          { left: 35, top: 85, delay: 1.0, duration: 3.7 },
          { left: 90, top: 25, delay: 2.5, duration: 3.3 },
          { left: 10, top: 50, delay: 0.3, duration: 4.0 },
          { left: 60, top: 40, delay: 1.5, duration: 3.6 },
          { left: 80, top: 80, delay: 2.2, duration: 3.9 }
        ].map((star, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col px-2 max-w-lg mx-auto w-full">
        
        {/* 개선된 헤더 */}
        <motion.header
          className="py-5 text-center relative z-20"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.h1
            style={{
              fontSize: '16px',
              color: '#FF1493',
              fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              textShadow: '0 12px 40px rgba(0,0,0,0.6), 0 6px 20px rgba(168,85,247,0.4), 0 4px 12px rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap'
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            MODEL CASINO
          </motion.h1>
          
          {/* 프리미엄 통계 */}
          <motion.div
            className="flex items-center justify-center gap-4 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <TrendingUp className="w-4 h-4 text-emerald-300" />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
          </motion.div>
        </motion.header>

        {/* 게임 그리드 */}
        <main className="flex-1 pb-8">
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {games.map((game, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <GameCard {...game} />
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* 프리미엄 푸터 */}
        <motion.footer
          className="py-6 text-center border-t border-white/10 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p style={{
               fontFamily: "'Inter', sans-serif",
               color: 'rgba(255, 255, 255, 0.6)',
               fontSize: '0.875rem',
               fontWeight: '400',
               letterSpacing: '0.025em',
               textShadow: '0 2px 8px rgba(0,0,0,0.3)'
             }}>
            Responsible Gaming • Licensed & Secure ⭐
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.title = '🎰 COSMIC CASINO - 프리미엄 우주 카지노';
  }, []);

  return <HomePage />;
}
