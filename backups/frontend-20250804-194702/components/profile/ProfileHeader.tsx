'use client';

import type { ProfileHeaderProps } from './types';

export default function ProfileHeader({ user }: ProfileHeaderProps) {

  return (
    <div className="rounded-xl py-6 relative overflow-hidden backdrop-blur-sm border shadow-lg w-full"
      style={{
        paddingLeft: '32px',
        paddingRight: '32px',
        maxWidth: '100% !important',
        width: '100% !important',
        background: 'rgba(15, 15, 35, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}>
      {/* Background decoration - 홈 페이지와 동일한 스타일 */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(218, 145, 158, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(192, 67, 128, 0.06) 0%, transparent 50%)
          `
        }} />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(218, 145, 158, 0.15) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        {/* 중앙 정렬된 단순한 레이아웃 */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* 아바타 - 닉네임 2글자로 복원 */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #DA919E 0%, #C04380 100%)',
                boxShadow: '0 4px 12px rgba(218, 145, 158, 0.3)'
              }}>
              <span className="text-white font-bold text-lg">
                {user.nickname.trim().substring(0, 2)}
              </span>
            </div>
          </div>

          {/* 닉네임만 표시 */}
          <div>
            <h2 className="text-1xl font-bold text-white leading-tight">
              {user.nickname}
            </h2>
          </div>

          {/* 연속 출석 정보 - 하나로 통일 */}
          <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/15 to-pink-500/15 px-6 py-4 rounded-lg border border-orange-400/30">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-400 leading-tight">연속 출석 {user.loginStreak || 8}일째</div>
              <div className="text-base text-orange-300 leading-tight mt-1">6일 더 출석하면 특별 보상!</div>
            </div>
          </div>
        </div>

        {/* 하단 여백만 유지 */}
        <div className="mt-4" />
      </div>
    </div>
  );
}
