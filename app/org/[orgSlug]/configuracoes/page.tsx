import { ConfiguracoesPage } from "@/app/protected/configuracoes/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgConfiguracoesPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <ConfiguracoesPage orgSlug={orgSlug} />;
}
