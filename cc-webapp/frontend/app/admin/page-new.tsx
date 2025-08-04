'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { adminApi } from '../../lib/api-client';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalRewards: number;
    todayActivities: number;
}

interface RecentActivity {
    id: number;
    activity_type: string;
    details: string;
    timestamp: string;
}

const AdminDashboard = () => {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalRewards: 0,
        todayActivities: 0,
    });

    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        // 관리자 권한 체크
        if (!user || !isAdmin) {
            router.push('/auth');
            return;
        }

        fetchDashboardData();
    }, [user, isAdmin, authLoading, router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 실제 API 호출
            const [statsData, activitiesData] = await Promise.all([
                adminApi.getStats(),
                adminApi.getUserActions(),
            ]);

            setStats(statsData);
            setActivities(activitiesData.slice(0, 10)); // 최근 10개만 표시

        } catch (fetchError) {
            console.error('관리자 데이터 로드 실패:', fetchError);
            setError('데이터를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');

            // 임시 fallback 데이터
            setStats({
                totalUsers: 0,
                activeUsers: 0,
                totalRewards: 0,
                todayActivities: 0,
            });
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return '방금 전';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'LOGIN': return '🔐';
            case 'GAME_PLAY': return '🎮';
            case 'REWARD_RECEIVED': return '🎁';
            case 'SIGNUP': return '👤';
            case 'PURCHASE': return '💳';
            default: return '📋';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-red-600/20 border border-red-600 text-red-400 p-6 rounded-lg max-w-md">
                    <h3 className="font-bold mb-2">데이터 로드 실패</h3>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white admin-main-dashboard" style={{ width: '100vw', maxWidth: 'none', margin: 0, padding: 0 }}>
            {/* Compact Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">관리자 대시보드</h1>
                    <p className="text-gray-400 text-sm">시스템 현황 및 사용자 관리 - 실제 API 연동</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                    <p>관리자: {user?.nickname}</p>
                    <p>{new Date().toLocaleDateString('ko-KR')} {new Date().toLocaleTimeString('ko-KR')}</p>
                </div>
            </div>

            {/* Compact Stats Grid - 4개 통계를 전체 너비에 균등 배치 */}
            <div className="grid grid-cols-4 gap-6" style={{ width: '100%', maxWidth: 'none', padding: '16px 24px' }}>
                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs">전체 사용자</p>
                            <p className="text-xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</p>
                        </div>
                        <span className="text-2xl">👥</span>
                    </div>
                </div>

                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs">활성 사용자</p>
                            <p className="text-xl font-bold mt-1">{stats.activeUsers.toLocaleString()}</p>
                        </div>
                        <span className="text-2xl">📈</span>
                    </div>
                </div>

                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs">총 토큰</p>
                            <p className="text-xl font-bold mt-1">{stats.totalRewards.toLocaleString()}</p>
                        </div>
                        <span className="text-2xl">🏆</span>
                    </div>
                </div>

                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs">오늘 활동</p>
                            <p className="text-xl font-bold mt-1">{stats.todayActivities.toLocaleString()}</p>
                        </div>
                        <span className="text-2xl">⚡</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid - 전체 너비 활용을 위한 flex 레이아웃 */}
            <div className="pb-4 flex gap-6 h-[calc(100vh-180px)]" style={{ width: '100%', maxWidth: 'none', padding: '0 24px 16px 24px' }}>
                {/* Quick Actions - 고정 너비 */}
                <div className="bg-gray-800 rounded border border-gray-700 p-4 w-80 flex-shrink-0">
                    <h2 className="text-lg font-bold mb-3">빠른 작업</h2>
                    <div className="space-y-2">
                        <Link href="/admin/users" className="flex items-center p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer">
                            <span className="text-lg mr-3">👥</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm">사용자 관리</p>
                                <p className="text-xs text-gray-400">사용자 목록 및 상세 정보</p>
                            </div>
                        </Link>

                        <Link href="/admin/rewards" className="flex items-center p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer">
                            <span className="text-lg mr-3">🎁</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm">보상 지급</p>
                                <p className="text-xs text-gray-400">사용자에게 토큰 지급</p>
                            </div>
                        </Link>

                        <Link href="/admin/logs" className="flex items-center p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer">
                            <span className="text-lg mr-3">📊</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm">활동 로그</p>
                                <p className="text-xs text-gray-400">전체 활동 기록 조회</p>
                            </div>
                        </Link>

                        <button
                            onClick={fetchDashboardData}
                            className="flex items-center p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer w-full"
                        >
                            <span className="text-lg mr-3">🔄</span>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">데이터 새로고침</p>
                                <p className="text-xs text-gray-400">최신 데이터 다시 불러오기</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Recent Activities - 나머지 전체 공간 사용 */}
                <div className="flex-1 bg-gray-800 rounded border border-gray-700 p-4">
                    <h2 className="text-lg font-bold mb-3">최근 활동 (실시간 API 데이터)</h2>
                    <div className="overflow-y-auto h-[calc(100%-40px)]">
                        {activities.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                활동 데이터가 없습니다.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">활동 타입</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">상세</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">시간</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-gray-700">
                                            <td className="px-3 py-2 text-sm">
                                                #{activity.id}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center text-sm">
                                                    <span className="mr-2">{getActivityIcon(activity.activity_type)}</span>
                                                    {activity.activity_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-400 max-w-xs truncate">
                                                {activity.details || 'N/A'}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-400">
                                                {formatTime(activity.timestamp)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
