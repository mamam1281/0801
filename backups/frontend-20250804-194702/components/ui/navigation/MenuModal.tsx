'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Home, 
  Gamepad2,
  MessageCircle,
  User,
  Settings,
  Bell,
  Gift,
  Trophy,
  ChevronRight
} from 'lucide-react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: '홈', path: '/', color: 'text-blue-400' },
    { icon: Gamepad2, label: '게임', path: '/games', color: 'text-green-400' },
    { icon: MessageCircle, label: '내역', path: '/wallet', color: 'text-yellow-400' },
    { icon: User, label: '프로필', path: '/profile', color: 'text-purple-400' },
    { icon: Bell, label: '알림', path: '/notifications', color: 'text-amber-400' },
    { icon: Gift, label: '프로모션', path: '/promotions', color: 'text-pink-400' },
    { icon: Trophy, label: '리워드', path: '/rewards', color: 'text-orange-400' },
    { icon: Settings, label: '설정', path: '/settings', color: 'text-gray-400' }
  ];

  const quickActions = [
    { icon: Gift, label: '일일 보너스', action: () => console.log('Daily bonus') },
    { icon: Trophy, label: '업적', action: () => console.log('Achievements') }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* 사이드바 메뉴 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-80 z-50"
            style={{
              background: 'linear-gradient(145deg, rgba(10,10,10,0.98) 0%, rgba(26,26,46,0.98) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.3)'
            }}
          >
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">메뉴</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* 사용자 정보 카드 - 콤팩트 버전 */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">플레이어</h3>
                    <p className="text-gray-400 text-xs">레벨 15 • VIP 실버</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">2,450</p>
                    <p className="text-xs text-gray-400">토큰</p>
                  </div>
                </div>
              </div>

              {/* 메인 메뉴 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    메인 메뉴
                  </h3>
                  <div className="space-y-1">
                    {menuItems.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <motion.button
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                        >
                          <IconComponent size={20} className={`${item.color} group-hover:scale-110 transition-transform`} />
                          <span className="text-white group-hover:text-white/90 font-medium flex-1 text-left">
                            {item.label}
                          </span>
                          <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-400 transition-colors" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 빠른 액션 */}
                <div className="p-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    빠른 액션
                  </h3>
                  <div className="space-y-1">
                    {quickActions.map((action, index) => {
                      const IconComponent = action.icon;
                      return (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (menuItems.length + index) * 0.05 }}
                          onClick={action.action}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                        >
                          <IconComponent 
                            size={20} 
                            className="text-gray-400 group-hover:scale-110 transition-transform" 
                          />
                          <span className="text-white group-hover:text-white/90 font-medium flex-1 text-left">
                            {action.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 푸터 */}
              <div className="p-4 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center">
                  Cosmic Casino v1.0.0
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuModal;
