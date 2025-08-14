"use client";
import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';

type Props = { userId: number; baseUrl: string };

export function NotificationSettings({ userId, baseUrl }: Props) {
  const { showUnreadOnly, setShowUnreadOnly, muteTypes, setMuteTypes, preferSSE, setPreferSSE } = useNotifications({ userId, baseUrl });

  const toggleMute = (t: string) => {
    const next = new Set(muteTypes);
    if (next.has(t)) next.delete(t); else next.add(t);
    setMuteTypes(next);
  };

  const types = ['info', 'success', 'warning', 'error'];

  const requestPushPermission = async () => {
    try {
      if (!('Notification' in window)) return;
      // 브라우저 권한 요청
      const res = await Notification.requestPermission();
      console.log('Push permission:', res);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input id="unreadOnly" type="checkbox" checked={showUnreadOnly} onChange={(e: any) => setShowUnreadOnly((e.target as HTMLInputElement).checked)} />
        <label htmlFor="unreadOnly">읽지 않은 항목만 보기</label>
      </div>

      <div className="space-y-2">
        <div className="text-sm opacity-80">음소거 타입</div>
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => toggleMute(t)} className={`px-2 py-1 rounded border text-xs ${muteTypes.has(t) ? 'bg-slate-800 border-slate-600 opacity-60' : 'bg-slate-700 border-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input id="sseToggle" type="checkbox" checked={!!preferSSE} onChange={(e: any) => setPreferSSE((e.target as HTMLInputElement).checked)} />
        <label htmlFor="sseToggle">SSE 우선 사용 (웹소켓 대신)</label>
      </div>

      <div>
        <button onClick={requestPushPermission} className="rounded px-3 py-2 border">브라우저 푸시 권한 요청</button>
      </div>
    </div>
  );
}
