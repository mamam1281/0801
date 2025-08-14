"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { useNotifications, UINotification } from "@/hooks/useNotifications";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationToast } from "@/components/NotificationToast";

interface Props { userId: number }

export default function NotificationClient({ userId }: Props) {
  const baseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000', []);
  const { items, connected, pushTest, markRead, setShowUnreadOnly, showUnreadOnly, muteTypes, setMuteTypes } = useNotifications({ userId, baseUrl });
  return (
    <div>
      <div className="mb-2 text-sm opacity-80">Realtime: {connected ? 'connected' : 'disconnected'}</div>
      <div className="my-2">
        <button className="rounded bg-blue-600 text-white px-3 py-2" onClick={() => pushTest('Hello from backend!')}>Send Test Notification</button>
      </div>
      <div className="mb-2 text-xs opacity-70">
        <Link href="/notifications/settings" className="underline">알림 설정</Link>
      </div>
      {/* Settings panel */}
      <div className="mb-3 p-3 rounded border">
        <div className="text-sm font-semibold mb-2">Settings</div>
        <div className="text-xs opacity-70">Backend: {baseUrl}</div>
        <div className="text-xs opacity-70">Mute types: {Array.from(muteTypes).join(', ') || 'none'}</div>
      </div>
      <NotificationCenter items={items} onMarkRead={markRead} showUnreadOnly={showUnreadOnly} setShowUnreadOnly={setShowUnreadOnly} muteTypes={muteTypes} setMuteTypes={setMuteTypes} />
      {items[0] && <NotificationToast item={items[0]} />}
    </div>
  );
}
