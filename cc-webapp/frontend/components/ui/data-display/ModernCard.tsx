"use client";

import * as React from "react";
import { cn } from "../../utils";

export default function ModernCard({ className, children, ...props }: any) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.15)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
