'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { RealtimeSyncProvider } from '../contexts/RealtimeSyncContext';
import { EnsureHydrated } from '@/lib/sync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RealtimeSyncProvider>
        <EnsureHydrated>
          <FeedbackProvider>{children}</FeedbackProvider>
        </EnsureHydrated>
      </RealtimeSyncProvider>
    </ToastProvider>
  );
}
