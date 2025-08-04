'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Gift, Coins, Star } from 'lucide-react';

export interface RewardResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  reward?: {
    type: 'token' | 'item' | 'bonus';
    amount?: number;
    name?: string;
    icon?: React.ReactNode;
  };
}

const RewardResultModal: React.FC<RewardResultModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  reward,
}) => {
  const typeConfig = {
    success: {
      icon: <CheckCircle className="w-8 h-8 text-green-400" />,
      color: 'green',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-400/30',
    },
    error: {
      icon: <AlertCircle className="w-8 h-8 text-red-400" />,
      color: 'red',
      bgGradient: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-400/30',
    },
    info: {
      icon: <Star className="w-8 h-8 text-blue-400" />,
      color: 'blue',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-400/30',
    },
  };

  const config = typeConfig[type];

  const getRewardIcon = () => {
    if (reward?.icon) return reward.icon;
    switch (reward?.type) {
      case 'token':
        return <Coins className="w-6 h-6 text-yellow-400" />;
      case 'item':
        return <Gift className="w-6 h-6 text-purple-400" />;
      case 'bonus':
        return <Star className="w-6 h-6 text-blue-400" />;
      default:
        return <Gift className="w-6 h-6 text-green-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className={`relative max-w-sm w-full rounded-2xl p-6 
                         bg-gradient-to-br from-slate-800/95 to-slate-900/90 
                         border ${config.borderColor} backdrop-blur-xl
                         shadow-[0_20px_60px_rgba(0,0,0,0.4)]`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 배경 그라데이션 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} 
                              rounded-2xl pointer-events-none`} />
              
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full 
                         bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* 컨텐츠 */}
              <div className="relative z-10 text-center">
                {/* 아이콘 */}
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {config.icon}
                </motion.div>

                {/* 제목 */}
                <motion.h3
                  className="text-xl font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {title}
                </motion.h3>

                {/* 메시지 */}
                <motion.p
                  className="text-slate-300 text-sm mb-4 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {message}
                </motion.p>

                {/* 보상 정보 */}
                {reward && type === 'success' && (
                  <motion.div
                    className="bg-slate-700/50 rounded-xl p-4 mb-4 border border-slate-600/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      {getRewardIcon()}
                      <div className="text-left">
                        <div className="text-white font-medium">
                          {reward.name || '보상'}
                        </div>
                        {reward.amount && (
                          <div className="text-slate-300 text-sm">
                            {reward.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 확인 버튼 */}
                <motion.button
                  onClick={onClose}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white
                            bg-gradient-to-r from-${config.color}-600 to-${config.color}-700
                            hover:from-${config.color}-500 hover:to-${config.color}-600
                            border border-${config.color}-500/50
                            transition-all duration-300 shadow-lg`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  확인
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RewardResultModal;
