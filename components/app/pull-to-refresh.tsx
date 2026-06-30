"use client";

import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

type PullToRefreshProps = {
  children: React.ReactNode;
  className?: string;
};

export function PullToRefresh({ children, className }: PullToRefreshProps) {
  const { state, pullDistance, threshold, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh();

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {state !== "idle" && (
        <div
          className="pointer-events-none flex items-center justify-center transition-opacity"
          style={{
            height: state === "refreshing" ? 48 : Math.min(pullDistance, 48),
            opacity: state === "refreshing" ? 1 : progress,
          }}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-muted-foreground",
              state === "refreshing" && "animate-spin",
            )}
            style={{
              transform:
                state === "pulling" ? `rotate(${progress * 360}deg)` : undefined,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
