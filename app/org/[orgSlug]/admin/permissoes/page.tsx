import { AdminPermissoesPage } from "@/features/protected-pages/admin-permissoes-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedAdminPermissoesPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <AdminPermissoesPage orgSlug={orgSlug} />;
}
