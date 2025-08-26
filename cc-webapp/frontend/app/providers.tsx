'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { RealtimeSyncProvider } from '../contexts/RealtimeSyncContext';
import { EnsureHydrated } from '@/lib/sync';
import { GlobalStoreProvider } from '@/store/globalStore';

export function Providers({ children }: { children: React.ReactNode }) {
  // Order: GlobalStoreProvider -> RealtimeSyncProvider -> EnsureHydrated -> ToastProvider -> FeedbackProvider
  return (
    <GlobalStoreProvider>
      <RealtimeSyncProvider>
        <EnsureHydrated>
          <ToastProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </ToastProvider>
        </EnsureHydrated>
      </RealtimeSyncProvider>
    </GlobalStoreProvider>
  );
}
