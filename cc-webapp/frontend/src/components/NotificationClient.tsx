'use client';
import React, { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/NotificationCenter';
import { NotificationToast } from '@/components/NotificationToast';

export default function NotificationClient({ userId }: { userId: number }) {
  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    []
  );
  const { items, connected, pushTest } = useNotifications({ userId, baseUrl });
  return (
    <div>
      <div className="mb-2 text-sm opacity-80">
        Realtime: {connected ? 'connected' : 'disconnected'}
      </div>
      <div className="my-2">
        <button
          className="rounded bg-blue-600 text-white px-3 py-2"
          onClick={() => pushTest('Hello from backend!')}
        >
          Send Test Notification
        </button>
      </div>
      <NotificationCenter items={items} />
      {items[0] && <NotificationToast item={items[0]} />}
    </div>
  );
}
