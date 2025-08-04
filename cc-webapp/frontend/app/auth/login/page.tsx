'use client';

import AuthPage from '../../../components/auth/AuthPage';
import '../../../styles/auth.css';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
