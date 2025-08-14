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
        if (mounted) setData(res || []);
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
            {data.map((tx: any) => (
              <div key={tx.id} className="glass-metal rounded-xl p-4 border border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tx.product_name || tx.product_id}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.created_at || tx.timestamp).toLocaleString()} · 수량 {tx.quantity || 1}</div>
                  </div>
                  <div className="font-bold text-gold">{(tx.amount || 0).toLocaleString()}G</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
