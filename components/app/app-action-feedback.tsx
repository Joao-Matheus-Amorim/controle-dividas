"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface AppActionFeedbackProps {
  error?: string;
  success?: string;
  className?: string;
}

export function AppActionFeedback({ error, success, className }: AppActionFeedbackProps) {
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p className={cn("flex items-center gap-2 rounded-2xl border border-ff-destructive bg-ff-destructive-soft px-3 py-2 text-sm text-ff-destructive", className)}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {error}
      </p>
    );
  }

  return (
    <p className={cn("flex items-center gap-2 rounded-2xl border border-ff-success bg-ff-success-soft px-3 py-2 text-sm text-ff-success", className)}>
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {success}
    </p>
  );
}
