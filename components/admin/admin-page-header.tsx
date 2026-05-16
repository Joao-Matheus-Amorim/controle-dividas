import { ShieldCheck } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function AdminPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Danyel"
      title="Admin"
      description="Gerenciamento familiar"
      icon={ShieldCheck}
    />
  );
}
