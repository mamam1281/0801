'use client';

import { Metadata } from 'next';
import AuthPage from '../../components/auth/AuthPage';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
