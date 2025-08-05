'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onNavigateToAdminPanel: () => void;
  onNavigateToEventMissionPanel: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  onAddNotification: (message: string) => void;
}

export function SideMenu({
  isOpen,
  onClose,
  user,
  onNavigateToAdminPanel,
  onNavigateToEventMissionPanel,
  onNavigateToSettings,
  onLogout,
  onAddNotification
}: SideMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* 사이드 메뉴 */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed right-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-l border-cyan-400/30 z-50 p-6"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-cyan-100">메뉴</h2>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              onNavigateToSettings();
              onClose();
            }}
            className="w-full text-left px-4 py-3 text-cyan-100 hover:bg-cyan-500/20 rounded-lg transition-colors"
          >
            ⚙️ 설정
          </button>
          
          <button
            onClick={() => {
              onNavigateToAdminPanel();
              onClose();
            }}
            className="w-full text-left px-4 py-3 text-cyan-100 hover:bg-cyan-500/20 rounded-lg transition-colors"
          >
            👑 관리자 패널
          </button>
          
          <button
            onClick={() => {
              onNavigateToEventMissionPanel();
              onClose();
            }}
            className="w-full text-left px-4 py-3 text-cyan-100 hover:bg-cyan-500/20 rounded-lg transition-colors"
          >
            🎯 이벤트 & 미션
          </button>
          
          <div className="border-t border-gray-700 my-4"></div>
          
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            🚪 로그아웃
          </button>
        </div>
      </motion.div>
    </>
  );
}
