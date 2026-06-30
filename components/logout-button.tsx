"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      onClick={logout}
      className="h-10 shrink-0 rounded-2xl bg-primary px-4 text-sm font-semibold text-foreground shadow-[0_12px_30px_rgba(139,114,248,0.2)] hover:bg-ff-primary-hover"
    >
      <span className="hidden sm:inline">Logout</span>
      <LogOut className="h-4 w-4 sm:hidden" />
    </Button>
  );
}
