'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Zap, Star, Crown, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
  gameTitle?: string;
}

function LoadingScreenComponent({
  onComplete,
  duration = 3000,
  gameTitle = 'NEON QUEST',
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 1000, height: 800 });
  const [isMobile, setIsMobile] = useState(false);

  // 클라이언트 사이드에서만 window 크기를 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 초기 화면 크기 설정 및 모바일 여부 확인
      const updateDimensions = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setWindowDimensions({ width, height });
        setIsMobile(width < 640); // 640px 미만은 모바일로 간주
      };

      // 초기 실행
      updateDimensions();

      // 화면 크기 변경 이벤트 리스너
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  const loadingSteps = [
    { text: '초기화 중...', icon: Gamepad2 },
    { text: '게임 엔진 로딩...', icon: Zap },
    { text: '사용자 데이터 동기화...', icon: Star },
    { text: '최종 준비 완료!', icon: Crown },
  ];

  // 모바일에서는 애니메이션 요소 수 줄이기
  const particleCount = isMobile ? 10 : 20;

  // 진행도 업데이트를 위한 useEffect - 초기에 단 한 번만 설정
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    let isMounted = true;
    // 모바일에서는 더 큰 단계로 빠르게 증가
    let progressStep = isMobile ? 3 : 2;

    // 진행률 업데이트를 위한 타이머 설정
    const timer = setTimeout(
      () => {
        // 모바일에서는 업데이트 주기를 더 길게 하여 성능 최적화
        const interval = setInterval(
          () => {
            if (!isMounted) return;

            setProgress((prev) => {
              const newProgress = prev + progressStep;
              if (newProgress >= 100) {
                clearInterval(interval);
                return 100;
              }
              return newProgress;
            });
          },
          isMobile ? duration / 40 : duration / 50
        );

        // 클린업 함수
        return () => {
          isMounted = false;
          clearInterval(interval);
        };
      },
      isMobile ? 50 : 10
    ); // 모바일에서는 지연 시간 더 길게

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [isMobile, duration]); // 의존성 배열에 사용되는 변수들을 추가

  // 진행률에 따른 단계 업데이트와 완료 처리
  useEffect(() => {
    // 진행률에 따른 단계 업데이트
    const stepIndex = Math.floor((progress / 100) * loadingSteps.length);
    setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));

    // 로딩이 완료되면 콜백 실행
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        const completeTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
        return () => clearTimeout(completeTimer);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, loadingSteps.length, onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-br from-background via-black to-primary/20"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(particleCount)].map((_, i) => {
              // 클라이언트에서만 랜덤값 사용, 서버에서는 고정된 시드값 사용
              // useClientOnlyValue를 직접 사용하는 대신 useMemo로 계산
              const randomPos = useMemo(() => {
                if (typeof window === 'undefined') {
                  // 서버 사이드 렌더링에서는 고정된 값 사용
                  return {
                    x: 50 + ((i * 30) % 800),
                    y: 50 + ((i * 25) % 600),
                  };
                } else {
                  // 클라이언트 사이드에서는 뷰포트에 맞는 랜덤값 사용
                  // 뷰포트를 약간 넘어가도록 설정하여 화면 끝에서도 효과가 보이도록 함
                  return {
                    x: Math.random() * (windowDimensions.width + 100) - 50,
                    y: Math.random() * (windowDimensions.height + 100) - 50,
                  };
                }
              }, [windowDimensions.width, windowDimensions.height]);

              return (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: randomPos.x,
                    y: randomPos.y,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: isMobile ? 0 : 360, // 모바일에서는 회전 애니메이션 비활성화
                  }}
                  transition={{
                    duration: isMobile ? 4 : 3, // 모바일에서는 애니메이션 지속시간 증가
                    repeat: Infinity,
                    delay: i * (isMobile ? 0.2 : 0.1), // 모바일에서는 딜레이 더 주기
                    ease: 'easeInOut',
                  }}
                  className={`absolute rounded-full ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-primary`}
                />
              );
            })}
          </div>

          {/* Main Loading Content */}
          <div className="relative z-10 text-center space-y-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            {/* Game Logo/Title */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 1,
                type: 'spring',
                stiffness: 100,
                delay: 0.2,
              }}
              className="space-y-4"
            >
              <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: isMobile ? 6 : 4, // 모바일에서는 회전 애니메이션 느리게
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-gold p-1"
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </motion.div>

                {/* Orbiting Elements - 모바일에서는 요소 수 줄이기 */}
                {/* 모바일에서는 2개, 데스크톱에서는 3개 표시 */}
                {(isMobile ? [0, 180] : [0, 120, 240]).map((angle, index) => (
                  <motion.div
                    key={index}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: isMobile ? 5 : 3, // 모바일에서는 느리게 회전
                      repeat: Infinity,
                      ease: 'linear',
                      delay: index * (isMobile ? 0.5 : 0.3), // 모바일에서는 딜레이 더 주기
                    }}
                    className="absolute inset-0"
                  >
                    <Sparkles
                      className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${isMobile ? '-32px' : '-35px'}) sm:translateY(-40px)`,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-black text-gradient-primary tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {gameTitle}
              </motion.h1>
            </motion.div>

            {/* Loading Progress */}
            <div className="space-y-4 sm:space-y-6 w-full">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-game relative"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>

                {/* Progress Percentage */}
                <motion.div
                  className="absolute -top-6 sm:-top-8 right-0 text-sm sm:text-base text-gold font-bold"
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
                  className="flex items-center justify-center gap-2 sm:gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    {React.createElement(loadingSteps[currentStep].icon, {
                      className: 'w-4 h-4 sm:w-5 sm:h-5 text-primary',
                    })}
                  </motion.div>
                  <span className="text-sm sm:text-base text-foreground font-medium">
                    {loadingSteps[currentStep].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"
                />
              ))}
            </div>

            {/* Version Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-[10px] sm:text-xs text-muted-foreground"
            >
              Version 1.0.0 • Made with ❤️
            </motion.div>
          </div>

          {/* Corner Decorations - 모바일에서는 더 작고 화면 가장자리에 가깝게 */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <motion.div
              animate={{ rotate: isMobile ? 180 : 360 }}
              transition={{
                duration: isMobile ? 15 : 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-10 h-10 sm:w-16 sm:h-16 border border-primary/20 sm:border-2 sm:border-primary/30 rounded-full"
            />
          </div>

          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
            <motion.div
              animate={{ rotate: isMobile ? -180 : -360 }}
              transition={{
                duration: isMobile ? 20 : 15,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-8 h-8 sm:w-12 sm:h-12 border border-gold/20 sm:border-2 sm:border-gold/30 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 클라이언트 사이드에서만 로딩화면을 렌더링하기 위해 next/dynamic을 사용
const LoadingScreen = dynamic(() => Promise.resolve(LoadingScreenComponent), {
  ssr: false,
});

export { LoadingScreen };
