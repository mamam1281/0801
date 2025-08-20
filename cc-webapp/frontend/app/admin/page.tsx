'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/simpleApi';
import { AdminPanel } from '@/components/AdminPanel';
import { motion } from 'framer-motion';

interface ProfileMe {
  id: number;
  nickname: string;
  vip_points: number;
  is_admin: boolean;
}

interface CoreStatsDto {
  total_users: number;
  active_users: number;
  online_users: number;
  total_revenue: number;
  today_revenue: number;
  critical_alerts: number;
  pending_actions: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState(null as any as ProfileMe | null);
  const [coreStats, setCoreStats] = useState(null as any as CoreStatsDto | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as any as string | null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const profile = await apiGet<ProfileMe>('/api/auth/me');
      if (!profile.is_admin) {
        router.replace('/');
        return;
      }
      setMe(profile);
      try {
        // 백엔드 확장 통계 (/api/admin/stats) : 모든 필드 서버 계산/캐시 5s
        const stats = await apiGet<any>('/api/admin/stats');
        setCoreStats({
          total_users: stats.total_users ?? stats.totalUsers ?? 0,
          active_users: stats.active_users ?? stats.activeUsers ?? 0,
          online_users: stats.online_users ?? stats.onlineUsers ?? 0,
          total_revenue: stats.total_revenue ?? stats.totalRevenue ?? 0,
          today_revenue: stats.today_revenue ?? stats.todayRevenue ?? 0,
          critical_alerts: stats.critical_alerts ?? stats.criticalAlerts ?? 0,
          pending_actions: stats.pending_actions ?? stats.pendingActions ?? 0,
        });
      } catch (e:any) {
        setCoreStats({
          total_users: 0,
          active_users: 0,
          online_users: 0,
          total_revenue: 0,
          today_revenue: 0,
          critical_alerts: 0,
          pending_actions: 0,
        });
      }
    } catch (e:any) {
      setError(e.message || '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading admin...</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">관리자 페이지 로드 오류: {error}</p>
        <button onClick={load} className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm">재시도</button>
      </div>
    );
  }
  if (!me) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={()=>router.push('/')} className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs">홈으로</button>
            <button onClick={load} className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs">새로고침</button>
          </div>
        </header>
        <div className="mb-4 text-xs text-gray-500">로그인: {me.nickname} (관리자)</div>
        <AdminPanel
          user={{ id: me.id, nickname: me.nickname } as any}
          onBack={()=>router.push('/')}
          onUpdateUser={()=>{}}
          onAddNotification={()=>{}}
          coreStats={coreStats || undefined}
          loadingStats={loading}
          statsError={error}
        />
      </div>
    </motion.div>
  );
}
