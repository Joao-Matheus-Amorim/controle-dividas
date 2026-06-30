"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

type PageVariant =
  | "dashboard"
  | "gastos"
  | "contas-a-pagar"
  | "contas-a-receber"
  | "movimentacoes"
  | "bancos"
  | "relatorios"
  | "configuracoes"
  | "admin";

function S({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-ff-md", className)} />;
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <S className="h-3 w-24" />
      <S className="h-8 w-44" />
    </div>
  );
}

function HeroSummarySkeleton() {
  return (
    <AppCard padding="lg" className="space-y-4">
      <S className="h-3 w-36" />
      <div className="flex flex-wrap gap-6">
        <S className="h-10 w-32" />
        <S className="h-10 w-28" />
        <S className="h-10 w-36" />
      </div>
    </AppCard>
  );
}

function SummaryCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <AppCard key={i} className="space-y-2">
          <S className="h-3 w-20" />
          <S className="h-7 w-28" />
          <S className="h-3 w-16" />
        </AppCard>
      ))}
    </section>
  );
}

function CreateSectionSkeleton() {
  return (
    <AppCard padding="lg" className="space-y-4">
      <S className="h-5 w-36" />
      <div className="grid gap-4 sm:grid-cols-2">
        <S className="h-10" />
        <S className="h-10" />
        <S className="h-10" />
        <S className="h-10" />
      </div>
      <S className="h-10 w-32" />
    </AppCard>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <S className="h-9 w-32" />
      <S className="h-9 w-40" />
      <S className="h-9 w-36" />
      <S className="h-9 w-28" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <AppCard className="space-y-3">
      <S className="h-5 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <S className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <S className="h-4 w-3/5" />
            <S className="h-3 w-2/5" />
          </div>
          <S className="h-5 w-20" />
        </div>
      ))}
    </AppCard>
  );
}

function GridSectionSkeleton({ count = 2 }: { count?: number }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <AppCard key={i} className="space-y-3">
          <S className="h-4 w-36" />
          <S className="h-14" />
          <S className="h-14" />
          <S className="h-14 w-3/4" />
        </AppCard>
      ))}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppCard key={i} padding="sm" className="flex flex-col items-center gap-1.5 text-center">
            <S className="h-5 w-5" />
            <S className="h-3 w-20" />
          </AppCard>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <AppCard className="space-y-3 lg:col-span-2">
          <S className="h-4 w-32" />
          <S className="h-40" />
        </AppCard>
        <AppCard className="space-y-3">
          <S className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <S key={i} className="h-14" />
          ))}
        </AppCard>
      </div>
      <GridSectionSkeleton />
      <GridSectionSkeleton />
    </div>
  );
}

function GastosSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={3} />
      <CreateSectionSkeleton />
      <FilterBarSkeleton />
      <AppCard className="space-y-3">
        <S className="h-4 w-40" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <S key={i} className="h-16 flex-1" />
          ))}
        </div>
      </AppCard>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <S key={i} className="h-8 w-24" />
        ))}
      </div>
      <ListSkeleton />
    </div>
  );
}

function ContasAPagarSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={4} />
      <CreateSectionSkeleton />
      <AppCard className="space-y-4">
        <div className="flex gap-2 border-b border-border pb-3">
          <S className="h-8 w-24" />
          <S className="h-8 w-28" />
          <S className="h-8 w-20" />
        </div>
        <ListSkeleton />
      </AppCard>
    </div>
  );
}

function ContasAReceberSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={4} />
      <CreateSectionSkeleton />
      <ListSkeleton />
    </div>
  );
}

function MovimentacoesSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <SummaryCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <ListSkeleton />
    </div>
  );
}

function BancosSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={3} />
      <CreateSectionSkeleton />
      <AppCard className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <S className="h-4 w-28" />
            <div className="flex gap-3">
              <S className="h-16 flex-1" />
              <S className="h-16 flex-1" />
            </div>
          </div>
        ))}
      </AppCard>
      <ListSkeleton />
    </div>
  );
}

function RelatoriosSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <div className="flex justify-end">
        <S className="h-9 w-32" />
      </div>
      <GridSectionSkeleton />
      <AppCard className="space-y-3">
        <S className="h-4 w-28" />
        <S className="h-32" />
      </AppCard>
      <GridSectionSkeleton />
    </div>
  );
}

function ConfiguracoesSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={3} />
      {Array.from({ length: 5 }).map((_, i) => (
        <AppCard key={i} className="space-y-3">
          <S className="h-4 w-36" />
          {i === 0 ? (
            <div className="flex items-center gap-4">
              <S className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-1">
                <S className="h-4 w-2/5" />
                <S className="h-3 w-1/3" />
              </div>
              <S className="h-8 w-24" />
            </div>
          ) : (
            Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <S className="h-4 flex-1" />
                <S className="h-5 w-16" />
                <S className="h-6 w-14" />
              </div>
            ))
          )}
        </AppCard>
      ))}
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="app-container">
      <HeaderSkeleton />
      <HeroSummarySkeleton />
      <SummaryCardsSkeleton count={2} />
      <AppCard className="space-y-3">
        <S className="h-4 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-ff-xl border border-border p-3">
              <S className="h-8 w-8 shrink-0" />
              <div className="flex-1 space-y-1">
                <S className="h-4 w-28" />
                <S className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </AppCard>
      <AppCard className="space-y-3">
        <S className="h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <S key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
      </AppCard>
    </div>
  );
}

const skeletons: Record<PageVariant, () => React.ReactNode> = {
  dashboard: DashboardSkeleton,
  gastos: GastosSkeleton,
  "contas-a-pagar": ContasAPagarSkeleton,
  "contas-a-receber": ContasAReceberSkeleton,
  movimentacoes: MovimentacoesSkeleton,
  bancos: BancosSkeleton,
  relatorios: RelatoriosSkeleton,
  configuracoes: ConfiguracoesSkeleton,
  admin: AdminSkeleton,
};

export function PageSkeleton({ variant, className }: { variant: PageVariant; className?: string }) {
  const Component = skeletons[variant];
  const content = <Component />;
  if (className) {
    return <div className={className}>{content}</div>;
  }
  return content;
}
