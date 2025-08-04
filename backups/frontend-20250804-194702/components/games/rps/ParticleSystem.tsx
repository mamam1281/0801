'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string; // Use string for unique IDs like nanoid or similar
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  type: 'glow' | 'sparkle' | 'trail'; // Add particle types
}

interface ParticleSystemProps {
  isActive: boolean; // True when game is playing or certain results are shown
  intensity?: number; // Optional: e.g., 0.5 for less, 1 for normal, 1.5 for more
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Using CSS variables for colors from globals.css
const NEON_COLORS = [
  'var(--color-purple-primary)',
  'var(--color-purple-secondary)',
  'var(--color-purple-tertiary)',
  'var(--color-accent-red)',
  'var(--color-info)', // A cyan-like blue
  'var(--color-success)', // A vibrant green
  'var(--color-accent-amber)', // Amber/Orange
  'rgba(255, 255, 255, 0.7)', // Whiteish accent
];

const createParticle = (): Particle => {
  const type = Math.random() < 0.4 ? 'glow' : (Math.random() < 0.7 ? 'sparkle' : 'trail');
  const size = type === 'glow' ? Math.random() * 6 + 4 : (type === 'sparkle' ? Math.random() * 3 + 1.5 : Math.random() * 2 + 1); // 파티클 크기 축소

  return {
    id: generateId(),
    x: Math.random() * 100,
    y: Math.random() * 100,
    size,
    color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
    duration: Math.random() * 1.5 + 1.5, // 2.5s에서 1.5-3s로 단축
    delay: Math.random() * 0.8, // 딜레이 단축
    type,
  };
};

const particleVariants = {
  initial: (particle: Particle) => ({
    opacity: 0,
    scale: 0.5,
    x: 0,
    y: 0,
  }),
  animate: (particle: Particle) => ({
    opacity: [0, 0.7, 0.7, 0], // 투명도 약간 감소
    scale: particle.type === 'glow' ? [0.5, 1, 1.1, 0.8] : [0.5, 1, 1, 0.7], // 스케일 변화 최소화
    y: particle.type === 'trail' ? [0, -60, -120] : [0, -Math.random() * 40 - 20], // 움직임 범위 축소
    x: [0, Math.random() * 30 - 15, Math.random() * 20 - 10], // 가로 움직임 축소
    rotate: particle.type === 'sparkle' ? [0, Math.random() * 180] : 0, // 회전 범위 축소
    transition: {
      duration: particle.duration * 0.8, // 애니메이션 지속시간 단축
      delay: particle.delay * 0.5, // 딜레이 단축
      ease: "easeOut" as const,
      repeat: 2, // 무한 반복 대신 2번만 반복
      repeatDelay: Math.random() * 1.5 + 0.5, // 반복 딜레이 단축
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.2,
    transition: { duration: 0.2, ease: "easeOut" as const } // 종료 애니메이션 단축
  }
};


export const ParticleSystem: React.FC<ParticleSystemProps> = ({ isActive, intensity = 1 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // 성능 최적화: 모바일에서는 파티클 수를 더 줄임
  const particleCount = useMemo(() => {
    const baseCount = window.innerWidth < 768 ? 4 : 8; // 모바일 4개, 데스크톱 8개로 감소
    return Math.floor(baseCount * intensity);
  }, [intensity]);

  useEffect(() => {
    if (isActive) {
      // Initial burst - 더 적은 파티클로 시작
      setParticles(Array.from({ length: particleCount }, createParticle));

      // 파티클 생성 주기를 늘려서 성능 향상
      const intervalId = setInterval(() => {
        setParticles(prev => {
          const newParticleCount = Math.floor(2 * intensity); // 한 번에 생성하는 파티클 수 감소
          const maxParticles = particleCount * 1.5; // 최대 파티클 수 제한
          
          return [
            ...prev.slice(Math.max(0, prev.length - maxParticles + newParticleCount)),
            ...Array.from({ length: newParticleCount }, createParticle)
          ].slice(-maxParticles);
        });
      }, 1800 / intensity); // 생성 주기 증가 (1.8초)

      return () => clearInterval(intervalId);
    } else {
      // 비활성화 시 즉시 파티클 제거
      const timeoutId = setTimeout(() => setParticles([]), 400);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, particleCount, intensity]);

  // Dynamic background glow based on active state from example
  const backgroundGlowVariants = {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
          opacity: [0.3, 0.7, 0.3],
          scale: [0.9, 1.15, 0.9],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
      }
  };

  const neonRingVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        rotate: 360,
        transition: { duration: 25, repeat: Infinity, ease: "linear" as const }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none -z-[5] gpu-accelerated">
      <AnimatePresence mode="popLayout">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full gpu-accelerated"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              willChange: 'transform, opacity', // GPU 가속 힌트
              transform: 'translateZ(0)', // GPU 레이어 강제 생성
              boxShadow: p.type === 'glow'
                ? `0 0 ${p.size}px ${p.color}, 0 0 ${p.size * 2}px ${p.color.replace(/[\d\.]+\)$/, '0.3)')}` // 그림자 효과 축소
                : (p.type === 'sparkle' ? `0 0 ${p.size * 0.5}px ${p.color}` : 'none'),
              filter: p.type === 'glow' ? 'blur(0.5px)' : 'none', // 블러 효과 축소
            }}
            variants={particleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={p}
          />
        ))}
      </AnimatePresence>

      {/* Background Glow Effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="background-glow"
            variants={backgroundGlowVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, var(--neon-purple-1-t015) 0%, var(--neon-purple-3-t010) 40%, transparent 70%)',
              // Assuming --neon-purple-1-t015 is rgba(var(--neon-purple-1-rgb), 0.15) etc.
              // These transparent vars need to be defined in RPSGame.tsx's <style> or globals.css
            }}
          />
        )}
      </AnimatePresence>

      {/* Neon Ring Effect from example */}
      <AnimatePresence>
        {isActive && (
            <motion.div
                key="neon-ring"
                variants={neonRingVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute inset-0"
                style={{
                    background: 'conic-gradient(from 0deg, var(--neon-purple-1-t010), var(--neon-purple-2-t005), var(--neon-purple-3-t010), var(--neon-purple-4-t005), var(--neon-purple-1-t010))',
                    borderRadius: '50%', // This makes it a circle
                    width: '200%', // Larger than viewport
                    height: '200%',
                    left: '-50%', // Center it
                    top: '-50%',
                    transformOrigin: 'center center', // Ensure rotation is centered
                }}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for RPSGame to define transparent color variables if not globally available
// This should ideally be in globals.css or tailwind.config.js
export const ParticleSystemStyleInjector: React.FC = () => (
  <style>{`
    :root {
      --neon-purple-1-t015: rgba(91, 48, 246, 0.15);
      --neon-purple-3-t010: rgba(128, 84, 242, 0.10);
      --neon-purple-1-t010: rgba(91, 48, 246, 0.10);
      --neon-purple-2-t005: rgba(135, 13, 209, 0.05);
      --neon-purple-4-t005: rgba(128, 84, 242, 0.05);
    }
  `}</style>
);
