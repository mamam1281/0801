'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';
// 주의: GlobalStoreProvider/EnsureHydrated/RealtimeSyncProvider는 App.tsx 내부에서 구성됩니다.
// 여기서는 UI 전용 상위 프로바이더만 유지합니다(SSR에서 Store 훅이 호출되지 않도록 보장).

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
  <FeedbackProvider>{children}</FeedbackProvider>
    </ToastProvider>
  );
}
