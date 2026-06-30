"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useKeyboardAwareForm } from "@/hooks/use-keyboard-aware-form";
import {
  Sheet,
  SheetClose,
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppFormSheet({
  title,
  description,
  triggerLabel,
  icon: Icon,
  trigger,
  children,
  open,
  onOpenChange,
}: AppFormSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useKeyboardAwareForm({ containerRef: scrollRef });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="h-12 w-full rounded-2xl text-base font-bold sm:w-auto sm:min-w-[12rem]">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {triggerLabel}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden rounded-none border-x-0 border-b-0 p-0 md:inset-4 md:h-[calc(100dvh-2rem)] md:w-[calc(100vw-2rem)] md:max-w-none md:rounded-3xl md:border md:border-border md:data-[state=closed]:slide-out-to-bottom md:data-[state=open]:slide-in-from-bottom xl:inset-x-8 xl:inset-y-6 xl:h-[calc(100dvh-3rem)] xl:w-[calc(100vw-4rem)]"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-4 pt-5 text-left sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle className="text-xl lg:text-2xl">{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </div>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-[-0.125rem] shrink-0 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-ff-bg-soft hover:text-foreground"
              >
                Voltar
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:px-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
