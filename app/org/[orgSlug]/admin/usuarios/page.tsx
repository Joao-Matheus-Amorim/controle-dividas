import { AdminUsuariosPage } from "@/features/protected-pages/admin-usuarios-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedAdminUsuariosPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <AdminUsuariosPage orgSlug={orgSlug} />;
}
