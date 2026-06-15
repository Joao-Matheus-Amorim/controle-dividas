"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardSummaryRow } from "./dashboard-summary-section";

const summaryIcons: Record<DashboardSummaryRow["iconKey"], LucideIcon> = {
  expenses: ReceiptText,
  payables: WalletCards,
  banks: Banknote,
  receivables: TrendingUp,
};

type VisibleSummaryCard = {
  row: DashboardSummaryRow;
  position: "previous" | "active" | "next";
};

interface DashboardSummaryCarouselProps {
  rows: DashboardSummaryRow[];
}

export function DashboardSummaryCarousel({ rows }: DashboardSummaryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const canNavigate = rows.length > 1;

  const visibleCards = useMemo<VisibleSummaryCard[]>(() => {
    if (rows.length <= 1) {
      return rows.map((row) => ({ row, position: "active" }));
    }

    const previousIndex = (activeIndex - 1 + rows.length) % rows.length;
    const nextIndex = (activeIndex + 1) % rows.length;

    return [
      { row: rows[previousIndex], position: "previous" },
      { row: rows[activeIndex], position: "active" },
      { row: rows[nextIndex], position: "next" },
    ];
  }, [activeIndex, rows]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + rows.length) % rows.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % rows.length);
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "grid min-h-[8.75rem] items-center gap-2 overflow-hidden",
          rows.length > 1 ? "grid-cols-[0.7fr_1fr_0.7fr]" : "grid-cols-1",
        )}
      >
        {visibleCards.map(({ row, position }) => {
          const Icon = summaryIcons[row.iconKey];
          const isActive = position === "active";

          return (
            <article
              key={`${row.label}-${position}`}
              className={cn(
                "min-w-0 rounded-2xl border bg-ff-bg-soft p-3 transition duration-ff-base ease-ff-spring",
                isActive
                  ? "scale-100 border-primary/30 opacity-100 shadow-ff-md ring-1 ring-primary/25"
                  : "scale-90 border-border opacity-45 shadow-none",
              )}
              aria-hidden={!isActive}
            >
              <div className="flex flex-col gap-3">
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-xl",
                    row.bg,
                    isActive ? "h-10 w-10" : "h-8 w-8",
                  )}
                  style={{ color: row.color }}
                >
                  <Icon className={isActive ? "h-5 w-5" : "h-4 w-4"} />
                </div>
                <div className="min-w-0">
                  <p className={cn("truncate font-black text-foreground", isActive ? "text-xl" : "text-sm")}>
                    {row.value}
                  </p>
                  <p className={cn("truncate font-semibold text-foreground", isActive ? "mt-2 text-sm" : "mt-1 text-xs")}>
                    {row.label}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{row.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border bg-card"
          aria-label="Resumo anterior"
          disabled={!canNavigate}
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs font-semibold text-muted-foreground">
          {activeIndex + 1} / {rows.length}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border bg-card"
          aria-label="Proximo resumo"
          disabled={!canNavigate}
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
