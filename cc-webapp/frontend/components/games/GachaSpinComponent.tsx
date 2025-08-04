import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Gift, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/useToast";
// import { useSound } from "@/hooks/useSound";

interface GachaSpinComponentProps {
  onSpinComplete?: (reward: GachaReward) => void;
  cost?: number;
  isSpinning?: boolean;
  result?: any;
  onComplete?: () => void;
}

interface GachaReward {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  type: "token" | "item" | "character" | "boost";
  value: number;
  icon: string;
}

const gachaRewards: GachaReward[] = [
  // Common rewards (60% chance)
  { id: 1, name: "토큰 팩 S", rarity: "common", type: "token", value: 100, icon: "🪙" },
  { id: 2, name: "토큰 팩 M", rarity: "common", type: "token", value: 200, icon: "🪙" },
  { id: 3, name: "행운의 부적", rarity: "common", type: "boost", value: 5, icon: "🍀" },
  { id: 4, name: "경험치 부스터", rarity: "common", type: "boost", value: 10, icon: "⚡" },
  
  // Rare rewards (25% chance)
  { id: 5, name: "토큰 팩 L", rarity: "rare", type: "token", value: 500, icon: "💰" },
  { id: 6, name: "레어 크리스탈", rarity: "rare", type: "item", value: 1, icon: "💎" },
  { id: 7, name: "더블 럭 부스터", rarity: "rare", type: "boost", value: 20, icon: "🌟" },
  
  // Epic rewards (12% chance)
  { id: 8, name: "토큰 팩 XL", rarity: "epic", type: "token", value: 1000, icon: "💸" },
  { id: 9, name: "에픽 캐릭터", rarity: "epic", type: "character", value: 1, icon: "🦸" },
  { id: 10, name: "골든 부스터", rarity: "epic", type: "boost", value: 50, icon: "👑" },
  
  // Legendary rewards (3% chance)
  { id: 11, name: "메가 토큰 팩", rarity: "legendary", type: "token", value: 5000, icon: "🏆" },
  { id: 12, name: "레전더리 캐릭터", rarity: "legendary", type: "character", value: 1, icon: "🎭" },
];

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  rare: "from-blue-500 to-blue-600", 
  epic: "from-purple-500 to-purple-600",
  legendary: "from-yellow-500 to-orange-500"
};

const rarityChances = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3
};

export default function GachaSpinComponent({ 
  onSpinComplete, 
  cost = 500, 
  isSpinning: externalIsSpinning, 
  result: externalResult, 
  onComplete 
}: GachaSpinComponentProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentReward, setCurrentReward] = useState<GachaReward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinPhase, setSpinPhase] = useState<"idle" | "spinning" | "revealing" | "complete">("idle");
  const { showToast } = useToast();
  // const { playSound } = useSound();

  const selectReward = (): GachaReward => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulative += chance;
      if (random <= cumulative) {
        const rewardsOfRarity = gachaRewards.filter(r => r.rarity === rarity);
        return rewardsOfRarity[Math.floor(Math.random() * rewardsOfRarity.length)];
      }
    }
    
    // Fallback to common
    const commonRewards = gachaRewards.filter(r => r.rarity === "common");
    return commonRewards[Math.floor(Math.random() * commonRewards.length)];
  };

  const startSpin = () => {
    setIsSpinning(true);
    setShowResult(false);
    setSpinPhase("spinning");
    
    // playSound("spin");
    
    // Spinning animation phase
    setTimeout(() => {
      setSpinPhase("revealing");
      const reward = selectReward();
      setCurrentReward(reward);
      
      // Play sound based on rarity
      if (reward.rarity === "legendary") {
        // playSound("legendary");
      } else if (reward.rarity === "epic") {
        // playSound("epic");
      } else if (reward.rarity === "rare") {
        // playSound("rare");
      } else {
        // playSound("common");
      }
    }, 2000);

    // Result reveal phase
    setTimeout(() => {
      setSpinPhase("complete");
      setShowResult(true);
      setIsSpinning(false);
    }, 3000);
  };

  const resetSpin = () => {
    setSpinPhase("idle");
    setCurrentReward(null);
    setShowResult(false);
  };

  const handleSpinComplete = () => {
    if (currentReward) {
      onSpinComplete?.(currentReward);
      
      showToast(
        `${currentReward.name} 획득!`,
        currentReward.rarity === "legendary" ? "success" : 
        currentReward.rarity === "epic" ? "success" : "info"
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-purple-500 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-purple-400" />
          가챠 스핀
          <Sparkles className="text-purple-400" />
        </h2>
        <div className="text-purple-200">
          스핀 비용: <span className="font-bold text-yellow-300">{cost} 토큰</span>
        </div>
      </div>

      {/* Gacha Machine */}
      <div className="relative bg-black rounded-xl p-8 mb-6 border-4 border-purple-400">
        <div className="relative w-48 h-48 mx-auto">
          {/* Spinning orb */}
          <motion.div
            animate={
              spinPhase === "spinning" 
                ? { rotate: 360, scale: [1, 1.2, 1] }
                : spinPhase === "revealing"
                ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
                : {}
            }
            transition={{
              rotate: { duration: 0.5, repeat: spinPhase === "spinning" ? Infinity : 0 },
              scale: { duration: 0.5, repeat: spinPhase === "spinning" ? Infinity : 0 },
              opacity: { duration: 0.5, repeat: spinPhase === "revealing" ? 2 : 0 }
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-6xl"
          >
            {spinPhase === "idle" && "❓"}
            {spinPhase === "spinning" && "✨"}
            {(spinPhase === "revealing" || spinPhase === "complete") && currentReward?.icon}
          </motion.div>

          {/* Glow effect */}
          <motion.div
            animate={
              isSpinning || showResult
                ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }
                : { opacity: 0.2 }
            }
            transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
            className={`absolute inset-0 rounded-full blur-2xl ${
              currentReward 
                ? `bg-gradient-to-r ${rarityColors[currentReward.rarity]}`
                : "bg-gradient-to-r from-purple-600 to-pink-600"
            }`}
          />
        </div>

        {/* Rarity indicator */}
        {currentReward && showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4"
          >
            <div className={`inline-block px-4 py-2 rounded-full text-white font-bold text-sm bg-gradient-to-r ${
              rarityColors[currentReward.rarity]
            }`}>
              {currentReward.rarity.toUpperCase()}
            </div>
          </motion.div>
        )}
      </div>

      {/* Spin Button */}
      {!showResult && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startSpin}
          disabled={isSpinning}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isSpinning ? (
            <>
              <RotateCcw className="animate-spin" />
              {spinPhase === "spinning" ? "스핀 중..." : "공개 중..."}
            </>
          ) : (
            <>
              <Gift />
              가챠 스핀!
            </>
          )}
        </motion.button>
      )}

      {/* Result Display */}
      <AnimatePresence>
        {showResult && currentReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center bg-black/50 rounded-lg p-6"
          >
            <div className="text-3xl mb-4">{currentReward.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {currentReward.name}
            </h3>
            <div className={`inline-block px-3 py-1 rounded-full text-white font-semibold text-sm mb-4 bg-gradient-to-r ${
              rarityColors[currentReward.rarity]
            }`}>
              {currentReward.rarity.toUpperCase()}
            </div>
            
            {currentReward.type === "token" && (
              <div className="text-yellow-300 font-bold text-lg mb-4">
                +{currentReward.value.toLocaleString()} 토큰
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpinComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                수령하기
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetSpin}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                다시 하기
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rarity Chances */}
      <div className="mt-6 bg-black/30 rounded-lg p-4">
        <h3 className="text-purple-300 font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          확률표
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-300">🏆 레전더리: 3%</div>
          <div className="text-purple-300">💜 에픽: 12%</div>
          <div className="text-blue-300">💙 레어: 25%</div>
          <div className="text-gray-400">⚪ 커먼: 60%</div>
        </div>
      </div>
    </div>
  );
}
