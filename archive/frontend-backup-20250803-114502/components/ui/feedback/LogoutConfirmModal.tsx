'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '../basic/button';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const handleLogout = () => {
    // 실제 로그아웃 로직 (토큰 삭제, 상태 초기화 등)
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    onConfirm();
    onClose();
  };

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div 
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: 'linear-gradient(145deg, rgba(26,26,26,0.98) 0%, rgba(20,20,35,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {/* 아이콘 */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
              </div>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-white text-center mb-2">
                로그아웃 하시겠습니까?
              </h2>

              {/* 메시지 */}
              <p className="text-gray-400 text-center mb-6 text-sm leading-relaxed">
                현재 진행 중인 게임이 저장되지 않을 수 있습니다.<br />
                정말로 로그아웃 하시겠습니까?
              </p>

              {/* 버튼들 */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                >
                  취소
                </Button>
                <Button 
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <LogOut size={16} className="mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogoutConfirmModal;
