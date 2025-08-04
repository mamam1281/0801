import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Trophy, Gift, Gamepad2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlowCard from '@/components/ui/GlowCard';

const slides = [
  {
    icon: Sparkles,
    title: "환영합니다!",
    description: "Casino Club F2P에서 특별한 경험을 시작하세요",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Trophy,
    title: "경쟁하고 승리하세요",
    description: "다양한 게임과 도전 과제로 보상을 획득하세요",
    gradient: "from-blue-500 to-purple-500"
  },
  {
    icon: Gift,
    title: "매일 보너스 받기",
    description: "매일 로그인하고 특별한 보상을 받으세요",
    gradient: "from-pink-500 to-orange-500"
  },
  {
    icon: Gamepad2,
    title: "지금 시작하세요!",
    description: "초대 코드로 가입하고 웰컴 보너스를 받으세요",
    gradient: "from-green-500 to-blue-500"
  }
];

export default function OnboardingCarousel({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md"
          >
            <GlowCard glowColor={slides[currentSlide].gradient}>
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`inline-flex p-4 rounded-full bg-gradient-to-r ${slides[currentSlide].gradient} mb-6`}
                >
                  {React.createElement(slides[currentSlide].icon, { className: "w-12 h-12 text-white" })}
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  {slides[currentSlide].title}
                </h2>
                
                <p className="text-gray-300 mb-8">
                  {slides[currentSlide].description}
                </p>
              </div>
            </GlowCard>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="p-4 pb-8">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                width: index === currentSlide ? 24 : 8,
                backgroundColor: index === currentSlide ? "#ec4899" : "#6b7280"
              }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
        
        <div className="flex gap-4">
          {currentSlide < slides.length - 1 && (
            <Button
              variant="ghost"
              onClick={skipOnboarding}
              className="flex-1"
            >
              건너뛰기
            </Button>
          )}
          
          <Button
            onClick={nextSlide}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
          >
            {currentSlide === slides.length - 1 ? "시작하기" : "다음"}
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}