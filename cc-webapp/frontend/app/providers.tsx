'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { EnsureHydrated } from '@/lib/sync';
import { RealtimeSyncProvider } from '../contexts/RealtimeSyncContext';
import { GlobalStoreProvider } from '@/store/globalStore';

export function Providers({ children }: { children: React.ReactNode }) {
  // 런타임 가드: import 실패 시 원인 파악을 돕기 위한 안전장치
  if (process.env.NODE_ENV !== 'production') {
    const missing: string[] = [];
    if (!(GlobalStoreProvider as any)) missing.push('GlobalStoreProvider(@/store/globalStore)');
    if (!(ToastProvider as any)) missing.push('ToastProvider(@/components/NotificationToast)');
    if (!(EnsureHydrated as any)) missing.push('EnsureHydrated(@/lib/sync)');
    if (!(RealtimeSyncProvider as any)) missing.push('RealtimeSyncProvider(../contexts/RealtimeSyncContext)');
    if (!(FeedbackProvider as any)) missing.push('FeedbackProvider(../contexts/FeedbackContext)');
    if (missing.length) {
      // eslint-disable-next-line no-console
      console.error('[Providers] 구성 요소 import 실패:', missing);
    }
  }
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
