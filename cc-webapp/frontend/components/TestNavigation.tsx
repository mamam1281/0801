'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Settings, TestTube, ExternalLink } from 'lucide-react';

interface TestNavigationProps {
  className?: string;
}

/**
 * 개발/테스트용 네비게이션 도구
 * 프로필 페이지의 다양한 모드를 쉽게 테스트할 수 있도록 지원
 */
export default function TestNavigation({ className = '' }: TestNavigationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const profileRoutes = [
    { 
      label: '프로필 (기본)', 
      path: '/profile', 
      icon: User,
      description: '일반 프로필 보기 모드'
    },
    { 
      label: '프로필 (팝업)', 
      path: '/profile?mode=popup', 
      icon: ExternalLink,
      description: '팝업 최적화 모드'
    },
    { 
      label: '설정', 
      path: '/settings', 
      icon: Settings,
      description: '설정 페이지'
    }
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-all ${className}`}
        title="테스트 네비게이션"
      >
        <TestTube size={20} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border p-4 min-w-[280px] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <TestTube size={16} />
          테스트 네비게이션
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {profileRoutes.map((route) => {
          const Icon = route.icon;
          return (
            <button
              key={route.path}
              onClick={() => handleNavigate(route.path)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-gray-600" />
                <div>
                  <div className="font-medium text-gray-800">{route.label}</div>
                  <div className="text-sm text-gray-500">{route.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          💡 이 도구는 개발/테스트 용도입니다
        </div>
      </div>
    </div>
  );
}
