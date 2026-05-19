import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function EnvVarWarning() {
  return (
    <Alert
      variant="destructive"
      className="min-w-0 rounded-2xl border-[#f7b84b]/20 bg-[#f7b84b]/10 px-3 py-2 text-[#f7b84b]"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <AlertDescription className="truncate text-xs font-semibold text-[#f7b84b]">
        Configure as variaveis do Supabase para ativar o acesso.
      </AlertDescription>
    </Alert>
  );
}