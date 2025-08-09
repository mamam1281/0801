"use client";

import * as React from "react";
import { cn } from "../../utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "gradient";
  showLabel?: boolean;
}

export default function ProgressBar({ value, max, className, size = "md", variant = "solid", showLabel }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const height = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";
  const bar =
    variant === "gradient"
      ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
      : "bg-primary";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("bg-primary/20 relative w-full overflow-hidden rounded-full", height)}>
        <div
          className={cn(bar, "h-full transition-all")}
          style={{ width: `${percent}%` }}
          aria-valuenow={value}
          aria-valuemax={max}
          role="progressbar"
        />
      </div>
      {showLabel ? (
        <div className="mt-1 text-xs text-muted-foreground text-right">{Math.round(percent)}%</div>
      ) : null}
    </div>
  );
}
