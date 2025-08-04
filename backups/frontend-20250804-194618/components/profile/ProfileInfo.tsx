'use client';

import { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileActions from './ProfileActions';
import type { User } from './types';

interface ProfileInfoProps {
  user?: User;
  onLogout?: () => void;
}

export default function ProfileInfo({ 
  user,
  onLogout = () => console.log('Logout clicked')
}: ProfileInfoProps) {
  // Mock user data if not provided
  const defaultUser: User = {
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
  };

  const currentUser = user || defaultUser;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <ProfileHeader user={currentUser} />

      {/* Profile Stats */}
      <ProfileStats user={currentUser} />

      {/* Profile Actions */}
      <ProfileActions onLogout={onLogout} />
    </div>
  );
}
