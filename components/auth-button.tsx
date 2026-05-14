import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  const email = typeof user?.email === "string" ? user.email : "";

  return user ? (
    <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
      <div className="hidden min-w-0 text-right text-sm leading-tight text-white/45 xs:block sm:block">
        <p className="text-white/35">Hey,</p>
        <p className="max-w-[128px] truncate font-medium text-white/80 sm:max-w-[220px]">
          {email}
        </p>
      </div>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex min-w-0 gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Entrar</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Criar</Link>
      </Button>
    </div>
  );
}
