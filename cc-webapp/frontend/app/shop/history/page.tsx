"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/utils/shopApi';

export default function PurchaseHistoryPage() {
  const [data, setData] = useState([] as any[]);
  const [error, setError] = useState(null as string | null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiGet('/api/shop/transactions?limit=50');
        // 정렬: 최신순(created_at/ timestamp desc)
        const items = Array.isArray(res) ? res.slice() : [];
        items.sort((a: any, b: any) => {
          const at = new Date(a.created_at || a.timestamp || 0).getTime();
          const bt = new Date(b.created_at || b.timestamp || 0).getTime();
          return bt - at;
        });
        if (mounted) setData(items);
      } catch (e: any) {
        if (mounted) setError(e?.message || '구매 내역을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">구매 히스토리</h1>
          <Link href="/" className="underline opacity-80 hover:opacity-100">홈으로</Link>
        </div>
        {loading ? (
          <div className="text-muted-foreground">불러오는 중…</div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-4 mb-4">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted-foreground">구매 내역이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {data.map((tx: any) => {
              const when = new Date(tx.created_at || tx.timestamp);
              const qty = Math.max(1, Number(tx.quantity || 1));
              const amount = Number(tx.amount || 0);
              const status = tx.status || 'success';
              const statusClass = status === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : status === 'pending'
                ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                : 'bg-red-500/15 text-red-300 border-red-500/30';
              return (
                <div key={tx.id} className="glass-metal rounded-xl p-4 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{tx.product_name || tx.product_id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass}`}>{status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isNaN(when.getTime()) ? '-' : when.toLocaleString()} · 수량 {qty}
                      </div>
                    </div>
                    <div className="font-bold text-gold">{amount.toLocaleString()}G</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
