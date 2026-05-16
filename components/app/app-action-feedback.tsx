import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface AppActionFeedbackProps {
  error?: string;
  success?: string;
  className?: string;
}

export function AppActionFeedback({ error, success, className }: AppActionFeedbackProps) {
  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p className={cn("flex items-center gap-2 rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 px-3 py-2 text-sm text-[#ff8da0]", className)}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {error}
      </p>
    );
  }

  return (
    <p className={cn("flex items-center gap-2 rounded-2xl border border-[#1de9b2]/20 bg-[#1de9b2]/10 px-3 py-2 text-sm text-[#1de9b2]", className)}>
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {success}
    </p>
  );
}
