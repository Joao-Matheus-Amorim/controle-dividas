import { AdminPage } from "@/features/protected-pages/admin-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedAdminPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <AdminPage orgSlug={orgSlug} />;
}
