import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";

export function PersonBalanceCard({
  name,
  role,
  monthlyLimit,
  spent,
  remaining,
  usedPercent,
  exceeded,
}: {
  name: string;
  role: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  usedPercent: number;
  exceeded: boolean;
}) {
  const progress = Math.min(Math.max(usedPercent, 0), 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{role}</p>
          </div>
          <Badge variant={exceeded ? "destructive" : "secondary"}>
            {exceeded ? "Limite excedido" : "Dentro do limite"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="font-semibold">{formatCurrency(monthlyLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gasto</p>
            <p className="font-semibold">{formatCurrency(spent)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={exceeded ? "font-semibold text-destructive" : "font-semibold"}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className={exceeded ? "h-2 rounded-full bg-destructive" : "h-2 rounded-full bg-primary"}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {usedPercent.toFixed(1)}% do limite mensal utilizado.
        </p>
      </CardContent>
    </Card>
  );
}
