"use client";

import {
  Banknote,
  BarChart3,
  Home,
  Menu,
  Repeat2,
  ReceiptText,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type MobileNavigationIconKey =
  | "admin"
  | "banks"
  | "dashboard"
  | "expenses"
  | "more"
  | "movements"
  | "payables"
  | "people"
  | "receivables"
  | "reports"
  | "settings";

export type MobileNavigationItem = {
  href: string;
  label: string;
  iconKey: MobileNavigationIconKey;
};

const iconMap: Record<MobileNavigationIconKey, LucideIcon> = {
  admin: ShieldCheck,
  banks: Banknote,
  dashboard: Home,
  expenses: ReceiptText,
  more: Menu,
  movements: Repeat2,
  payables: WalletCards,
  people: Users,
  receivables: TrendingUp,
  reports: BarChart3,
  settings: Settings,
};

interface MobileBottomNavigationProps {
  primaryItems: MobileNavigationItem[];
  allItems: MobileNavigationItem[];
}

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/protected" && pathname.startsWith(`${href}/`));
}

function MobileNavigationLink({
  item,
  className,
  showIndicator,
}: {
  item: MobileNavigationItem;
  className?: string;
  showIndicator?: boolean;
}) {
  const pathname = usePathname();
  const Icon = iconMap[item.iconKey];
  const active = isCurrentPath(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex min-w-0 items-center justify-center gap-2 text-muted-foreground transition hover:text-primary",
        active && "text-primary",
        className,
      )}
    >
      {active && showIndicator ? (
        <span className="absolute -top-0.5 left-1/2 h-[0.1875rem] w-6 -translate-x-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className="h-5 w-5 shrink-0" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

export function MobileBottomNavigation({
  primaryItems,
  allItems,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const hasHiddenItems = allItems.length > primaryItems.length;
  const moreIsActive = allItems
    .filter((item) => !primaryItems.some((primary) => primary.href === item.href))
    .some((item) => isCurrentPath(pathname, item.href));

  if (allItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 max-w-full overflow-hidden border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex w-full items-stretch">
        {primaryItems.map((item) => (
          <MobileNavigationLink
            key={item.href}
            item={item}
            showIndicator
            className="flex-1 flex-col gap-1 px-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide"
          />
        ))}

        {hasHiddenItems ? (
          <Sheet>
            <SheetTrigger
              className={cn(
                "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-primary",
                moreIsActive && "text-primary",
              )}
              aria-label="Abrir menu completo"
            >
              <Menu className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">Mais</span>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[82vh] overflow-hidden rounded-t-[1.75rem] border-border bg-card p-0 text-foreground"
            >
              <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
                <SheetTitle className="text-foreground">Menu</SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Todas as áreas liberadas para este acesso.
                </SheetDescription>
              </SheetHeader>
              <div className="grid max-h-[60vh] gap-2 overflow-y-auto px-4 py-4">
                {allItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <MobileNavigationLink
                      item={item}
                      className="justify-start rounded-2xl border border-border bg-ff-bg-soft px-4 py-3 text-sm font-semibold"
                    />
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </nav>
  );
}
