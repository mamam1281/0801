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
      <EnsureHydrated>
        <RealtimeSyncProvider>
          <ToastProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </ToastProvider>
        </RealtimeSyncProvider>
      </EnsureHydrated>
    </GlobalStoreProvider>
  );
}
