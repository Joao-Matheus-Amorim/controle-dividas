import { AdminUsuariosPage } from "@/app/protected/admin/usuarios/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgAdminUsuariosPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <AdminUsuariosPage orgSlug={orgSlug} />;
}
