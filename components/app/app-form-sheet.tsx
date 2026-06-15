"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppFormSheetProps {
  title: string;
  description?: string;
  triggerLabel: string;
  icon?: LucideIcon;
  trigger?: ReactNode;
  children: ReactNode;
}

export function AppFormSheet({
  title,
  description,
  triggerLabel,
  icon: Icon,
  trigger,
  children,
}: AppFormSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="h-12 w-full rounded-2xl text-base font-bold sm:w-auto sm:min-w-[12rem]">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {triggerLabel}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-[1.75rem] p-0 md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-3/4 md:max-w-md md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right">
        <SheetHeader className="sticky top-0 z-10 border-b border-white/10 bg-background/95 px-5 pb-4 pt-5 text-left backdrop-blur">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
