"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs@1.1.3";
import { cn } from "../ui/utils";

function GlassTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="glass-tabs"
      className={cn("flex flex-col gap-4 sm:gap-6", className)}
      {...props}
    />
  );
}

function GlassTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="glass-tabs-list"
      className={cn(
        "inline-flex items-center justify-center rounded-2xl p-1",
        "bg-slate-800/20 backdrop-blur-sm border border-slate-700/30",
        "shadow-lg overflow-x-auto",
        "scrollbar-hide",
        // 모바일 최적화: 최소 터치 타겟 크기 보장
        "min-h-[48px]",
        // 아이폰 13에서 전체 너비 활용
        "w-full max-w-full",
        className,
      )}
      {...props}
    />
  );
}

function GlassTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="glass-tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl",
        // 모바일 최적화: 터치 타겟 크기 증가
        "px-3 py-2.5 sm:px-4 sm:py-3",
        "text-slate-300 transition-all duration-300 whitespace-nowrap",
        "hover:text-slate-100 hover:bg-slate-700/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400",
        "data-[state=active]:border data-[state=active]:border-amber-500/30",
        "data-[state=active]:shadow-lg",
        // 모바일에서 터치 피드백 추가
        "active:scale-95 touch-manipulation",
        // 최소 터치 타겟 크기 보장
        "min-h-[44px] min-w-[44px]",
        // 아이콘 크기 조정
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5",
        // 텍스트 크기 모바일 최적화
        "text-sm sm:text-base",
        className,
      )}
      {...props}
    />
  );
}

function GlassTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="glass-tabs-content"
      className={cn(
        "outline-none",
        "focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:rounded-lg",
        // 모바일에서 적절한 여백
        "px-2 sm:px-0",
        className
      )}
      {...props}
    />
  );
}

export { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent };