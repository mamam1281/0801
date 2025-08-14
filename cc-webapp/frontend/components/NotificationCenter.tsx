import React from 'react';
import { UINotification } from '@/hooks/useNotifications';

type Props = {
  items: UINotification[];
  onMarkRead: (id: number) => void;
  showUnreadOnly: boolean;
  setShowUnreadOnly: (v: boolean) => void;
  muteTypes: Set<string>;
  setMuteTypes: (v: Set<string>) => void;
};

export function NotificationCenter({ items, onMarkRead, showUnreadOnly, setShowUnreadOnly, muteTypes, setMuteTypes }: Props) {
  const toggleMute = (t: string) => {
    const next = new Set(muteTypes);
    if (next.has(t)) next.delete(t); else next.add(t);
    setMuteTypes(next);
  };
  const types = Array.from(new Set(items.map(i => i.type).filter(Boolean))) as string[];
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3 pb-2 border-b">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showUnreadOnly} onChange={(e: any) => setShowUnreadOnly((e.target as HTMLInputElement).checked)} />
          Unread only
        </label>
        <div className="flex items-center gap-2 text-sm">
          {types.length > 0 && <span className="opacity-70">Mute:</span>}
          {types.map(t => (
            <button key={t} onClick={() => toggleMute(t)} className={`px-2 py-1 rounded border text-xs ${muteTypes.has(t) ? 'bg-slate-800 border-slate-600 opacity-60' : 'bg-slate-700 border-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {items.map((n, idx) => (
        <div key={n.id ?? idx} className={`rounded border p-3 ${n as any}.is_read ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">{n.created_at}</div>
              <div className="font-semibold">{n.title}</div>
            </div>
            {typeof n.id === 'number' && !(n as any).is_read && (
              <button className="text-xs rounded px-2 py-1 border" onClick={() => onMarkRead(n.id as number)}>Mark read</button>
            )}
          </div>
          <div className="mt-1">{n.message}</div>
        </div>
      ))}
      {items.length === 0 && <div className="text-slate-500">No notifications yet.</div>}
    </div>
  );
}
