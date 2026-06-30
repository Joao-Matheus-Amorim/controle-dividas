"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState("enter");

  useEffect(() => {
    if (pathname !== prevPath.current) {
      setTransitionStage("exit");
      const timer = setTimeout(() => {
        prevPath.current = pathname;
        setDisplayChildren(children);
        setTransitionStage("enter");
      }, 120);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`transition-all duration-ff-base ease-out ${
        transitionStage === "exit" ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {displayChildren}
    </div>
  );
}
