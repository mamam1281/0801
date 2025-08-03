'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import MissionCards from './MissionCards';
import ProfileActions from './ProfileActions';
import type { User, ProfileContainerProps, Mission } from './types';
import '../../styles/profile-mobile.css';

export default function ProfileContainer({ className = '' }: ProfileContainerProps) {
  
  // Mock user data
  const [user] = useState<User>({
    id: 1,
    nickname: 'GameMaster',
    cyber_token_balance: 1500,
    rank: 'PREMIUM',
    level: 15,
    experience: 750,
    experienceRequired: 1000,
    wins: 42,
    loginStreak: 8,
    completedMissions: 23,
    email: 'user@example.com'
  });

  // Mock missions data
  const [missions] = useState<Mission[]>([
    {
      id: 'daily-1',
      title: '슬롯 게임 5회 플레이',
      description: '어떤 슬롯 게임이든 5회 플레이하세요',
      type: 'DAILY',
      progress: 3,
      target: 5,
      reward: { type: 'TOKEN', amount: 100 },
      isCompleted: false,
      timeLeft: '8시간 후 초기화'
    },
    {
      id: 'weekly-1',
      title: '주간 승리 목표',
      description: '이번 주에 10번 승리하세요',
      type: 'WEEKLY',
      progress: 7,
      target: 10,
      reward: { type: 'TOKEN', amount: 500 },
      isCompleted: false,
      timeLeft: '3일 남음'
    },
    {
      id: 'special-1',
      title: '럭키 잭팟 이벤트',
      description: '잭팟 게임에서 큰 상금을 획득하세요',
      type: 'SPECIAL',
      progress: 0,
      target: 1,
      reward: { type: 'SPECIAL', amount: 1000 },
      isCompleted: false,
      timeLeft: '이벤트 종료까지 5일'
    }
  ]);

  const handleLogout = () => {
    console.log('Logging out...');
    // Handle logout logic - 제거됨
  };

  const handleMissionClick = (mission: Mission) => {
    console.log('Mission clicked:', mission.title);
    // Handle mission interaction
  };

  const handleVisitSite = () => {
    console.log('Visiting main site...');
    window.open('https://casinoclub.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* 420px 모바일 최적화 컨테이너 */}
      <div className="w-full max-w-sm min-h-screen mx-auto px-4 pt-6 pb-8 
                      overflow-y-auto overscroll-y-contain
                      scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
           style={{ maxWidth: '420px' }}>

        {/* 메인 컨텐츠 - 더 넓은 간격 */}
        <main className="space-y-8">
          {/* 프로필 헤더 */}
          <section>
            <ProfileHeader user={user} />
          </section>

          {/* 프로필 통계 및 빠른 액션 */}
          <section>
            <ProfileStats user={user} />
          </section>

          {/* 미션 카드 섹션 */}
          <section>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white px-4">오늘의 미션</h3>
              <MissionCards 
                missions={missions}
                onMissionClick={handleMissionClick}
                onVisitSite={handleVisitSite}
              />
            </div>
          </section>

          {/* 프로필 액션 버튼들 */}
          <section>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white px-4">빠른 액션</h3>
              <ProfileActions />
            </div>
          </section>
        </main>

        {/* 하단 여백 - 스크롤 공간 확보 */}
        <div className="h-8" />
      </div>

      {/* 데일리 체크인 모달은 글로벌 컴포넌트로 이동했습니다 */}
    </div>
  );
}
