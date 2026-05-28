import { DashboardPage } from "@/app/protected/page";

type OrgDashboardPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgDashboardPage({ params }: OrgDashboardPageProps) {
  const { orgSlug } = await params;

  return <DashboardPage orgSlug={orgSlug} />;
}
