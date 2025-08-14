import React from 'react';
import { UINotification } from '@/hooks/useNotifications';

export function NotificationToast({ item }: { item: UINotification }) {
  const color = item.type === 'success' ? 'bg-green-600' : item.type === 'warning' ? 'bg-yellow-600' : item.type === 'error' ? 'bg-red-600' : 'bg-slate-700';
  return (
    <div className={`fixed right-4 top-4 z-50 rounded px-4 py-3 text-white shadow ${color}`}>
      {item.title && <div className="font-semibold">{item.title}</div>}
      <div>{item.message}</div>
    </div>
  );
}
