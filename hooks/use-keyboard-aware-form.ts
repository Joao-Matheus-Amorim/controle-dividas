"use client";

import { useCallback, useEffect, useRef } from "react";

type UseKeyboardAwareFormOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
};

export function useKeyboardAwareForm({ containerRef }: UseKeyboardAwareFormOptions) {
  const originalPadding = useRef("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    };

    container.addEventListener("focusin", handleFocusIn);
    return () => container.removeEventListener("focusin", handleFocusIn);
  }, [containerRef]);

  const handleKeyboardOpen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    originalPadding.current = container.style.paddingBottom || "0";

    const onResize = () => {
      const diff = window.innerHeight - visualViewport.height;
      if (diff > 100) {
        container.style.paddingBottom = `${diff + 16}px`;
      }
    };

    visualViewport.addEventListener("resize", onResize);
    return () => {
      visualViewport.removeEventListener("resize", onResize);
      if (container && originalPadding.current !== undefined) {
        container.style.paddingBottom = originalPadding.current;
      }
    };
  }, [containerRef]);

  return { handleKeyboardOpen };
}
