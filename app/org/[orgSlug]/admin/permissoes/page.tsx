import { AdminPermissoesPage } from "@/app/protected/admin/permissoes/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgAdminPermissoesPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <AdminPermissoesPage orgSlug={orgSlug} />;
}
