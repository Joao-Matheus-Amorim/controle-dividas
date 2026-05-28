import { AppShell } from "@/components/app/app-shell";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;

  return <AppShell orgSlug={orgSlug}>{children}</AppShell>;
}
