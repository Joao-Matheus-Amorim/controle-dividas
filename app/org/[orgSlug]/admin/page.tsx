import { AdminPage } from "@/app/protected/admin/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgAdminPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <AdminPage orgSlug={orgSlug} />;
}
