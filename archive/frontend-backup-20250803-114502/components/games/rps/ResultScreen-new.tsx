'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Choice = 'rock' | 'paper' | 'scissors';
export type GameResult = 'win' | 'lose' | 'draw' | null;

export interface GameScore {
  player: number;
  ai: number;
  draws: number;
}

interface ResultScreenProps {
  result: GameResult;
  playerChoice: Choice | null;
  aiChoice: Choice | null;
  onPlayAgain: () => void;
  cjaiMessage: string;
  score: GameScore;
  playerWinStreak: number;
  playerLossStreak: number;
}

const choiceEmojis: Record<Choice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
};

const choiceLabels: Record<Choice, string> = {
  rock: '🪨 바위',
  paper: '📄 보자기',
  scissors: '✂️ 가위'
};

const resultConfig = {
  win: {
    title: '🎉 승리!',
    message: '🎊 완벽한 승리! 🎊',
    color: 'var(--casino-success)',
    gradient: 'var(--casino-gradient-choice)',
    borderColor: 'var(--casino-success)'
  },
  lose: {
    title: '😔 패배',
    message: '💪 다시 도전!',
    color: 'var(--casino-danger)',
    gradient: 'var(--casino-gradient-choice-hover)',
    borderColor: 'var(--casino-danger)'
  },
  draw: {
    title: '🤝 박빙 무승부',
    message: '⚡ 실력이 대단한데! 한 번 더! ⚡',
    color: 'var(--casino-secondary)',
    gradient: 'var(--casino-gradient-popup-btn)',
    borderColor: 'var(--casino-secondary)'
  }
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  playerChoice,
  aiChoice,
  onPlayAgain,
  cjaiMessage,
  score,
  playerWinStreak,
  playerLossStreak
}) => {
  if (!result || !playerChoice || !aiChoice) return null;

  const config = resultConfig[result];

  const overlayVariants = {
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

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotateX: 15,
      transition: {
        duration: 0.3,
        ease: "easeIn" as const
      }
    }
  };

  const choiceVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: custom * 0.1,
        type: "spring" as const,
        stiffness: 400,
        damping: 20
      }
    })
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      y: -2,
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    },
    tap: {
      scale: 0.95,
      transition: { type: "spring" as const, stiffness: 600, damping: 30 }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 p-2"
      style={{
        background: 'var(--casino-overlay-bg, rgba(0,0,0,0.6))',
        backdropFilter: 'blur(6px)'
      }}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="rounded-xl border shadow-xl max-w-sm w-full mx-2 min-h-[350px]"
        style={{
          background: 'var(--casino-modal-bg, var(--casino-gradient-popup-bg, #18181b))',
          borderColor: config.borderColor,
          boxShadow: `0 20px 40px -12px var(--casino-shadow-modal, rgba(0,0,0,0.4)), 0 0 20px ${config.color}20`
        }}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="text-center p-1 pb-1">
          <motion.h2
            className="text-4xl sm:text-4xl font-bold mb-6"
            style={{ color: config.color }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {config.title}
          </motion.h2>
          <motion.p
            className="text-slate-300 font-semibold px-1 leading-relaxed"
            style={{ fontSize: '22px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {cjaiMessage}
          </motion.p>
        </div>

        {/* Choices Display */}
        <div className="flex items-center justify-center px-4 py-4">
          <motion.div 
            className="text-center"
            variants={choiceVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="text-5xl sm:text-6xl mb-1 p-1 rounded-xl bg-white/10 border border-white/20">
              {choiceEmojis[playerChoice!]}
            </div>
            <p className="text-xl sm:text-xl text-slate-300 font-bold">
              당신
            </p>
          </motion.div>

          <motion.div
            className="text-5xl sm:text-7xl font-bold px-2"
            style={{ color: config.color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3, type: "spring" as const }}
          >
            VS
          </motion.div>

          <motion.div 
            className="text-center"
            variants={choiceVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="text-5xl sm:text-6xl mb-1 p-1 rounded-xl bg-white/10 border border-white/20">
              {choiceEmojis[aiChoice!]}
            </div>
            <p className="text-xl sm:text-xl text-slate-300 font-bold">
              AI
            </p>
          </motion.div>
        </div>

        {/* Stats Display */}
        <div className="px-4 py-3 text-white text-center">
          <div className="flex justify-around items-center bg-white/5 rounded-lg p-2">
            <div>
              <span className="text-sm text-slate-400">승리</span>
              <p className="font-bold text-lg">{score.player}</p>
            </div>
            <div>
              <span className="text-sm text-slate-400">패배</span>
              <p className="font-bold text-lg">{score.ai}</p>
            </div>
            <div>
              <span className="text-sm text-slate-400">무승부</span>
              <p className="font-bold text-lg">{score.draws}</p>
            </div>
            {playerWinStreak > 1 && (
              <div>
                <span className="text-sm text-slate-400">연승</span>
                <p className="font-bold text-lg text-yellow-400">{playerWinStreak} 🔥</p>
              </div>
            )}
            {playerLossStreak > 1 && (
              <div>
                <span className="text-sm text-slate-400">연패</span>
                <p className="font-bold text-lg text-red-400">{playerLossStreak} 💧</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-4 pt-3">
          <motion.button
            className="flex-1 py-4 px-4 rounded-lg font-bold transition-all duration-200 text-2xl"
            style={{
              color: 'var(--casino-btn-text, #fff)',
              background: 'var(--casino-btn-bg, ' + config.color + ')',
              boxShadow: '0 4px 15px var(--casino-btn-shadow, ' + config.color + '40)'
            }}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onPlayAgain}
          >
            🔄다시
          </motion.button>
   
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultScreen;
