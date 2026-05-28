import { ConfiguracoesPage } from "@/features/protected-pages/configuracoes-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedConfiguracoesPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <ConfiguracoesPage orgSlug={orgSlug} />;
}
