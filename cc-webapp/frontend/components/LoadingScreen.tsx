'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Zap, Star, Crown, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
  gameTitle?: string;
}

export function LoadingScreen({ 
  onComplete, 
  duration = 3000,
  gameTitle = "NEON QUEST" 
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps = [
    { text: "초기화 중...", icon: Gamepad2 },
    { text: "게임 엔진 로딩...", icon: Zap },
    { text: "사용자 데이터 동기화...", icon: Star },
    { text: "최종 준비 완료!", icon: Crown }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => onComplete?.(), 500);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration, onComplete, loadingSteps.length]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-black to-primary/20"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>

          {/* Main Loading Content */}
          <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6">
            {/* Game Logo/Title */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1, 
                type: "spring", 
                stiffness: 100,
                delay: 0.2 
              }}
              className="space-y-4"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-gold p-1"
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-primary" />
                  </div>
                </motion.div>
                
                {/* Orbiting Elements */}
                {[0, 120, 240].map((angle, index) => (
                  <motion.div
                    key={index}
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: index * 0.3
                    }}
                    className="absolute inset-0"
                  >
                    <Sparkles 
                      className="absolute w-3 h-3 text-gold"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px)`
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.h1 
                className="text-4xl md:text-5xl font-black text-gradient-primary tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {gameTitle}
              </motion.h1>
            </motion.div>

            {/* Loading Progress */}
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full bg-gradient-game relative"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
                
                {/* Progress Percentage */}
                <motion.div 
                  className="absolute -top-8 right-0 text-gold font-bold"
                  key={progress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {progress}%
                </motion.div>
              </div>

              {/* Loading Step */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {React.createElement(loadingSteps[currentStep].icon, {
                      className: "w-5 h-5 text-primary"
                    })}
                  </motion.div>
                  <span className="text-foreground font-medium">
                    {loadingSteps[currentStep].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>

            {/* Version Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-muted-foreground"
            >
              Version 1.0.0 • Made with ❤️
            </motion.div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-4 left-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-2 border-primary/30 rounded-full"
            />
          </div>
          
          <div className="absolute bottom-4 right-4">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 border-gold/30 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}