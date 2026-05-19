import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

export function AppSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

export function AppPageSkeleton() {
  return (
    <div className="app-container">
      <div className="space-y-2">
        <AppSkeleton className="h-3 w-24" />
        <AppSkeleton className="h-9 w-44" />
        <AppSkeleton className="h-4 w-56" />
      </div>

      <AppCard className="space-y-5 rounded-[1.75rem] p-5">
        <AppSkeleton className="h-3 w-40" />
        <AppSkeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <AppSkeleton className="h-12" />
          <AppSkeleton className="h-12" />
        </div>
      </AppCard>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
        <AppSkeleton className="h-28" />
        <AppSkeleton className="h-28" />
        <AppSkeleton className="h-28" />
        <AppSkeleton className="hidden h-28 md:block" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AppCard className="space-y-3">
          <AppSkeleton className="h-4 w-40" />
          <AppSkeleton className="h-16" />
          <AppSkeleton className="h-16" />
        </AppCard>
        <AppCard className="space-y-3">
          <AppSkeleton className="h-4 w-32" />
          <AppSkeleton className="h-16" />
          <AppSkeleton className="h-16" />
        </AppCard>
      </section>
    </div>
  );
}