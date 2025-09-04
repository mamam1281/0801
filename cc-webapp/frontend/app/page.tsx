
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import App from './App';

export const metadata = {
  title: 'Home - Casino-Club F2P',
  description: 'Home hub for Casino-Club F2P. Explore games, shop, and your profile.',
};

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) router.replace('/login');
  }, []);
  return <App />;
}
