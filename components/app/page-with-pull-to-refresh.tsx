"use client";

import { PullToRefresh } from "@/components/app/pull-to-refresh";

type PageWithPullToRefreshProps = {
  children: React.ReactNode;
};

export function PageWithPullToRefresh({ children }: PageWithPullToRefreshProps) {
  return <PullToRefresh>{children}</PullToRefresh>;
}
