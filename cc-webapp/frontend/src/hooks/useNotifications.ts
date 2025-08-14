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

  // Fetch initial list
  useEffect(() => {
    let aborted = false;
    fetch(`${baseUrl}/api/notifications/list?user_id=${userId}`)
      .then(r => r.json())
      .then((data: UINotification[]) => { if (!aborted) setItems(data); })
      .catch(() => {});
    return () => { aborted = true; };
  }, [userId, baseUrl]);

  // Real-time
  useEffect(() => {
    if (preferSSE) {
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
        const payload = JSON.parse(evt.data);
        const data = payload?.data || payload?.payload || payload;
  setItems((prev: UINotification[]) => [{ message: data?.message ?? String(evt.data), title: data?.title, type: data?.type }, ...prev].slice(0, 100));
      } catch {
  setItems((prev: UINotification[]) => [{ message: String(evt.data) }, ...prev].slice(0, 100));
      }
    };
    ws.onerror = () => { /* silent */ };
    ws.onclose = () => { setConnected(false); };
    return () => { ws.close(); setConnected(false); };
  }, [userId, baseUrl, preferSSE]);

  const pushTest = async (message: string) => {
    await fetch(`${baseUrl}/api/notifications/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title: 'Test', message, notification_type: 'info' })
    });
  };

  return { items, connected, pushTest };
}
