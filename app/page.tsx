import { ArrowRight, Banknote, CalendarClock, PieChart, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasEnvVars } from "@/lib/utils";

const features = [
  {
    title: "Controle por pessoa",
    description: "Limites mensais individuais para Danyel, Pai, Mãe, Gabryel e Caleb.",
    icon: Users,
  },
  {
    title: "Gastos e categorias",
    description: "Registro de despesas por data, categoria, local, banco, cartão e observação.",
    icon: PieChart,
  },
  {
    title: "Contas e vencimentos",
    description: "Acompanhamento de contas a pagar, receber, status e próximos vencimentos.",
    icon: CalendarClock,
  },
  {
    title: "Bancos e rendas",
    description: "Resumo de bancos por pessoa, rendas fixas, variáveis e saldo familiar.",
    icon: Banknote,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30">
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            FamilyFinance
          </Link>
          <div className="flex items-center gap-3">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="flex flex-col justify-center space-y-6">
          <div className="inline-flex w-fit rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">
            Sistema de gestão financeira familiar
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Organize os gastos, rendas e limites da família em um só painel.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Controle quanto cada pessoa tem disponível no mês, quanto já gastou,
              quais contas precisam ser pagas, quais valores a família tem a receber
              e quais bancos cada membro utiliza.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/protected">
                Abrir dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Entrar na conta</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-primary/10 shadow-xl">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle>Resumo do mês</CardTitle>
            <p className="text-sm text-primary-foreground/70">
              Visão esperada para o cliente final
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {[
              ["Limite mensal familiar", "€520,00"],
              ["Gastos lançados", "€139,25"],
              ["Saldo restante", "€380,75"],
              ["Contas pendentes", "€789,30"],
              ["Valores a receber", "€2.070,00"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 md:grid-cols-2 md:px-6 xl:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
