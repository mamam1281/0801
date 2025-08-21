"use client";
import React, { useEffect, useState } from 'react';
import adminEventsApi from '../../../utils/adminEventsApi';

interface AdminEventForm {
  title: string;
  description: string;
  event_type: string;
  requirements_json: string;
  rewards_json: string;
  start_date: string;
  end_date: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([] as any[]);
  const [loading, setLoading] = useState(false as boolean);
  const [error, setError] = useState(null as string | null);
  const [log, setLog] = useState('');
  const [selectedId, setSelectedId] = useState(null as number | null);
  const [participations, setParticipations] = useState(null as any[] | null);
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0,16); // YYYY-MM-DDTHH:MM
  const [form, setForm] = useState({
    title: '모델 지민 이벤트',
    description: '모델 지민 포인트를 모아 보상을 획득',
    event_type: 'model_index',
    requirements_json: JSON.stringify({ model_index_points: 1000 }, null, 2),
    rewards_json: JSON.stringify({ gold: 5000, exp: 1000 }, null, 2),
    start_date: iso(now),
    end_date: iso(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14)),
  } as AdminEventForm);

  const appendLog = (m: string) =>
    setLog((l: string) => `${new Date().toLocaleTimeString()} ${m}\n` + l);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminEventsApi.list();
      if (Array.isArray(list)) setEvents(list);
    } catch (e: any) {
      setError(e.message);
      appendLog('목록 로드 실패');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const change = (k: keyof AdminEventForm, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const create = async () => {
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        requirements: JSON.parse(form.requirements_json || '{}'),
        rewards: JSON.parse(form.rewards_json || '{}'),
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
      };
      const res = await adminEventsApi.create(payload);
      appendLog(`생성 완료 id=${res.id}`);
      load();
    } catch (e: any) {
      appendLog('생성 실패: ' + e.message);
    }
  };

  const deactivate = async (id: number) => {
    try {
      await adminEventsApi.deactivate(id);
      appendLog(`비활성화 id=${id}`);
      load();
    } catch (e: any) {
      appendLog('비활성화 실패');
    }
  };
  const seedModelIndex = async () => {
    try {
      await adminEventsApi.seedModelIndex();
      appendLog('모델 지민 seed 실행');
      load();
    } catch (e: any) {
      appendLog('seed 실패');
    }
  };
  const viewParticipations = async (id: number) => {
    try {
      const p = await adminEventsApi.participations(id);
      setSelectedId(id);
      setParticipations(p);
    } catch (e: any) {
      appendLog('참여자 조회 실패');
    }
  };
  const forceClaim = async (id: number, userIdRaw: string) => {
    const userId = parseInt(userIdRaw, 10);
    if (isNaN(userId)) {
      appendLog('user id 숫자 오류');
      return;
    }
    try {
      await adminEventsApi.forceClaim(id, userId);
      appendLog(`강제 보상 event=${id} user=${userId}`);
      load();
    } catch (e: any) {
      appendLog('강제 보상 실패');
    }
  };

  return (
    <div className="p-6 space-y-6 text-sm text-pink-100">
      <h1 className="text-2xl font-semibold mb-2">Admin Events</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-semibold">새 이벤트 생성</h2>
          <input
            className="w-full bg-black/30 p-2"
            value={form.title}
            onChange={(e: any) => change('title', e.target.value)}
            placeholder="제목"
          />
          <textarea
            className="w-full bg-black/30 p-2"
            rows={2}
            value={form.description}
            onChange={(e: any) => change('description', e.target.value)}
            placeholder="설명"
          />
          <input
            className="w-full bg-black/30 p-2"
            value={form.event_type}
            onChange={(e: any) => change('event_type', e.target.value)}
            placeholder="event_type"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs flex flex-col">
              시작
              <input
                type="datetime-local"
                className="bg-black/30 p-1"
                value={form.start_date}
                onChange={(e: any) => change('start_date', e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col">
              종료
              <input
                type="datetime-local"
                className="bg-black/30 p-1"
                value={form.end_date}
                onChange={(e: any) => change('end_date', e.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs mb-1">요구치(JSON)</div>
              <textarea
                className="w-full bg-black/30 p-2 text-xs h-28"
                value={form.requirements_json}
                onChange={(e: any) => change('requirements_json', e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs mb-1">보상(JSON)</div>
              <textarea
                className="w-full bg-black/30 p-2 text-xs h-28"
                value={form.rewards_json}
                onChange={(e: any) => change('rewards_json', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-3 py-2 bg-pink-600 rounded">
              생성
            </button>
            <button onClick={seedModelIndex} className="px-3 py-2 bg-indigo-600 rounded">
              모델지민 Seed
            </button>
            <button onClick={load} className="px-3 py-2 bg-gray-700 rounded">
              새로고침
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="font-semibold">이벤트 목록</h2>
          {loading && <div>로딩...</div>}
          {error && <div className="text-red-400">오류: {error}</div>}
          <div className="space-y-2 max-h-[500px] overflow-auto pr-2">
            {events.map((evt: any) => (
              <div
                key={evt.id}
                className="border border-pink-700/40 rounded p-3 space-y-1 bg-black/30"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    #{evt.id} {evt.title}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${evt.is_active ? 'bg-green-700' : 'bg-gray-600'}`}
                  >
                    {evt.is_active ? 'active' : 'inactive'}
                  </span>
                </div>
                <div className="text-xs opacity-80">{evt.description}</div>
                <div className="text-xs flex flex-wrap gap-2">
                  <span>type: {evt.event_type}</span>
                  <span>req: {JSON.stringify(evt.requirements)}</span>
                  <span>rewards: {JSON.stringify(evt.rewards)}</span>
                </div>
                <div className="flex gap-2 flex-wrap mt-1 text-xs">
                  {evt.is_active && (
                    <button
                      onClick={() => deactivate(evt.id)}
                      className="px-2 py-1 bg-yellow-700 rounded"
                    >
                      비활성
                    </button>
                  )}
                  <button
                    onClick={() => viewParticipations(evt.id)}
                    className="px-2 py-1 bg-blue-700 rounded"
                  >
                    참여자
                  </button>
                  <ForceClaimInline eventId={evt.id} onForce={(uid) => forceClaim(evt.id, uid)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {participations && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">참여자 (event {selectedId})</h2>
          <div className="max-h-72 overflow-auto text-xs space-y-1 bg-black/40 p-3 rounded">
            {participations.map((p: any) => (
              <div key={p.id} className="flex gap-3">
                <span>user:{p.user_id}</span>
                <span>progress:{p.progress}</span>
                <span>completed:{String(p.completed)}</span>
                <span>claimed:{String(p.claimed_rewards)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">로그</h2>
        <textarea className="w-full h-40 bg-black/50 p-2 text-xs font-mono" value={log} readOnly />
      </div>
    </div>
  );
}

function ForceClaimInline({ eventId, onForce }: { eventId: number; onForce: (userId: string)=>void }) {
  const [userId, setUserId] = useState('');
  return (
    <div className="flex items-center gap-1">
  <input className="bg-black/40 text-xs px-1 py-0.5 w-20" placeholder="user id" value={userId} onChange={(e:any)=>setUserId(e.target.value)} />
      <button onClick={()=>{ onForce(userId); setUserId(''); }} className="px-2 py-1 bg-purple-700 rounded text-xs">강제보상</button>
    </div>
  );
}
