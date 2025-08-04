
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Coins,
  Gift, 
  History, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Star,
  Clock
} from 'lucide-react';

// 기존 컴포넌트 활용
import { TokenDisplay } from '../../components/ui/data-display/TokenDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/basic/card';
import { Button } from '../../components/ui/basic/button';
import { SimpleProgressBar } from '../../components/SimpleProgressBar';

export default function WalletPage() {
  const [selectedTab, setSelectedTab] = useState<'history' | 'bonus'>('history');
  const router = useRouter();

  // 가상 데이터
  const walletData = {
    totalBalance: 2450,
    cashBalance: 1850,
    bonusBalance: 600,
    transactions: [
      { id: 1, type: 'win', amount: 150, game: '슬롯', time: '10분 전', status: 'completed' },
      { id: 2, type: 'bet', amount: -50, game: '가위바위보', time: '25분 전', status: 'completed' },
      { id: 3, type: 'bonus', amount: 100, game: '출석보상', time: '1시간 전', status: 'completed' },
      { id: 4, type: 'win', amount: 200, game: '룰렛', time: '2시간 전', status: 'completed' },
      { id: 5, type: 'bet', amount: -25, game: '랜덤뽑기', time: '3시간 전', status: 'completed' }
    ],
    activeBonuses: [
      { id: 1, title: '신규 가입 보너스', amount: 300, progress: 75, requirement: '게임 10회 플레이', remaining: '3일' },
      { id: 2, title: '주간 미션', amount: 150, progress: 45, requirement: '연속 승리 5회', remaining: '4일' },
      { id: 3, title: 'VIP 보너스', amount: 500, progress: 90, requirement: '1000 토큰 베팅', remaining: '2일' }
    ]
  };

  return (
    <div className="min-h-screen w-full"
         style={{ 
           background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #0f0f23 50%, #1a1a2e 75%, #0a0a0a 100%)',
           color: '#ffffff',
           fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
           position: 'relative'
         }}>

      {/* 프리미엄 배경 오버레이 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div className="max-w-md mx-auto p-4 space-y-6 relative z-10">


        {/* 보유 아이템 버튼 */}
        <div className="flex justify-end mb-2">
          <button
            className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-md transition-all duration-150"
            onClick={() => router.push('/wallet/owned-items')}
          >
            보유 아이템
          </button>
        </div>


        {/* 프리미엄 잔액 대시보드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="group"
        >
          <div className="relative rounded-2xl overflow-hidden
                         transition-all duration-500 flex flex-col group"
               style={{
                 background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(139,92,246,0.05) 100%)',
                 border: '2px solid rgba(255,255,255,0.25)',
                 boxShadow: '0 16px 40px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.15)'
               }}>
            
            {/* 고급 글로우 효과 제거 */}
            <div className="absolute inset-[2px] rounded-2xl pointer-events-none"
                 style={{
                   background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(139,92,246,0.03) 100%)',
                   border: '1px solid rgba(255,255,255,0.12)'
                 }}></div>

            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(145deg, rgba(255,215,0,0.25) 0%, rgba(255,193,7,0.15) 100%)',
                       border: '2px solid rgba(255,215,0,0.4)',
                       boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                     }}>
                  <Coins size={24} className="text-yellow-200" />
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '18px',
                    fontFamily: "'Inter', sans-serif",
                    color: 'rgba(255, 255, 255, 0.98)',
                    fontWeight: '700',
                    letterSpacing: '0.02em'
                  }}>Total Balance</h2>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="relative inline-flex items-center justify-center px-6 py-4 rounded-3xl gap-4 transition-all duration-300 ease-out hover:scale-105 hover:brightness-110 w-full"
                     style={{
                       background: 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 100%)',
                       border: '3px solid rgba(255,255,255,0.4)',
                       boxShadow: '0 12px 32px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.3)'
                     }}>
                  <div className="relative flex items-baseline gap-1">
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      color: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '-0.02em'
                    }}>
                      {walletData.totalBalance.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'rgba(255,255,255,0.9)',
                      fontFamily: "'Inter', sans-serif",
                      marginLeft: '8px'
                    }}>
                      CC
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="rounded-xl p-4 transition-all duration-300 group cursor-pointer"
                  style={{
                    background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(5, 150, 105, 0.08) 100%)',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(34, 197, 94, 0.95)',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontFamily: "'Inter', sans-serif"
                  }}>Cash Balance</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.98)',
                    fontFamily: "'Inter', sans-serif"
                  }}>{walletData.cashBalance.toLocaleString()} CC</div>
                </motion.div>
                
                <motion.div 
                  className="rounded-xl p-4 transition-all duration-300 group cursor-pointer"
                  style={{
                    background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(124, 58, 237, 0.08) 100%)',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(167, 139, 250, 0.95)',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontFamily: "'Inter', sans-serif"
                  }}>Bonus Balance</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.98)',
                    fontFamily: "'Inter', sans-serif"
                  }}>{walletData.bonusBalance.toLocaleString()} CC</div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 프리미엄 탭 네비게이션 */}
        <motion.div 
          className="flex rounded-2xl p-2"
          style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { key: 'history', label: 'History', icon: History },
            { key: 'bonus', label: 'Rewards', icon: Gift }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 min-h-[48px] relative group"
              style={{
                background: selectedTab === key 
                  ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.35) 0%, rgba(79, 70, 229, 0.25) 50%, rgba(67, 56, 202, 0.15) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: selectedTab === key 
                  ? '2px solid rgba(139, 92, 246, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: selectedTab === key 
                  ? 'inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                color: selectedTab === key 
                  ? 'rgba(255, 255, 255, 0.98)'
                  : 'rgba(255, 255, 255, 0.75)'
              }}
            >
              <Icon size={16} />
              <span style={{
                fontSize: '14px',
                fontWeight: selectedTab === key ? '700' : '600',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.02em'
              }}>{label}</span>
            </button>
          ))}
        </motion.div>

        {/* 프리미엄 거래 내역 */}
        {selectedTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.02em',
              marginBottom: '16px'
            }}>Transaction History</h2>
            
            {walletData.transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-xl p-4 transition-all duration-300"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                         style={{
                           background: transaction.type === 'win' 
                             ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                             : transaction.type === 'bonus'
                             ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                             : 'linear-gradient(145deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                           border: transaction.type === 'win' 
                             ? '1px solid rgba(16, 185, 129, 0.3)'
                             : transaction.type === 'bonus'
                             ? '1px solid rgba(139, 92, 246, 0.3)'
                             : '1px solid rgba(239, 68, 68, 0.3)'
                         }}>
                      {transaction.type === 'win' ? <TrendingUp size={20} className="text-emerald-400" /> :
                       transaction.type === 'bonus' ? <Gift size={20} className="text-purple-400" /> :
                       <TrendingDown size={20} className="text-red-400" />}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap'
                      }}>{transaction.game}</div>
                      <div style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: "'Inter', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Clock size={14} />
                        {transaction.time}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: transaction.amount > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} CC
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 프리미엄 보너스 관리 */}
        {selectedTab === 'bonus' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.02em',
              marginBottom: '16px'
            }}>Active Bonuses</h2>
            
            {walletData.activeBonuses.map((bonus, index) => (
              <motion.div
                key={bonus.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-xl p-4 transition-all duration-300"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                           style={{
                             background: 'linear-gradient(145deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                             border: '1px solid rgba(255, 215, 0, 0.3)'
                           }}>
                        <Award size={20} className="text-yellow-400" />
                      </div>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.95)',
                          fontFamily: "'Inter', sans-serif"
                        }}>{bonus.title}</div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontFamily: "'Inter', sans-serif"
                        }}>{bonus.requirement}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'rgba(255, 215, 0, 0.95)',
                        fontFamily: "'Inter', sans-serif"
                      }}>{bonus.amount.toLocaleString()} CC</div>
                      <div className="flex items-center gap-1 mt-1" style={{
                        background: 'linear-gradient(145deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: 'rgba(255, 215, 0, 0.9)',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        <Star size={10} />
                        VIP
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between" style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <span>Progress</span>
                      <span style={{
                        color: 'rgba(16, 185, 129, 0.9)',
                        fontWeight: '600'
                      }}>{bonus.progress}%</span>
                    </div>
                    
                    <SimpleProgressBar 
                      progress={bonus.progress}
                      size="md"
                      className="w-full"
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span style={{
                        color: 'rgba(139, 92, 246, 0.8)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px'
                      }}>Time remaining: {bonus.remaining}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
