"use client";
import React from 'react';

const API = 'http://localhost:8000/api';

export default function AdminShopPage() {
  const [items, setItems] = React.useState([] as unknown as Array<Record<string, any>>);
  const [error, setError] = React.useState(null as string | null);

  const load = async () => {
    const token = localStorage.getItem('access_token');
    const r = await fetch(`${API}/admin/shop/items`, { headers: token?{Authorization:`Bearer ${token}`}:{}});
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail||'failed');
    setItems(j);
  };

  React.useEffect(() => { load().catch(e=>setError(String(e))); }, []);

  return (
    <div className="p-6 text-pink-200">
      <h1 className="text-2xl mb-4">Admin Shop (read-only)</h1>
      {error && <div className="text-red-400">{error}</div>}
      <ul className="space-y-2">
        {items.map((it: any) => {
          const price = Number(it.price_cents ?? 0) / 100;
          return (
            <li key={it.id} className="bg-black/20 p-2 rounded">
              {it.name} — {it.gems} gems — ${price.toFixed(2)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
