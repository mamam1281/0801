'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import Button from '../../Button';
import { X } from 'lucide-react';

export type GameState = 'idle' | 'spinning' | 'result';

interface SlotMachineButtonProps {
  onSpin: () => void;
  canSpin: boolean;
  isSpinning: boolean;
  gameState: GameState;
  winResult: any;
  balance: number;
  betAmount: number;
  className?: string;
}

export const SlotMachineButton: React.FC<SlotMachineButtonProps> = ({
  onSpin,
  canSpin,
  isSpinning,
  gameState,
  winResult,
  balance,
  betAmount,
  className = '',
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSpinClick = () => {
    onSpin();
  };

  return (
    <>
      <div className={`w-full bg-gradient-to-br from-[var(--color-surface-primary)] via-[var(--color-surface-secondary)] to-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] p-4 mx-auto shadow-lg shadow-black/20 ${className}`}>
      {/* Spin Button */}
      <div className="w-full text-center" style={{ marginBottom: "28px" }}>
        <Button
          onClick={handleSpinClick}
          disabled={!canSpin}
          size="lg"
          className={cn(
            "w-full h-16 sm:h-18 text-xl sm:text-2xl font-bold rounded-xl transition-all duration-300 shadow-xl",
            !canSpin 
              ? "opacity-50 cursor-not-allowed shadow-none" 
              : "bg-gradient-to-r from-[var(--color-accent-amber)] via-[var(--color-accent-yellow)] to-[var(--color-accent-amber)] hover:from-[var(--color-accent-yellow)] hover:to-[var(--color-accent-amber)] hover:via-[var(--color-accent-amber)] text-[var(--color-surface-primary)] transform hover:scale-105 shadow-xl shadow-[var(--color-accent-amber)]/30"
          )}
        >
          <motion.div
            className="flex items-center justify-center gap-4"
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </motion.div>
        </Button>
        
        {!canSpin && balance < betAmount && (
          <div className="text-[var(--color-status-error)] text-sm sm:text-base mt-2">
            Insufficient balance
          </div>
        )}
      </div>

      {/* 🎰 결과 표시 영역 */}
      {winResult && gameState === 'result' && (
        <div className="w-full text-center mb-4">
          <div className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-bold shadow-lg",
            winResult.isWin 
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse" 
              : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
          )}>
            {winResult.isWin ? (
              <>
                🎉 승리! +{winResult.payout} 코인 ({winResult.multiplier}x)
              </>
            ) : (
              <>
                💸 실패! 다시 도전하세요!
              </>
            )}
          </div>
        </div>
      )}

      {/* Game Rules & Help Buttons */}
      <div className="w-full flex gap-3 justify-center">
        <Button
          onClick={() => setShowRulesModal(true)}
          variant="outline"
          size="sm"
          className="flex-1 h-10 bg-gradient-to-b from-slate-700/80 to-slate-800/80 border-2 border-purple-500/40 text-purple-300 hover:bg-gradient-to-b hover:from-slate-600/80 hover:to-slate-700/80 hover:border-purple-400/60 rounded-lg shadow-xl shadow-purple-500/20 transform transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="font-medium">게임 규칙</span>
        </Button>

        <Button
          onClick={() => setShowHelpModal(true)}
          variant="outline"
          size="sm"
          className="flex-1 h-10 bg-gradient-to-b from-slate-700/80 to-slate-800/80 border-2 border-purple-500/40 text-purple-300 hover:bg-gradient-to-b hover:from-slate-600/80 hover:to-slate-700/80 hover:border-purple-400/60 rounded-lg shadow-xl shadow-purple-500/20 transform transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="font-medium">도움말</span>
        </Button>
      </div>
    </div>

    {/* Rules Modal */}
    <AnimatePresence>
      {showRulesModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowRulesModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-300">게임 규칙 & 심볼 페이아웃</h3>
              <Button
                onClick={() => setShowRulesModal(false)}
                variant="text"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-3 text-slate-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>🍒🍒🍒 체리 트리플</span>
                  <span className="font-bold text-amber-300">5배</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>🔔🔔🔔 벨 트리플</span>
                  <span className="font-bold text-amber-300">10배</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>💎💎💎 다이아몬드 트리플</span>
                  <span className="font-bold text-amber-300">20배</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>7️⃣7️⃣7️⃣ 럭키 세븐 트리플</span>
                  <span className="font-bold text-amber-300">50배</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>⭐⭐⭐ 스타 트리플</span>
                  <span className="font-bold text-amber-300">100배</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded-md">
                  <span>같은 심볼 2개 매칭</span>
                  <span className="font-bold text-amber-300">1.5배</span>
                </div>
              </div>
              <div className="text-xs text-purple-300/80 space-y-1 mt-4">
                <p>• 최소 베팅: 5코인, 최대 베팅: 100코인</p>
                <p>• 메가 잭팟은 50코인 이상 베팅 시 특별한 조건에서 발생합니다.</p>
                <p>• 모든 승리 조합은 왼쪽에서 오른쪽으로 정렬됩니다.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Help Modal */}
    <AnimatePresence>
      {showHelpModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-300">도움말</h3>
              <Button
                onClick={() => setShowHelpModal(false)}
                variant="text"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-4 text-slate-300 text-sm">
              <div>
                <h4 className="font-semibold text-purple-200/90 mb-2">🎯 게임 방법</h4>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>베팅 금액을 선택하세요 (+/- 또는 빠른 베팅 버튼 사용).</li>
                  <li>SPIN 버튼을 눌러 릴을 돌립니다.</li>
                  <li>릴이 멈춘 후 심볼 조합에 따라 승리 여부가 결정됩니다.</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-purple-200/90 mb-2">💰 베팅 팁</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>높은 베팅은 더 큰 상금으로 이어질 수 있습니다.</li>
                  <li>연속 패배 시 다음 스핀의 행운을 기대해보세요.</li>
                  <li>메가 잭팟은 고액 베팅 시에만 활성화될 수 있습니다.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-200/90 mb-2">🎲 확률 정보</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>기본 승리 확률은 약 15-20%입니다.</li>
                  <li>잭팟 확률은 매우 낮으며, 게임 조건에 따라 변동됩니다.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};

export default SlotMachineButton;
