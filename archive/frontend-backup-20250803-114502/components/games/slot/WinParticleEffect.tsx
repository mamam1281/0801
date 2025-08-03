'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleProps {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface WinParticleEffectProps {
  isWin: boolean;
  winType: string;
  onComplete?: () => void;
}

const Particle: React.FC<ParticleProps> = ({ id, x, y, delay }) => {
  const colors = ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#7c2d12'];
  const symbols = ['✨', '💎', '🎉', '⭐', '💰'];
  
  return (
    <motion.div
      key={id}
      className="absolute pointer-events-none z-50"
      style={{ left: x, top: y }}
      initial={{ 
        opacity: 0,
        scale: 0,
        x: 0,
        y: 0,
        rotate: 0
      }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.8],
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200 - 100,
        rotate: Math.random() * 360
      }}
      transition={{
        duration: 2,
        delay: delay,
        ease: "easeOut"
      }}
    >
      <span 
        className="text-2xl"
        style={{ color: colors[id % colors.length] }}
      >
        {symbols[id % symbols.length]}
      </span>
    </motion.div>
  );
};

export const WinParticleEffect: React.FC<WinParticleEffectProps> = ({ 
  isWin, 
  winType, 
  onComplete 
}) => {
  const [particles, setParticles] = useState<ParticleProps[]>([]);

  useEffect(() => {
    if (isWin) {
      const particleCount = winType === 'jackpot' ? 30 : winType === 'triple' ? 20 : 15;
      const newParticles: ParticleProps[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 400,
          y: Math.random() * 300 + 100,
          delay: Math.random() * 0.5
        });
      }
      
      setParticles(newParticles);
      
      // 효과 완료 후 정리
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2500);
    }
  }, [isWin, winType, onComplete]);

  return (
    <AnimatePresence>
      {isWin && (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {particles.map((particle) => (
            <Particle
              key={particle.id}
              {...particle}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default WinParticleEffect;
