import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function EnvVarWarning() {
  return (
    <Alert
      variant="destructive"
      className="min-w-0 rounded-2xl border-ff-warning/20 bg-ff-warning-soft px-3 py-2 text-ff-warning"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <AlertDescription className="truncate text-xs font-semibold text-ff-warning">
        Configure as variaveis do Supabase para ativar o acesso.
      </AlertDescription>
    </Alert>
  );
}