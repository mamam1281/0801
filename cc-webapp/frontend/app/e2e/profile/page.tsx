'use client';

import React from 'react';
import { ProfileScreen } from '@/components/ProfileScreen';

export default function E2EProfilePage() {
  return (
    <ProfileScreen
      onBack={() => {}}
      onAddNotification={() => {}}
      retryEnabled={false}
      maxRetries={0}
      retryDelayMs={0}
    />
  );
}
