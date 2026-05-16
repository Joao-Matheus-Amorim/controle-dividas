import { AlertTriangle } from "lucide-react";

export function AppEnvWarning() {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#f7b84b]/20 bg-[#f7b84b]/10 px-3 py-2 text-[#f7b84b]">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="truncate text-xs font-semibold">
        Configure as variaveis do Supabase para ativar o acesso.
      </span>
    </div>
  );
}
