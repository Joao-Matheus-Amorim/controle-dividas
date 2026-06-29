"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AICommandBarProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AICommandBar({
  className,
  placeholder = "O que aconteceu?",
  disabled = false,
}: AICommandBarProps) {
  const [input, setInput] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    setMessage("Copiloto em modo seguro: entrada registrada apenas na tela por enquanto.");
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full space-y-2", className)}>
      <div className="relative flex h-11 w-full items-center overflow-hidden rounded-full border border-border bg-muted pl-4 pr-12 shadow-ff-xs transition-colors focus-within:border-primary focus-within:shadow-ff-sm">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/75 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary p-1.5 text-primary-foreground transition-colors disabled:opacity-50 hover:bg-ff-primary-hover active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
      {message ? <p className="px-4 text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
