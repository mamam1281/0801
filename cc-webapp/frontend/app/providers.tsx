'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';
import { FeedbackProvider } from '../contexts/FeedbackContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ToastProvider>
  );
}
