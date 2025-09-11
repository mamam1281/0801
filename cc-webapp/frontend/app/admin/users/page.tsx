"use client";
import React from 'react';
import { UsersManager } from '@/components/admin/UsersManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          <h1 className="text-xl font-semibold">👥 사용자 관리</h1>
        </div>
        <UsersManager onAddNotification={(m:string)=>console.log(m)} />
      </div>
    </div>
  );
}
