'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import MissionCards from './MissionCards';
import ProfileActions from './ProfileActions';
import type { User, ProfileContainerProps, Mission } from './types';
import '../../styles/profile-mobile.css';

// 420×750 모바일 최적화 프로필 컨테이너
export default function ProfileContainerMobile(props: ProfileContainerProps) {
  const [user, setUser] = useState<User>({
    id: 1,
    nickname: "Player123",
    cyber_token_balance: 15420,
    level: 15,
    experience: 2350,
    experienceRequired: 4000,
    tokens: 145,
    wins: 68,
    loginStreak: 7
  });

  const [missions, setMissions] = useState<Mission[]>([
    {
      id: "1",
      title: "데일리 로그인",
      description: "매일 접속하여 보상 받기",
      progress: 1,
      target: 1,
      reward: { type: "coins", amount: 50 },
      isCompleted: false,
      type: "DAILY"
    },
    {
      id: "2",
      title: "게임 3회 플레이",
      description: "어떤 게임이든 3회 플레이하기",
      progress: 2,
      target: 3,
      reward: { type: "coins", amount: 100 },
      isCompleted: false,
      type: "DAILY"
    }
  ]);

  return (
    <div className="profile-mobile-layout">
      <div className="w-full">
        <div className="profile-mobile-header">
          <ProfileHeader user={user} />
        </div>
        
        <div className="profile-mobile-stats">
          <ProfileStats user={user} />
        </div>
        
        <div className="profile-mobile-missions">
          <MissionCards missions={missions} />
        </div>
        
        <div className="profile-mobile-actions">
          <ProfileActions />
        </div>
      </div>
    </div>
  );
}
