'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  Gift, 
  TrendingUp,
  Trophy,
  Clock,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/basic/card';
import { Button } from '../../components/ui/basic/button';

export default function NotificationsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'system'>('all');

  // 가상 알림 데이터
  const notificationsData = {
    unreadCount: 5,
    notifications: [
      { 
        id: 1, 
        type: 'game', 
        title: '게임 승리!', 
        message: '가위바위보에서 승리하여 150 CC를 획득하셨습니다.', 
        time: '5분 전', 
        isRead: false,
        icon: TrendingUp,
        color: 'text-emerald-400'
      },
      { 
        id: 2, 
        type: 'bonus', 
        title: '출석 보상', 
        message: '일일 출석으로 50 CC 보너스를 받으셨습니다.', 
        time: '1시간 전', 
        isRead: false,
        icon: Gift,
        color: 'text-purple-400'
      },
      { 
        id: 3, 
        type: 'achievement', 
        title: '업적 달성!', 
        message: '연속 승리 5회 달성으로 특별 배지를 획득하셨습니다.', 
        time: '2시간 전', 
        isRead: false,
        icon: Trophy,
        color: 'text-amber-400'
      },
      { 
        id: 4, 
        type: 'system', 
        title: '시스템 점검 안내', 
        message: '내일 새벽 2시부터 4시까지 시스템 점검이 예정되어 있습니다.', 
        time: '6시간 전', 
        isRead: true,
        icon: Settings,
        color: 'text-blue-400'
      },
      { 
        id: 5, 
        type: 'game', 
        title: '베팅 결과', 
        message: '룰렛 게임에서 25 CC를 베팅하셨습니다.', 
        time: '1일 전', 
        isRead: true,
        icon: Clock,
        color: 'text-gray-400'
      },
      { 
        id: 6, 
        type: 'bonus', 
        title: '주간 미션 완료', 
        message: '주간 미션을 완료하여 200 CC를 획득하셨습니다.', 
        time: '2일 전', 
        isRead: true,
        icon: Gift,
        color: 'text-purple-400'
      }
    ]
  };

  const filteredNotifications = notificationsData.notifications.filter(notification => {
    if (selectedTab === 'unread') return !notification.isRead;
    if (selectedTab === 'system') return notification.type === 'system';
    return true;
  });

  const markAsRead = (id: number) => {
    // 실제 구현에서는 상태 업데이트 로직 추가
    console.log(`Notification ${id} marked as read`);
  };

  const markAllAsRead = () => {
    console.log('All notifications marked as read');
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

      <div className="max-w-md mx-auto p-4 space-y-6 relative z-10 pt-20">
        
        {/* 프리미엄 헤더 */}
        <motion.div 
          className="text-center py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-white mb-0 tracking-tight" style={{ fontSize: '30px', fontWeight: '900' }}>
            🔔 알림 센터
          </h1>
          {notificationsData.unreadCount > 0 && (
            <p className="text-purple-400 mt-2" style={{ fontSize: '14px' }}>
              읽지 않은 알림 {notificationsData.unreadCount}개
            </p>
          )}
        </motion.div>

        {/* 탭 네비게이션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex rounded-xl p-1"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {[
            { key: 'all', label: '전체' },
            { key: 'unread', label: '읽지 않음' },
            { key: 'system', label: '시스템' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedTab === tab.key
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* 모두 읽음 버튼 */}
        {notificationsData.unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-end"
          >
            <button
              onClick={markAllAsRead}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              모두 읽음 처리
            </button>
          </motion.div>
        )}

        {/* 알림 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3"
        >
          {filteredNotifications.map((notification, index) => {
            const IconComponent = notification.icon;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                  !notification.isRead ? 'border-l-4 border-purple-500' : ''
                }`}
                style={{
                  background: notification.isRead 
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)'
                    : 'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                }}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{
                         background: `linear-gradient(145deg, ${notification.color.replace('text-', 'rgba(').replace('-400', ', 0.2)')} 0%, ${notification.color.replace('text-', 'rgba(').replace('-400', ', 0.1)')} 100%)`,
                         border: `1px solid ${notification.color.replace('text-', 'rgba(').replace('-400', ', 0.3)')}`
                       }}>
                    <IconComponent size={20} className={notification.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: notification.isRead ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap'
                      }}>{notification.title}</h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: notification.isRead ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                      fontFamily: "'Inter', sans-serif",
                      marginTop: '4px',
                      lineHeight: '1.4'
                    }}>{notification.message}</p>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      whiteSpace: 'nowrap'
                    }}>
                      <Clock size={12} />
                      {notification.time}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-8"
          >
            <Bell size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">알림이 없습니다.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
