'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, AlertTriangle } from 'lucide-react';

interface TokenBalanceProps {
  amount: number;
  status?: 'normal' | 'warning' | 'critical';
  change?: 'none' | 'increase' | 'decrease';
  className?: string;
}

export function TokenBalanceWidget({ 
  amount, 
  status = 'normal', 
  change = 'none',
  className = '' 
}: TokenBalanceProps) {
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
          key={amount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="mb-4"
        >
          <div className={`text-4xl md:text-5xl font-bold ${colors.text} mb-1`}>
            {formatAmount(amount)}
          </div>
          <div className="text-slate-400 text-sm">
            {amount.toLocaleString()} tokens
          </div>
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
    </motion.div>
  );
}