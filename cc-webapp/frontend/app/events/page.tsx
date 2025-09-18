"use client";
import { eventMissionApi } from '@/utils/eventMissionApi';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Gift, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { EventUnified } from '../../types/events';
import { adaptEvents, formatEventPeriod, isJoinDisabled, showStatusBadge, summarizeRewards } from '../../utils/eventAdapter';

// (기존 임시 호환 타입 제거: EventUnified 기반으로 정리)

export default function EventsPage() {
  const [events, setEvents] = useState([] as EventUnified[]);
  const [loading, setLoading] = useState(false as any);
  const [error, setError] = useState(null as any);

  // Period / reward 표기는 adapter 헬퍼 사용

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
  const list = await eventMissionApi.events.getAll();
  setEvents(adaptEvents(Array.isArray(list) ? list : []));
    } catch (e:any) {
      setError(e?.message || '이벤트 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = async (id: number) => {
    const snapshot = events;
    // 낙관적 업데이트: 참여 정보 추가
  setEvents((prev: EventUnified[]) => prev.map((e: EventUnified) => e.id === id ? {
      ...e,
      participation: e.participation ?? {
        id: undefined,
        progress: 0,
        status: 'joined',
        claimed: false,
        rewardGranted: false,
        rewardAmount: null
      },
      participationCount: (e.participationCount ?? 0) + (e.participation ? 0 : 1)
    } : e));
    try {
      await eventMissionApi.events.join(id);
      // 서버 authoritative 데이터 재동기화
      await load();
    } catch (e:any) {
      // 롤백
      setEvents(snapshot);
      setError(e?.message || '이벤트 참여에 실패했습니다');
    }
  };

  const claim = async (id: number) => {
    const snapshot = events;
    // 낙관적 상태: claimed true 지정
  setEvents((prev: EventUnified[]) => prev.map((e: EventUnified) => e.id === id ? {
      ...e,
      participation: e.participation ? { ...e.participation, claimed: true, status: 'claimed' } : e.participation
    } : e));
    try {
      await eventMissionApi.events.claimRewards(id);
      await load();
    } catch (e:any) {
      setEvents(snapshot);
      setError(e?.message || '보상 수령에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 data-testid="events-title" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">이벤트</h1>
          <button data-testid="events-refresh" onClick={load} className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm">
            <RefreshCw className="h-4 w-4" />
            <span>새로고침</span>
          </button>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-gray-400">불러오는 중...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">진행 중인 이벤트가 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {events.map((ev: EventUnified) => {
              const title = ev.title || `이벤트 #${ev.id}`;
              const participation = ev.participation;
              const joined = !!participation && (participation.status === 'joined' || participation.status === 'claimed' || participation.claimed);
              const claimed = !!participation?.claimed;
              const completed = claimed || participation?.status === 'completed';
              const disableJoin = isJoinDisabled(ev) || joined;
              const disableClaim = !joined || claimed;
              const extraStatus = showStatusBadge(ev);
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                        {claimed && (
                          <span data-testid={`event-${ev.id}-claimed-badge`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-300 border border-green-700">
                            <CheckCircle className="h-3 w-3" /> 수령완료
                          </span>
                        )}
                        {!claimed && joined && (
                          <span data-testid={`event-${ev.id}-joined-badge`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-900/40 text-blue-300 border border-blue-700">참여중</span>
                        )}
                        {!joined && extraStatus && (
                          <span data-testid={`event-${ev.id}-status-badge`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${extraStatus.className}`}>{extraStatus.label}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{ev.description || ''}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{formatEventPeriod(ev)}</span></div>
                        <div className="flex items-center gap-2"><Gift className="h-4 w-4" /><span>{summarizeRewards(ev)}</span></div>
                      </div>
                      {participation && (
                        <div className="mt-2 text-xs text-gray-400 flex gap-3">
                          <span>진행도: {participation.progress}</span>
                          {participation.rewardGranted && <span className="text-emerald-400">보상확정</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!joined && (
                        <button
                          data-testid={`event-${ev.id}-join-btn`}
                          disabled={disableJoin}
                          onClick={() => !disableJoin && join(Number(ev.id))}
                          className={`px-3 py-2 rounded-lg text-sm ${disableJoin ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                          {ev.status === 'pending' ? '준비중' : (ev.status === 'ended' ? '종료됨' : '참여하기')}
                        </button>
                      )}
                      {joined && !claimed && (
                        <button
                          data-testid={`event-${ev.id}-claim-btn`}
                          disabled={disableClaim}
                          onClick={() => !disableClaim && claim(Number(ev.id))}
                          className={`px-3 py-2 rounded-lg text-sm ${disableClaim ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {completed ? '완료' : '보상 받기'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
