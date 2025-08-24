"use client";
import React from 'react';
import { shopApi, CatalogItem, BuyRequest } from '../../utils/shopApi';
import { API_ORIGIN, api as unifiedApi } from '../../lib/unifiedApi';
import { getTokens } from '../../utils/tokenStorage';
import { createWSClient, WSClient } from '../../utils/wsClient';
import { globalFallbackPoller, createSyncPollingTasks } from '../../utils/fallbackPolling';

function newIdemp(): string {
  // RFC4122-ish simple generator
  return 'idem-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

export default function ShopPage() {
  const [items, setItems] = React.useState([] as CatalogItem[]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null as string | null);
  const [lastReceipt, setLastReceipt] = React.useState(null as any);
  const wsRef = React.useRef(null as WSClient | null);
  const idempRef = React.useRef({} as Record<string,string>);
  const [wsDown, setWsDown] = React.useState(false);

  const loadCatalog = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await shopApi.listCatalog();
      setItems(data || []);
    } catch (e:any) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCatalog();
  }, []);

  React.useEffect(() => {
    // Connect WS for realtime updates
    const tokens = getTokens();
    const token = tokens?.access_token || '';
    const url = `${API_ORIGIN}/api/realtime/sync`;
    const client = createWSClient({
      url,
      token,
      onMessage: (msg) => {
        if (msg?.type === 'purchase_update') {
          // Surface the last purchase status
          setLastReceipt(msg);
        }
        if (msg?.type === 'profile_update') {
          // no-op here; dashboard likely consumes it. Could show toast.
        }
      },
      onConnect: () => {
        setWsDown(false);
        globalFallbackPoller.stopAll();
      },
      onDisconnect: () => {
        setWsDown(true);
      },
      onReconnecting: (attempt: number) => {
        if (attempt >= 2) setWsDown(true);
      },
    });
    wsRef.current = client;
    client.connect().catch(()=>{});
    // Register fallback polling tasks (lazy no-ops except profile refresh)
    const tasks = createSyncPollingTasks(
      async () => {
        try {
          const me = await unifiedApi.get('auth/me');
          setLastReceipt((prev: any) => ({ ...(prev||{}), type: 'profile_update', data: { profile: me } }));
        } catch {}
      },
      async () => {},
      async () => {},
      { interval: 45000 }
    );
    tasks.forEach(t => globalFallbackPoller.register(t));
    return () => {
      client.disconnect();
      globalFallbackPoller.stopAll();
      tasks.forEach(t => globalFallbackPoller.unregister(t.id));
    };
  }, []);

  React.useEffect(() => {
    if (wsDown) globalFallbackPoller.startAll();
    else globalFallbackPoller.stopAll();
  }, [wsDown]);

  const handleBuy = async (item: CatalogItem, reuseIdemp = false) => {
    setError(null);
    const key = String(item.id);
    const prev = idempRef.current[key];
    const idem = reuseIdemp && prev ? prev : newIdemp();
    idempRef.current[key] = idem;
    const payload: BuyRequest = {
      product_id: (item.id as any),
      quantity: 1,
      kind: 'gold',
      idempotency_key: idem,
    };
    try {
      const receipt = await shopApi.buy(payload);
      setLastReceipt(receipt);
    } catch (e:any) {
      setError(String(e.message || e));
    }
  };

  return (
    <div className="p-6 text-pink-200">
      <h1 className="text-2xl mb-4">Shop</h1>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {loading && <div className="opacity-80">Loading...</div>}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {items.map((it: CatalogItem) => {
          const priceCents = it.discounted_price_cents ?? it.price_cents ?? 0;
          const price = (Number(priceCents) / 100).toFixed(2);
          const gems = (it.gold ?? it.gems ?? 0);
          return (
            <li key={`${it.id}`} className="bg-black/20 p-3 rounded border border-pink-500/20">
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm opacity-80">SKU: {it.sku}</div>
              <div className="mt-1">Price: ${price} — Reward: {gems} gold</div>
              <button
                className="mt-2 px-3 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white"
                onClick={() => handleBuy(it)}
              >
                Buy
              </button>
              {idempRef.current[String(it.id)] && (
                <button
                  className="mt-2 ml-2 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white"
                  title="마지막 시도와 동일 멱등키로 재시도"
                  onClick={() => handleBuy(it, true)}
                >
                  Retry (same key)
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {lastReceipt && (
        <div className="mt-4 p-3 bg-black/30 rounded">
          <div className="font-semibold">Last purchase event</div>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(lastReceipt, null, 2)}</pre>
        </div>
      )}
      {wsDown && (
        <div className="mt-3 text-xs opacity-80">WS 연결 불가 상태 — 폴백 폴링 활성화 중</div>
      )}
    </div>
  );
}
