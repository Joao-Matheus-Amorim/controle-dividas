"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type PullToRefreshState = "idle" | "pulling" | "refreshing";

export function usePullToRefresh() {
  const router = useRouter();
  const [state, setState] = useState<PullToRefreshState>("idle");
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);

  const threshold = 60;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && state === "idle") {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, [state]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current || state === "refreshing") return;
    touchCurrentY.current = e.touches[0].clientY;
    const dist = Math.max(0, touchCurrentY.current - touchStartY.current);
    if (dist > 0) {
      e.preventDefault();
      setPullDistance(dist);
      setState("pulling");
    }
  }, [state]);

  const onTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    const dist = Math.max(0, touchCurrentY.current - touchStartY.current);
    if (dist >= threshold) {
      setState("refreshing");
      requestAnimationFrame(() => {
        router.refresh();
        setTimeout(() => {
          setState("idle");
          setPullDistance(0);
        }, 400);
      });
    } else {
      setState("idle");
      setPullDistance(0);
    }
  }, [router]);

  return {
    state,
    pullDistance,
    threshold,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
