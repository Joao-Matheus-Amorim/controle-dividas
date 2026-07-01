import { AppShell } from "@/components/app/app-shell";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AppShell orgSlug={orgSlug}>{children}</AppShell>;
  }

  // Garante acesso à organização; seed inicial roda no onboarding/fallbacks específicos.
  await requireOrganizationAccess(orgSlug);

  return <AppShell orgSlug={orgSlug}>{children}</AppShell>;
}
