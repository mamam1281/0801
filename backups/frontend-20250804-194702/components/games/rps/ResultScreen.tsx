'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ResultScreenProps {
  result: 'win' | 'lose' | 'draw';
  playerChoice: 'rock' | 'paper' | 'scissors';
  opponentChoice: 'rock' | 'paper' | 'scissors';
  onPlayAgain: () => void;
  onClose?: () => void;
  isPopup?: boolean;
}

const getResultText = (result: 'win' | 'lose' | 'draw') => {
  switch (result) {
    case 'win':
      return '승리!';
    case 'lose':
      return '패배!';
    case 'draw':
      return '무승부!';
    default:
      return '';
  }
};

const getResultColor = (result: 'win' | 'lose' | 'draw') => {
  switch (result) {
    case 'win':
      return 'text-green-500';
    case 'lose':
      return 'text-red-500';
    case 'draw':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
};

const getChoiceEmoji = (choice: 'rock' | 'paper' | 'scissors') => {
  switch (choice) {
    case 'rock':
      return '✊';
    case 'paper':
      return '✋';
    case 'scissors':
      return '✌️';
    default:
      return '';
  }
};

const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  playerChoice,
  opponentChoice,
  onPlayAgain,
  onClose,
  isPopup = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`
        ${isPopup ? 'rps-popup-result' : 'rps-result-screen'}
        bg-white rounded-lg shadow-xl p-6 text-center
      `}
    >
      {/* 결과 텍스트 */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`text-3xl font-bold mb-4 ${getResultColor(result)}`}
      >
        {getResultText(result)}
      </motion.h2>

      {/* 선택 결과 표시 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center space-x-8 mb-6"
      >
        {/* 플레이어 선택 */}
        <div className="text-center">
          <div className="text-4xl mb-2">{getChoiceEmoji(playerChoice)}</div>
          <p className="text-sm text-gray-600 font-medium">플레이어</p>
        </div>

        {/* VS */}
        <div className="text-2xl font-bold text-gray-400">VS</div>

        {/* 상대방 선택 */}
        <div className="text-center">
          <div className="text-4xl mb-2">{getChoiceEmoji(opponentChoice)}</div>
          <p className="text-sm text-gray-600 font-medium">상대방</p>
        </div>
      </motion.div>

      {/* 액션 버튼들 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex space-x-4 justify-center"
      >
        <button
          onClick={onPlayAgain}
          className="
            px-6 py-2 bg-blue-500 hover:bg-blue-600 
            text-white rounded-lg font-medium
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          "
        >
          다시 하기
        </button>
        
        {isPopup && onClose && (
          <button
            onClick={onClose}
            className="
              px-6 py-2 bg-gray-500 hover:bg-gray-600 
              text-white rounded-lg font-medium
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50
            "
          >
            닫기
          </button>
        )}
      </motion.div>

      {/* 결과에 따른 추가 메시지 */}
      {result === 'win' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-green-600 mt-4"
        >
          🎉 축하합니다! 사이버 토큰을 획득했습니다!
        </motion.p>
      )}
      
      {result === 'lose' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-red-600 mt-4"
        >
          아쉽네요. 다시 도전해보세요!
        </motion.p>
      )}
      
      {result === 'draw' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-yellow-600 mt-4"
        >
          무승부입니다. 한 번 더 시도해보세요!
        </motion.p>
      )}
    </motion.div>
  );
};

export default ResultScreen;
