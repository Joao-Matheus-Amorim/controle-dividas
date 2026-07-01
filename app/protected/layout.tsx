import { AppShell } from "@/components/app/app-shell";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AppShell>{children}</AppShell>;
  }

  // Garante acesso à organização; seed inicial roda no onboarding/fallbacks específicos.
  await requireOrganizationAccess();

  return <AppShell>{children}</AppShell>;
}
