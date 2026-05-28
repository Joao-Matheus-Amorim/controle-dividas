import { DashboardPage } from "@/features/protected-pages/dashboard-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <DashboardPage orgSlug={orgSlug} />;
}
