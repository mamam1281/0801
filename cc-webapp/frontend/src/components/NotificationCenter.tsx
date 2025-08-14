import React from 'react';
import { UINotification } from '@/hooks/useNotifications';

export function NotificationCenter({ items }: { items: UINotification[] }) {
  return (
    <div className="p-4 space-y-3">
      {items.map((n, idx) => (
        <div key={n.id ?? idx} className="rounded border p-3">
          <div className="text-sm text-slate-500">{n.created_at}</div>
          <div className="font-semibold">{n.title}</div>
          <div>{n.message}</div>
        </div>
      ))}
      {items.length === 0 && <div className="text-slate-500">No notifications yet.</div>}
    </div>
  );
}
