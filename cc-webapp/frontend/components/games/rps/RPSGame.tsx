'use client';

import React from 'react';
import useSound from 'use-sound';
import { motion, AnimatePresence } from 'framer-motion';
import { ChoiceButtons } from './ChoiceButtons';
import OpponentDisplay from './OpponentDisplay';
import ResultScreen from './ResultScreen';
import { useRPSGame } from '../../../hooks/useRPSGame';
import './rps-compact-theme.css'; // 팝업 스타일도 함께 가져옵니다.

interface RPSGameProps {
  isPopup?: boolean;
}

const RPSGame: React.FC<RPSGameProps> = ({ isPopup = false }) => {
  // useSound로 각 효과음 준비
  const [playScissors] = useSound('/sounds/rps_scissors.mp3', { volume: 0.5 });
  const [playRock] = useSound('/sounds/rps_rock.mp3', { volume: 0.5 });
  const [playPaper] = useSound('/sounds/rps_paper.mp3', { volume: 0.5 });
  const playSound = (idx: number) => {
    if (idx === 0) playScissors();
    else if (idx === 1) playRock();
    else if (idx === 2) playPaper();
  };
  const { gameState, handlePlayerChoice, handlePlayAgain, handleResetScore, isAIThinking, showPsychMessage } = useRPSGame(isPopup);
  const [showSequence, setShowSequence] = React.useState(false);
  const [sequenceStep, setSequenceStep] = React.useState(0);
  const sequenceLabels = ['가위~', '바위~', '보~'];

  // 라운드 시작 시 순차 애니메이션
  React.useEffect(() => {
    if (!gameState.showResultScreen && gameState.playerChoice === null) {
      setShowSequence(true);
      setSequenceStep(0);
      let step = 0;
      playSound(0); // 첫번째(가위) 사운드
      const interval = setInterval(() => {
        step++;
        if (step < sequenceLabels.length) {
          setSequenceStep(step);
          playSound(step); // 각 단계별 사운드
        } else {
          clearInterval(interval);
          setTimeout(() => setShowSequence(false), 400);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameState.showResultScreen, gameState.playerChoice]);

  // handlePlayAgain에 1초 딜레이 적용
  const handlePlayAgainWithDelay = React.useCallback(() => {
    setTimeout(() => {
      handlePlayAgain();
    }, 1000);
  }, [handlePlayAgain]);

  const containerClassName = isPopup ? "rps-popup-container" : "rps-game-container mx-auto p-4 flex flex-col items-center justify-center";

  return (
    <div className={containerClassName}>
      <AnimatePresence mode="wait">
        {gameState.showResultScreen ? (
          <ResultScreen
            key="result"
            result={gameState.result}
            playerChoice={gameState.playerChoice}
            aiChoice={gameState.aiChoice}
            onPlayAgain={handlePlayAgainWithDelay}
            onReset={handleResetScore}
            cjaiMessage={gameState.cjaiMessage}
            score={gameState.score}
            playerWinStreak={gameState.playerWinStreak}
            playerLossStreak={gameState.playerLossStreak}
            isPopup={isPopup}
          />
        ) : (
          <motion.div key="game" className="rps-game-area">
            <OpponentDisplay choice={gameState.aiChoice} isThinking={isAIThinking} />
            <div className="w-full my-4 border-t border-gray-600/50"></div>
            <div className="player-area">
              <AnimatePresence>
                {showSequence ? (
                  <motion.p
                    key={sequenceStep}
                    initial={{ opacity: 0, y: -10, rotate: -10 }}
                    animate={{ opacity: 1, y: 0, rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, type: 'tween' }} // spring → tween
                    className="text-center text-lg text-cyan-300 mb-3 h-8 flex items-center justify-center font-bold"
                    style={{ willChange: 'transform' }}
                  >
                    {sequenceLabels[sequenceStep]}
                  </motion.p>
                ) : (
                  <motion.p 
                    key={gameState.cjaiMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-sm text-gray-300 mb-3 h-8 flex items-center justify-center"
                  >
                    {gameState.cjaiMessage}
                  </motion.p>
                )}
              </AnimatePresence>
              <ChoiceButtons
                onChoice={handlePlayerChoice}
                selectedChoice={gameState.playerChoice}
                disabled={gameState.isPlaying || showSequence}
                isPopup={isPopup}
                cooldown={showSequence}
              />
            </div>
            <div className={`absolute top-2 right-2 text-xs ${isPopup ? 'text-gray-400' : 'text-gray-500'}`}> 
              <p>승: {gameState.score.player} | 패: {gameState.score.ai} | 무: {gameState.score.draws}</p>
              {gameState.playerWinStreak >= 2 && (
                <motion.p 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-green-400 font-bold"
                >
                  🔥 {gameState.playerWinStreak}연승!
                </motion.p>
              )}
              {gameState.playerLossStreak >= 3 && (
                <motion.p 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-red-400 font-bold"
                >
                  💪 반전 기회!
                </motion.p>
              )}
            </div>
            {/* AI 사고 중 표시 */}
            {isAIThinking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50"
              >
                <motion.div
                  animate={{
                    background: [
                      'linear-gradient(90deg, #3b82f6, #10b981)',
                      'linear-gradient(90deg, #10b981, #f59e0b)',
                      'linear-gradient(90deg, #f59e0b, #3b82f6)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
                  style={{
                    color: 'white',
                    padding: '24px 32px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                    boxShadow: '0 0 24px #10b98155',
                  }}
                >
                  🤖 AI 분석 중...
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RPSGame;
