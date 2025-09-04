
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import App from '../App';

export const metadata = {
  title: 'Shop - Casino-Club F2P',
  description: 'Browse and purchase in-game items in the Casino-Club F2P shop.',
};

export default function ShopPage() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) router.replace('/login');
  }, []);
  return <App />;
}
