import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TokenDisplay from "./TokenDisplay";
import { Loader2, AlertTriangle, TrendingUp, Clock } from "lucide-react";

interface TokenBalanceWidgetProps {
  amount: number;
  loading?: boolean;
  criticalThreshold?: number;
  onClick?: () => void;
  title?: string;
  showTrend?: boolean;
  trendPercentage?: number;
  className?: string;
  // 심리적 효과 props
  delayUpdate?: boolean;
  delayDuration?: number;
  showPendingUpdate?: boolean;
}

// 완전히 새로운 토큰 잔액 위젯 - 현대적 대시보드 스타일
export const TokenBalanceWidget: React.FC<TokenBalanceWidgetProps> = ({
  amount,
  loading = false,
  criticalThreshold = 100000,
  onClick,
  title = "토큰 잔액",
  showTrend = false,
  trendPercentage = 0,
  className,
  delayUpdate = false,
  delayDuration = 1500,
  showPendingUpdate = false,
}) => {
  // 심리적 효과를 위한 상태
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [isPending, setIsPending] = useState(false);

  // 지연 업데이트 효과
  useEffect(() => {
    if (delayUpdate && amount !== displayAmount) {
      setIsPending(true);
      const timer = setTimeout(() => {
        setDisplayAmount(amount);
        setIsPending(false);
      }, delayDuration);
      return () => clearTimeout(timer);
    } else {
      setDisplayAmount(amount);
    }
  }, [amount, delayUpdate, delayDuration, displayAmount]);

  const isCritical = displayAmount < criticalThreshold;
  const isPositiveTrend = trendPercentage > 0;

  // 상태별 스타일
  const getStatusStyles = () => {
    if (loading) {
      return {
        border: 'var(--color-primary-purple)',
        glow: 'var(--color-primary-purple)',
        background: 'rgba(91, 48, 246, 0.05)'
      };
    }
    if (isCritical) {
      return {
        border: 'var(--color-error)',
        glow: 'var(--color-error)',
        background: 'rgba(239, 68, 68, 0.08)'
      };
    }
    return {
      border: 'var(--color-accent-amber)',
      glow: 'var(--color-accent-amber)',
      background: 'rgba(245, 158, 11, 0.05)'
    };
  };

  const statusStyles = getStatusStyles();

  return (
    <div
      className={`
        relative group cursor-pointer
        p-6 rounded-3xl
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:brightness-110
        min-w-[280px] max-w-[400px]
        ${className || ''}
      `.trim()}
      style={{
        fontFamily: "var(--font-primary)",
        background: `linear-gradient(135deg, ${statusStyles.background}, rgba(255, 255, 255, 0.02))`,
        border: `2px solid ${statusStyles.border}`,
        backdropFilter: "blur(24px)",
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.1),
          inset 0 2px 0 rgba(255, 255, 255, 0.2),
          0 0 60px ${statusStyles.glow}20
        `,
      }}
      onClick={onClick}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-sm font-semibold uppercase tracking-wider opacity-80"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {title}
        </h3>
        
        {/* 상태 표시기 */}
        <div className="flex items-center gap-2">
          {/* 업데이트 대기 중 표시 */}
          <AnimatePresence>
            {isPending && showPendingUpdate && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Clock 
                  className="w-4 h-4 animate-spin" 
                  style={{ color: 'var(--color-primary-purple)' }}
                />
                <span 
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-primary-purple)' }}
                >
                  업데이트 중
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {isCritical && !loading && !isPending && (
            <div className="flex items-center gap-1">
              <AlertTriangle 
                className="w-4 h-4 animate-pulse" 
                style={{ color: 'var(--color-error)' }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--color-error)' }}
              >
                부족
              </span>
            </div>
          )}
          
          {showTrend && !loading && !isPending && (
            <div className="flex items-center gap-1">
              <TrendingUp 
                className={`w-4 h-4 ${isPositiveTrend ? 'text-green-400' : 'text-red-400 rotate-180'}`}
              />
              <span 
                className={`text-xs font-medium ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}
              >
                {isPositiveTrend ? '+' : ''}{trendPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex items-center justify-between">
        {loading ? (
          <div className="flex items-center gap-4">
            <Loader2 
              className="w-8 h-8 animate-spin" 
              style={{ color: 'var(--color-primary-purple)' }}
            />
            <div>
              <div 
                className="h-8 w-32 rounded-xl animate-pulse mb-2"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <div 
                className="h-4 w-20 rounded-lg animate-pulse"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            </div>
          </div>
        ) : (
          <TokenDisplay
            amount={displayAmount}
            variant={isCritical ? 'critical' : 'premium'}
            size="lg"
            icon={
              <div 
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${statusStyles.glow}, ${statusStyles.glow}80)`,
                  boxShadow: `0 0 20px ${statusStyles.glow}40`
                }}
              >
                <span className="text-white font-bold text-xs">CC</span>
              </div>
            }
          />
        )}
      </div>

      {/* 하단 액션 힌트 */}
      {onClick && !loading && (
        <div 
          className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <p 
            className="text-xs text-center opacity-60"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            클릭하여 자세히 보기
          </p>
        </div>
      )}

      {/* 호버 글로우 효과 */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${statusStyles.glow}10, transparent)`,
          filter: `blur(1px)`
        }}
      />
    </div>
  );
};

export default TokenBalanceWidget;
