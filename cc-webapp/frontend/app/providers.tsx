'use client';

import React from 'react';
import { FeedbackProvider } from '../contexts/FeedbackContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
  // 주의: GlobalStoreProvider / EnsureHydrated / RealtimeSyncProvider / ToastProvider 는 App.tsx 내부에서 구성됩니다.
  <FeedbackProvider>{children}</FeedbackProvider>
  );
}
