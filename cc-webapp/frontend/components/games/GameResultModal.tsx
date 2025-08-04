// components/games/GameResultModal.tsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, RotateCcw, List } from "lucide-react";
import ConfettiEffect from "@/components/effects/ConfettiEffect";
import Button from "@/components/ui/Button";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: any;
  reward?: number;
  onPlayAgain?: () => void;
  onExploreGames?: () => void;
  onGoToGames?: () => void;
}

export default function GameResultModal({
  isOpen,
  onClose,
  result,
  reward = 0,
  onPlayAgain,
  onExploreGames,
  onGoToGames
}: GameResultModalProps) {
  useEffect(() => {
    // 모달이 열리면 배경 스크롤 방지
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const resultMessages = {
    win: "대박! 승리했습니다!",
    lose: "아쉽네요! 다시 도전해보세요!",
    draw: "무승부! 아깝습니다!"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4 z-50"
          >
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {result === "win" && <ConfettiEffect />}
              
              <div className="p-6 text-center">
                <motion.h2
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className={`text-3xl font-bold mb-4 ${
                    result === "win" ? "text-green-500" :
                    result === "lose" ? "text-red-500" : "text-yellow-500"
                  }`}
                >
                  {result && resultMessages[result as keyof typeof resultMessages] || "결과"}
                </motion.h2>
                
                {result === "win" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center justify-center gap-2 mb-6"
                  >
                    <span className="text-lg text-gray-300">보상:</span>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">💎</span>
                      <AnimatedNumber value={reward} className="text-2xl font-bold text-white" />
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button onClick={onPlayAgain} className="flex items-center justify-center gap-2">
                    <RotateCcw size={16} />
                    다시 플레이
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExploreGames}
                    className="flex items-center justify-center gap-2"
                  >
                    <List size={16} />
                    다른 게임
                  </Button>
                </div>
                
                <button
                  onClick={() => {/* Share functionality */}}
                  className="flex items-center justify-center gap-2 text-sm text-gray-400 mx-auto hover:text-white transition-colors"
                >
                  <Share2 size={14} />
                  결과 공유하기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}