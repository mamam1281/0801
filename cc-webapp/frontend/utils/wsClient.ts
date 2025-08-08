// Lightweight WebSocket client for admin/user notifications with auto-reconnect
// Usage:
//   const ws = createWS({ userId, token: getAccessToken(), onMessage: (m)=>..., onOpen:()=>..., onClose:()=>... })
//   ws.connect(); ws.send({ hello: 'world' }); ws.close();

export type WSMessage = any;

export type WSClientOptions = {
  userId: number | string;
  token?: string | null;
  tokenProvider?: () => string | null | undefined; // optional lazy token fetcher
  baseUrl?: string; // default ws://localhost:8000
  path?: string;    // default /ws/notifications/{userId}
  reconnect?: boolean; // default true
  maxBackoffMs?: number; // default 10000
  heartbeatMs?: number; // default 30000
  onMessage?: (msg: WSMessage, raw: MessageEvent) => void;
  onOpen?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
};

export function createWS(opts: WSClientOptions) {
  const {
    userId,
    token,
    tokenProvider,
    baseUrl = (() => {
      const httpBase = (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_URL) || 'http://localhost:8000';
      try {
        const u = new URL(httpBase);
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        u.pathname = '';
        return u.toString().replace(/\/$/, '');
      } catch {
        return 'ws://localhost:8000';
      }
    })(),
    path = `/ws/notifications/${userId}`,
    reconnect = true,
    maxBackoffMs = 10_000,
    heartbeatMs = 30_000,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = opts;

  let ws: WebSocket | null = null;
  let closedByUser = false;
  let retries = 0;
  let reconnectTimer: any = null;

  const buildUrl = () => {
    const u = new URL(baseUrl);
    u.pathname = path;
    const t = token ?? tokenProvider?.();
    if (t) u.searchParams.set('token', t);
    return u.toString();
  };

  let heartbeatTimer: any = null;

  const connect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    closedByUser = false;
    ws = new WebSocket(buildUrl());

    ws.onopen = (ev) => {
      retries = 0;
      // start heartbeat
      clearInterval(heartbeatTimer);
      if (heartbeatMs > 0) {
        heartbeatTimer = setInterval(() => {
          try { ws?.send(JSON.stringify({ type: 'ping', ts: Date.now() })); } catch { }
        }, heartbeatMs);
      }
      if (onOpen) onOpen(ev);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage?.(data, ev);
      } catch {
        onMessage?.(ev.data as any, ev);
      }
    };

    ws.onclose = (ev) => {
      if (onClose) onClose(ev);
      clearInterval(heartbeatTimer);
      if (!closedByUser && reconnect) scheduleReconnect();
    };

    ws.onerror = (ev) => {
      onError?.(ev);
      try { ws?.close(); } catch { }
    };
  };

  const scheduleReconnect = () => {
    clearTimeout(reconnectTimer);
    const delay = Math.min(1000 * Math.pow(2, retries++), maxBackoffMs);
    reconnectTimer = setTimeout(connect, delay);
  };

  const send = (payload: WSMessage) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  const close = () => {
    closedByUser = true;
    clearTimeout(reconnectTimer);
    clearInterval(heartbeatTimer);
    try { ws?.close(); } catch { }
  };

  return { connect, send, close };
}
