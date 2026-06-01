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
  children: ReactNode;
}

export function AppFormSheet({
  title,
  description,
  triggerLabel,
  icon: Icon,
  children,
}: AppFormSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg" className="h-11">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-3/4 md:max-w-md md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="pt-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
