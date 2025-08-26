'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, AlertTriangle } from 'lucide-react';
import useBalanceSync from '@/hooks/useBalanceSync';
import { useUserProfile, useUserGold } from '@/hooks/useSelectors';
import { api as unifiedApi } from '@/lib/unifiedApi';

interface TokenBalanceProps {
  amount: number;
  status?: 'normal' | 'warning' | 'critical';
  change?: 'none' | 'increase' | 'decrease';
  className?: string;
  // 선택: 공용 상태와 동기화하고 싶을 때 전달
  sharedUser?: { goldBalance?: number } | null;
  onUpdateUser?: (next: any) => void;
  onAddNotification?: (msg: string) => void;
}

export function TokenBalanceWidget({ 
  amount, 
  status = 'normal', 
  change = 'none',
  className = '',
  sharedUser,
  onUpdateUser,
  onAddNotification,
}: TokenBalanceProps) {
  const { reconcileBalance } = useBalanceSync({ sharedUser, onUpdateUser, onAddNotification });
  const globalUser = useUserProfile();
  const globalGold = useUserGold();

  const [openHistory, setOpenHistory] = useState(false);
  type HistoryItem = { id?: string | number; action?: string; type?: string; delta?: number };
  const [history, setHistory] = useState([] as HistoryItem[]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // 마운트 시 1회 권위 동기화(옵션: sharedUser 전달된 경우에만)
  useEffect(() => {
    if (sharedUser && onUpdateUser) {
      reconcileBalance().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const formatAmount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          glow: 'shadow-amber-500/20'
        };
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-red-500/20'
        };
      default:
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          glow: 'shadow-emerald-500/20'
        };
    }
  };

  const getChangeIcon = () => {
    switch (change) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'warning':
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  const colors = getStatusColor();
  const changeIcon = getChangeIcon();
  const statusIcon = getStatusIcon();

  // Prefer global store amount if available to ensure canonical display
  const displayAmount = useMemo(() => {
    if (typeof globalGold === 'number' && globalGold > 0) return globalGold;
    // fallback to prop
    return amount;
  }, [globalGold, amount]);

  const openHistoryModal = useCallback(async () => {
    setOpenHistory(true);
    if (history.length > 0) return; // already loaded
    if (!globalUser?.id) return;
    setLoadingHistory(true);
    try {
      const res = await unifiedApi.get(`actions/recent/${globalUser.id}?limit=20`);
      // unifiedApi returns parsed json body
      setHistory(res?.actions || res?.data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed load balance history', e);
    } finally {
      setLoadingHistory(false);
    }
  }, [globalUser?.id, history.length]);

  const closeHistoryModal = useCallback(() => setOpenHistory(false), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glassmorphism Background */}
      <div className={`
        relative backdrop-blur-xl bg-slate-900/80 
        border ${colors.border} rounded-2xl p-6
        shadow-xl ${colors.glow}
        before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-br before:from-white/5 before:to-transparent
        before:pointer-events-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: change === 'increase' ? 360 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}
            >
              {statusIcon}
            </motion.div>
            <div>
              <h3 className="text-slate-100 font-medium">Token Balance</h3>
              <p className="text-slate-400 text-sm">Available Tokens</p>
            </div>
          </div>
          
          {changeIcon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              {changeIcon}
            </motion.div>
          )}
        </div>

        {/* Balance Amount */}
        <motion.div
          key={displayAmount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="mb-4"
        >
          <button
            type="button"
            onClick={openHistoryModal}
            className={`text-left w-full`}
            aria-label="Open balance history"
          >
            <div className={`text-4xl md:text-5xl font-bold ${colors.text} mb-1`}>
              {formatAmount(displayAmount)}
            </div>
            <div className="text-slate-400 text-sm">
              {displayAmount.toLocaleString()} tokens
            </div>
          </button>
        </motion.div>

        {/* Status Bar */}
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${status === 'critical' ? 20 : status === 'warning' ? 60 : 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${
              status === 'critical' ? 'bg-red-500' :
              status === 'warning' ? 'bg-amber-500' : 
              'bg-emerald-500'
            }`}
          />
        </div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-sm text-slate-400"
        >
          {status === 'critical' && 'Critical: Token balance is very low'}
          {status === 'warning' && 'Warning: Token balance is running low'}
          {status === 'normal' && 'Balance is healthy'}
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-xl" />
      </div>
        {/* History Modal */}
        {openHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeHistoryModal} />
            <div className="relative bg-slate-900 rounded-lg p-6 w-full max-w-xl z-10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">Recent balance changes</h4>
                <button className="text-slate-400" onClick={closeHistoryModal}>Close</button>
              </div>
              <div className="max-h-64 overflow-auto">
                {loadingHistory && <div className="text-slate-400">Loading...</div>}
                {!loadingHistory && history.length === 0 && <div className="text-slate-400">No recent changes</div>}
                <ul className="space-y-2">
                  {history.map((h: HistoryItem, idx: number) => (
                    <li key={h.id || idx} className="flex justify-between text-sm text-slate-300">
                      <div>{h.action || h.type || 'action'}</div>
                      <div className="text-slate-400">{h.delta ? (h.delta > 0 ? `+${h.delta}` : `${h.delta}`) : ''}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
    </motion.div>
  );
}