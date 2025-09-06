'use client';

import React from 'react';

interface AdminPanelProps {
  user: any;
  onBack: () => void;
  onUpdateUser: (user: any) => void;
  onAddNotification: (message: string) => void;
}

export function AdminPanel({
  user,
  onBack,
  onUpdateUser,
  onAddNotification,
}: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← 뒤로 가기
          </button>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">관리자 패널</h2>
          <p className="text-gray-300">관리자 기능이 구현될 예정입니다.</p>
          
          <div className="mt-6">
            <button
              onClick={() => onAddNotification('관리자 패널에서 알림 테스트')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              알림 테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
