import { useEffect, useRef, useState } from 'react';

export type UINotification = {
  id?: number;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  created_at?: string;
};

type Options = {
  userId: number;
  baseUrl?: string; // backend base url
  preferSSE?: boolean;
};

export function useNotifications({ userId, baseUrl = 'http://localhost:8000', preferSSE }: Options) {
  const [items, setItems] = useState([] as UINotification[]);
  const wsRef = useRef(null as WebSocket | null);
  const [connected, setConnected] = useState(false);
  const [muteTypes, setMuteTypes] = useState(new Set<string>());
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  // preferSSE를 명시하지 않으면 localStorage 값을 사용하여 최소 변경으로 옵션 유지
  const [persistedPreferSSE, setPersistedPreferSSE] = useState(() => {
    if (typeof window === 'undefined') return false;
    const v = localStorage.getItem('noti_preferSSE');
    return v === '1';
  });
  const effectivePreferSSE = typeof preferSSE === 'boolean' ? preferSSE : persistedPreferSSE;

  // Fetch initial list
  useEffect(() => {
    let aborted = false;
    fetch(`${baseUrl}/api/notifications/list?user_id=${userId}`)
      .then(r => r.json())
      .then((data: UINotification[]) => { if (!aborted) setItems(data); })
      .catch(() => {});
    return () => { aborted = true; };
  }, [userId, baseUrl]);

  // Load persisted settings (최소 변경, 훅 API는 유지)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const unread = localStorage.getItem('noti_unreadOnly');
      if (unread != null) setShowUnreadOnly(unread === '1');
      const muted = localStorage.getItem('noti_muteTypes');
      if (muted) {
        const arr = JSON.parse(muted) as string[];
        if (Array.isArray(arr)) setMuteTypes(new Set(arr));
      }
    } catch { /* ignore */ }
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem('noti_unreadOnly', showUnreadOnly ? '1' : '0');
      localStorage.setItem('noti_muteTypes', JSON.stringify(Array.from(muteTypes)));
    } catch { /* ignore */ }
  }, [showUnreadOnly, muteTypes]);

  // Real-time
  useEffect(() => {
    if (effectivePreferSSE) {
      const es = new EventSource(`${baseUrl}/sse/notifications?user_id=${userId}`);
      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setItems((prev: UINotification[]) => [{ message: data.message ?? String(e.data), title: data.title, type: data.type }, ...prev].slice(0, 100));
        } catch {
          setItems((prev: UINotification[]) => [{ message: String(e.data) }, ...prev].slice(0, 100));
        }
      };
      es.onerror = () => { /* silent */ };
      setConnected(true);
      return () => { es.close(); setConnected(false); };
    }
    const ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/notifications/${userId}`);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); ws.send('ping'); };
    ws.onmessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data as string);
        const data = (payload as any)?.data || (payload as any)?.payload || payload;
        const candidate: UINotification = { message: (data as any)?.message ?? String(evt.data), title: (data as any)?.title, type: (data as any)?.type };
        if (candidate.type && muteTypes.has(candidate.type)) return;
        setItems((prev: UINotification[]) => [candidate, ...prev].slice(0, 100));
      } catch {
        setItems((prev: UINotification[]) => [{ message: String(evt.data) }, ...prev].slice(0, 100));
      }
    };
    ws.onerror = () => { /* silent */ };
    ws.onclose = () => { setConnected(false); };
    return () => { ws.close(); setConnected(false); };
  }, [userId, baseUrl, effectivePreferSSE]);

  const pushTest = async (message: string) => {
    await fetch(`${baseUrl}/api/notifications/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title: 'Test', message, notification_type: 'info' })
    });
  };

  const markRead = async (notifId: number) => {
    await fetch(`${baseUrl}/api/notifications/read/${notifId}`, { method: 'POST' });
    setItems((prev: UINotification[]) => prev.map((n: UINotification) => (n.id === notifId ? ({ ...n, is_read: true } as UINotification) : n)));
  };

  const filtered = items.filter((n: any) => {
    if (showUnreadOnly && n.is_read) return false;
    if (n.type && muteTypes.has(n.type)) return false;
    return true;
  });

  const setPreferSSE = (val: boolean) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('noti_preferSSE', val ? '1' : '0');
    } catch { /* ignore */ }
    setPersistedPreferSSE(val);
  };

  return { items: filtered, connected, pushTest, markRead, setShowUnreadOnly, showUnreadOnly, muteTypes, setMuteTypes, setPreferSSE, preferSSE: effectivePreferSSE };
}
