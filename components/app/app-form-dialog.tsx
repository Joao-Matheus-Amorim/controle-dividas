"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
}

export function AppFormDialog({
  title,
  description,
  triggerLabel,
  icon: Icon,
  children,
}: AppFormDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl bg-[#8b72f8] font-semibold text-white shadow-lg shadow-[#8b72f8]/20 hover:bg-[#7d66e4]">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="pt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
