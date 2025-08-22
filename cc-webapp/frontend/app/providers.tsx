'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { RealtimeSyncProvider } from '../contexts/RealtimeSyncContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RealtimeSyncProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </RealtimeSyncProvider>
    </ToastProvider>
  );
}
