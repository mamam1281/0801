'use client';

import React, { useState } from 'react';
// Assuming Button is now in @/components/Button
import Button from '../../Button';
import { motion, AnimatePresence } from 'framer-motion';

// Define SYMBOLS here to match the slot machine
const SYMBOLS = ['🍒', '🔔', '💎', '7️⃣', '⭐'];

interface GameFooterProps {
  className?: string;
  // Props to dynamically pass payout info if needed, though slotLogic is imported directly for now
}

// Helper to get payout multiplier from slotLogic.ts (simplified)
// In a real app, this might be more structured, perhaps directly from slotLogic.checkWinCondition
const getSymbolPayoutMultiplier = (symbol: string, count: number): string => {
  if (count === 3) {
    switch (symbol) {
      case '🍒': return "5배";
      case '🔔': return "10배";
      case '💎': return "20배";
      case '7️⃣': return "50배";
      case '⭐': return "100배 (기본)"; // Base for triple star, full jackpot is separate
      default: return "-";
    }
  }
  if (count === 2) return "1.5배";
  return "-";
};

export function GameFooter({ className }: GameFooterProps) {
  const [showRules, setShowRules] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const Payouts = SYMBOLS.map(symbol => ({
    symbol,
    description: `${symbol}${symbol}${symbol} ${symbol === '🍒' ? '체리' : symbol === '🔔' ? '벨' : symbol === '💎' ? '다이아몬드' : symbol === '7️⃣' ? '럭키 세븐' : '스타'} 트리플`,
    payout: getSymbolPayoutMultiplier(symbol, 3)
  }));
  Payouts.push({
    symbol: '⭐',
    description: '⭐⭐⭐ + 조건 충족 시',
    payout: '메가 잭팟!'
  });
   Payouts.push({
    symbol: '❓',
    description: '같은 심볼 2개 매칭 시',
    payout: getSymbolPayoutMultiplier(SYMBOLS[0], 2) // Example for any two symbols
  });


  return (
    <div className={`bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border-primary)] shadow-2xl p-4 ${className || ''}`}>
      <div className="max-w-md mx-auto space-y-3">

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setShowRules(!showRules)}
            variant="outline"
            size="sm"
            className="flex-1 h-10 bg-slate-800/70 border-purple-500/40 text-purple-300 
            hover:bg-slate-700/70 hover:border-purple-400/60 rounded-lg shadow-md"
          >
            <span className="font-medium">게임 규칙</span>
          </Button>

          <Button
            onClick={() => setShowHelp(!showHelp)}
            variant="outline"
            size="sm"
            className="flex-1 h-10 bg-slate-800/70 border-purple-500/40 text-purple-300 
            hover:bg-slate-700/70 hover:border-purple-400/60 rounded-lg shadow-md"
          >
            <span className="font-medium">도움말</span>
          </Button>
        </div>

        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-slate-800/60 rounded-lg p-3 sm:p-4 border border-purple-500/30 
              backdrop-blur-sm text-slate-300 space-y-2"
            >
              <h3 className="text-base font-semibold text-purple-300 mb-2">게임 규칙 & 심볼 페이아웃</h3>
              {Payouts.map(p => (
                <div key={p.description} className="flex justify-between items-center p-1.5 
                bg-slate-900/50 rounded-md text-xs sm:text-sm">
                  <span>{p.description}</span>
                  <span className="font-bold text-amber-300">{p.payout}</span>
                </div>
              ))}
              <div className="mt-2 text-xs text-purple-300/80 space-y-1">
                <p>• 최소 베팅: 5코인, 최대 베팅: 100코인</p>
                <p>• 메가 잭팟은 50코인 이상 베팅 시 특별한 조건에서 발생합니다.</p>
                <p>• 모든 승리 조합은 왼쪽에서 오른쪽으로 정렬됩니다.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-slate-800/60 rounded-lg p-3 sm:p-4 border border-purple-500/30 backdrop-blur-sm text-slate-300 space-y-3"
            >
              <h3 className="text-base font-semibold text-purple-300 mb-2">도움말</h3>
              <div className="text-xs sm:text-sm">
                <h4 className="font-semibold text-purple-200/90 mb-0.5">🎯 게임 방법</h4>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>베팅 금액을 선택하세요 (+/- 또는 빠른 베팅 버튼 사용).</li>
                  <li>SPIN 버튼을 눌러 릴을 돌립니다.</li>
                  <li>릴이 멈춘 후 심볼 조합에 따라 승리 여부가 결정됩니다.</li>
                </ol>
              </div>
              <div className="text-xs sm:text-sm">
                <h4 className="font-semibold text-purple-200/90 mb-0.5">💰 베팅 팁</h4>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>높은 베팅은 더 큰 상금으로 이어질 수 있습니다.</li>
                  <li>연속 패배 시 다음 스핀의 행운을 기대해보세요 (스트릭 보너스 알림 확인).</li>
                  <li>메가 잭팟은 고액 베팅 시에만 활성화될 수 있습니다.</li>
                </ul>
              </div>
              <div className="text-xs sm:text-sm">
                <h4 className="font-semibold text-purple-200/90 mb-0.5">🎲 확률 정보 (참고용)</h4>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>기본 승리 확률은 약 15-20%입니다.</li>
                  <li>스트릭 보너스 시스템이 승리 확률에 영향을 줄 수 있습니다.</li>
                  <li>잭팟 확률은 매우 낮으며, 게임 조건에 따라 변동됩니다.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GameFooter;
