import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface DiceGameProps {
  onGameEnd?: (result: { win: boolean; amount: number }) => void;
  betAmount?: number;
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function DiceGame({ onGameEnd, betAmount = 100 }: DiceGameProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [prediction, setPrediction] = useState<"high" | "low" | null>(null);
  const [result, setResult] = useState<{ win: boolean; amount: number } | null>(null);
  const { showToast } = useToast();

  const rollDice = () => {
    if (!prediction) {
      showToast("주사위 결과를 예측해주세요!", "warning");
      return;
    }

    setIsRolling(true);
    setResult(null);

    // Animate dice rolling
    const rollAnimation = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(rollAnimation);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalValue);
      setIsRolling(false);

      // Determine result
      const isHigh = finalValue >= 4;
      const win = (prediction === "high" && isHigh) || (prediction === "low" && !isHigh);
      const amount = win ? betAmount * 2 : -betAmount;

      setResult({ win, amount });
      onGameEnd?.({ win, amount });

      if (win) {
        showToast(`승리! ${amount} 토큰 획득!`, "success");
      } else {
        showToast(`패배! ${Math.abs(amount)} 토큰 손실`, "error");
      }
    }, 2000);
  };

  const resetGame = () => {
    setPrediction(null);
    setResult(null);
    setDiceValue(1);
  };

  const DiceIcon = diceIcons[diceValue - 1];

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🎲 주사위 게임
      </h2>

      {/* Dice Display */}
      <div className="flex justify-center mb-8">
        <motion.div
          animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
          transition={{ 
            duration: isRolling ? 0.1 : 0,
            repeat: isRolling ? Infinity : 0,
            ease: "linear"
          }}
          className="bg-white rounded-lg p-4 shadow-lg"
        >
          <DiceIcon className="w-16 h-16 text-gray-800" />
        </motion.div>
      </div>

      {/* Prediction Buttons */}
      {!result && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPrediction("low")}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              prediction === "low"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            disabled={isRolling}
          >
            낮음 (1-3)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPrediction("high")}
            className={`py-3 px-6 rounded-lg font-semibold transition-all ${
              prediction === "high"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            disabled={isRolling}
          >
            높음 (4-6)
          </motion.button>
        </div>
      )}

      {/* Roll Button */}
      {!result && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={rollDice}
          disabled={!prediction || isRolling}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
        >
          {isRolling ? "주사위 굴리는 중..." : "주사위 굴리기"}
        </motion.button>
      )}

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className={`text-lg font-bold mb-4 ${
              result.win ? "text-green-400" : "text-red-400"
            }`}>
              {result.win ? "승리!" : "패배!"}
            </div>
            <div className="text-gray-300 mb-4">
              결과: {diceValue} ({diceValue >= 4 ? "높음" : "낮음"})
            </div>
            <div className={`text-xl font-bold mb-6 ${
              result.win ? "text-green-400" : "text-red-400"
            }`}>
              {result.win ? "+" : ""}{result.amount} 토큰
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              다시 하기
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Info */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-400 text-center">
          <div>베팅 금액: {betAmount} 토큰</div>
          <div>승리 시: {betAmount * 2} 토큰 획득</div>
          <div>패배 시: {betAmount} 토큰 손실</div>
        </div>
      </div>
    </div>
  );
}
