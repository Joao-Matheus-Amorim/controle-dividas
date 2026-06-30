"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useKeyboardAwareForm } from "@/hooks/use-keyboard-aware-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AppFormDialogProps {
  title: string;
  description?: string;
  triggerLabel: string;
  icon?: LucideIcon;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppFormDialog({
  title,
  description,
  triggerLabel,
  icon: Icon,
  children,
  open,
  onOpenChange,
}: AppFormDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { handleKeyboardOpen } = useKeyboardAwareForm({ containerRef: scrollRef });

  useEffect(() => {
    if (!open) return;
    const cleanup = handleKeyboardOpen();
    return cleanup;
  }, [open, handleKeyboardOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent ref={scrollRef} className="max-h-[88vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="pt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
