'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { EnsureHydrated } from '@/lib/sync';
import { RealtimeSyncProvider } from '../contexts/RealtimeSyncContext';
import { GlobalStoreProvider } from '@/store/globalStore';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalStoreProvider>
      <ToastProvider>
        <EnsureHydrated>
          <RealtimeSyncProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </RealtimeSyncProvider>
        </EnsureHydrated>
      </ToastProvider>
    </GlobalStoreProvider>
  );
}
