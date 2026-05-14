import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-5 py-8">
      <div className="w-full max-w-sm rounded-[2rem] border bg-background p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
            F
          </div>
          <p className="text-sm font-medium text-muted-foreground">FamilyFinance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Conta criada</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Agora entre com seu email e senha para acessar o app.
          </p>
        </div>

        <Button asChild className="mt-6 h-12 w-full rounded-2xl text-base font-semibold">
          <Link href="/auth/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
