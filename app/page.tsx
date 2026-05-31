import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-5 py-8">
      <div className="w-full max-w-sm rounded-[2rem] border bg-background p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
            F
          </div>
          <p className="text-sm font-medium text-muted-foreground">FamilyFinance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Acesso familiar</h1>
        </div>

        <div className="mt-8 space-y-3">
          <Button asChild className="h-12 w-full rounded-2xl text-base font-semibold">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full rounded-2xl text-base font-semibold">
            <Link href="/auth/sign-up">Criar conta</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
