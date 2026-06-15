import { AlertTriangle, CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/formatting";

type UpcomingBill = {
  id: string;
  name: string;
  category: string;
  responsibleMemberName?: string | null;
  dueDate: string;
  amount: number;
  status: string;
  bank: string;
};

export function UpcomingBills({ bills }: { bills: UpcomingBill[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos vencimentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                {bill.status === "atrasado" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{bill.name}</p>
                <p className="text-xs text-muted-foreground">
                  {bill.category} · {bill.responsibleMemberName ?? "Nao informado"} · {bill.bank}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vencimento: {new Date(`${bill.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(bill.amount)}</p>
              <Badge variant={bill.status === "atrasado" ? "destructive" : "secondary"}>
                {bill.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
