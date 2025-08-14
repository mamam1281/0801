"use client";
import React from "react";
import { NotificationSettings } from "@/components/NotificationSettings";

function decodeJwt(token: string): any {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch { return null; }
}

export default function NotificationSettingsPage() {
  const [userId, setUserId] = React.useState(1 as number);
  const baseUrl = React.useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000', []);
  React.useEffect(() => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token') || '';
      const p = token ? decodeJwt(token) : null;
      const uid = p?.sub || p?.user_id || p?.uid;
      if (uid && !Number.isNaN(Number(uid))) setUserId(Number(uid));
    } catch {}
  }, []);
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-4">알림 설정</h1>
      <p className="opacity-70 mb-8">사용자 {userId}의 알림 환경을 조정합니다.</p>
      <NotificationSettings userId={userId} baseUrl={baseUrl} />
    </main>
  );
}
