'use client';

import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="animate-pulse space-y-8 w-full max-w-3xl">
        {/* Header Skeleton */}
        <div className="h-16 bg-card rounded-lg w-1/2 mx-auto"></div>
        <div className="h-24 bg-card rounded-lg w-3/4 mx-auto"></div>

        {/* Game Area Skeleton */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-10 bg-card rounded-lg w-1/3 mx-auto"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-card rounded-lg"></div>
              <div className="h-24 bg-card rounded-lg"></div>
              <div className="h-24 bg-card rounded-lg"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-card rounded-lg w-1/3 mx-auto"></div>
            <div className="h-32 bg-card rounded-lg"></div>
          </div>
        </div>

        {/* CJ AI Chat Skeleton */}
        <div className="h-12 bg-card rounded-lg w-1/2 mx-auto"></div>
      </div>
      <p className="mt-8 text-lg text-accent animate-pulse">가위바위보 게임을 불러오는 중...</p>
    </div>
  );
};

export default LoadingSkeleton;
