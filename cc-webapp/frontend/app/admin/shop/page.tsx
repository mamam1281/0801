"use client";
import React from 'react';
import { ShopManager } from '@/components/admin/ShopManager';

export default function AdminShopPage() {
  // 타입 오류 방지를 위해 제네릭 대신 단언 사용
  const [notices, setNotices] = React.useState([] as string[]);
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 text-foreground">Admin Shop</h1>
      <ShopManager onAddNotification={(m: string)=>setNotices((n: string[])=>[m, ...n].slice(0,5))} />
      {notices.length > 0 && (
        <div className="mt-6 space-y-1 text-sm text-muted-foreground">
          {notices.map((n: string, i: number)=>(<div key={i}>• {n}</div>))}
        </div>
      )}
    </div>
  );
}
