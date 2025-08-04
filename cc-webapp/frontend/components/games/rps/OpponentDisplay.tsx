'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Choice } from './types';

interface OpponentDisplayProps {
  choice: Choice | null;
  isThinking: boolean; // 이 prop은 유지하지만 내부적으로는 사용하지 않음
}

const choiceConfig = {
  rock: { emoji: '🪨', label: '바위', color: 'var(--casino-border)' },
  paper: { emoji: '📄', label: '보', color: 'var(--casino-primary)' },
  scissors: { emoji: '✂️', label: '가위', color: 'var(--casino-secondary)' }
};

export const OpponentDisplay: React.FC<OpponentDisplayProps> = ({
  choice,
  isThinking // 사용하지 않지만 호환성을 위해 prop은 유지
}) => {

  // 간소화된 애니메이션 옵션
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // 선택 카드 애니메이션
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: "spring" as const }
    }
  };

  return (
    <div className="ai-area">
      <AnimatePresence mode="wait">
        {choice ? (
          // 선택한 카드만 표시
          <motion.div
            key="choice"
            className="flex flex-col items-center justify-center h-[130px] w-full relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={`opponent-choice-icon rounded-2xl border-2 bg-white/5 backdrop-blur-sm choice-${choice}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              {choiceConfig[choice].emoji}
            </motion.div>
            <motion.div
              className="flex flex-col items-center absolute bottom-2 left-0 right-0 mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.p
                className="text-base text-slate-200 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {choiceConfig[choice].label}
              </motion.p>
              <motion.p
                className="text-xs text-slate-400 bg-black/20 px-3 py-1 rounded-full mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                AI의 선택
              </motion.p>
            </motion.div>
          </motion.div>
        ) : (
          // 선택되지 않았을 때 AI 이모티콘 표시 (크기 고정)
          <motion.div
            key="empty"
            className="h-[130px] w-full flex items-center justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="opponent-choice-icon rounded-2xl border-2 bg-white/5 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🤖
            </motion.div>
            <motion.p
              className="text-xs text-slate-400 bg-black/20 px-3 py-1 rounded-full mt-1 absolute bottom-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              AI 대기 중
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OpponentDisplay;
