'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // 주의: GlobalStoreProvider / EnsureHydrated / RealtimeSyncProvider 는 App.tsx 내부에서 구성됩니다.
    // ToastProvider는 상단에서 전역으로 유지하여 RealtimeSyncContext 등에서 useToast 사용 가능.
    <ToastProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ToastProvider>
  );
}
