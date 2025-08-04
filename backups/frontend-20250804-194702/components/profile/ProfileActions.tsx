'use client';

import { Settings, ExternalLink } from 'lucide-react';
import type { ProfileActionsProps } from './types';

export default function ProfileActions({ onLogout }: ProfileActionsProps) {
  const handleSettings = () => {
    console.log('Opening settings...');
    // Navigate to settings page
  };

  const handleVisitSite = () => {
    console.log('Visiting main site...');
    // Open main company site
    window.open('https://casinoclub.com', '_blank');
  };

  return (
    <div className="space-y-4">
      {/* 본사 사이트 바로가기 - 개선된 단일 버튼 */}
      <div className="rounded-xl p-8 relative overflow-hidden bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 shadow-lg w-full"
           style={{ 
             maxWidth: '100% !important',
             width: '100% !important',
             padding: '32px !important'
           }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-900/30 pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full 
                         flex items-center justify-center mx-auto shadow-lg border-2 border-emerald-400/30">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">공식 사이트</h3>
            <p className="text-sm text-gray-300">카지노클럽 본사 사이트로 이동</p>
          </div>
          
          <button
            onClick={handleVisitSite}
            className="w-full h-12 rounded-lg text-white font-bold transform hover:scale-105 active:scale-95 transition-all duration-200
                       shadow-lg hover:shadow-xl"
            style={{ 
              background: 'linear-gradient(to right, #059669, #0d9488)',
              border: '2px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #14b8a6)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #059669, #0d9488)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
            }}
          >
            본사 사이트 바로가기
          </button>
        </div>
      </div>
    </div>
  );
}
