'use client';

import React from 'react';
import { ToastProvider } from '@/components/NotificationToast';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
