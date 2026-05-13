import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModulePlaceholder({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{description}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>O que esta tela vai controlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
