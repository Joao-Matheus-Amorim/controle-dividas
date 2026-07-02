"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminInvitationLinkFeedback({ invitationUrl }: { invitationUrl?: string }) {
  const [copied, setCopied] = useState(false);

  if (!invitationUrl) {
    return null;
  }

  async function copyInvitationUrl() {
    await navigator.clipboard.writeText(invitationUrl ?? "");
    setCopied(true);
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-background/60 p-3">
      <p className="text-xs font-semibold text-foreground">
        Link do convite gerado. Envie para a pessoa convidada.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={invitationUrl} className="h-10 rounded-xl bg-background/70 text-xs" />
        <Button type="button" variant="outline" onClick={copyInvitationUrl} className="h-10 shrink-0 rounded-xl">
          <Copy className="mr-2 h-4 w-4" />
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
