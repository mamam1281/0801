'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OnboardingLoaderProps {
  progress?: number;
  onComplete?: () => void;
  autoProgress?: boolean;
  duration?: number;
}

export default function OnboardingLoader({ 
  progress = 0, 
  onComplete,
  autoProgress = true,
  duration = 3000 
}: OnboardingLoaderProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (autoProgress) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setCurrentProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
        }
      }, 16); // 60fps

      return () => clearInterval(interval);
    } else {
      setCurrentProgress(progress);
    }
  }, [autoProgress, progress, duration, onComplete]);

  const progressWidth = Math.min(currentProgress / 100 * 100, 100); // 백분율로 변경

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-[9999] overflow-hidden bg-[#0F172A] md:max-w-[375px] md:max-h-[676px] md:mx-auto md:rounded-[20px] md:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      
      {/* MODEL 로고 */}
      <motion.div 
        className="relative mb-32 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative w-[203px] h-[57px] max-sm:w-[180px] max-sm:h-[50px] rounded-[28.5px] flex items-center justify-center font-bold text-[28px] max-sm:text-[24px] text-slate-100 tracking-[2px]"
             style={{
               background: 'linear-gradient(90deg, #CD295D 0%, #D10DC4 37.5%, #CE30F6 67.5%, #EF54F2 96%)',
               textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
             }}>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-[28.5px] blur-[8px] opacity-40 -z-10"
               style={{
                 background: 'linear-gradient(90deg, #CD295D 0%, #D10DC4 37.5%, #CE30F6 67.5%, #EF54F2 96%)'
               }} />
          MODEL
        </div>
      </motion.div>

      {/* 프로그레스 바 컨테이너 */}
      <motion.div 
        className="relative w-[247px] max-sm:w-[220px] h-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {/* 배경 프로그레스 바 */}
        <div className="absolute inset-0 bg-[#0F2749] rounded" />
        
        {/* 활성 프로그레스 바 */}
        <motion.div 
          className="absolute top-0 left-0 h-full bg-[#ED172B] rounded transition-all duration-300 ease-out shadow-lg"
          initial={{ width: "0%" }}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  );
}