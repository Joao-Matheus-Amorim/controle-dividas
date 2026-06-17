import { MovimentacoesPage } from "@/features/protected-pages/movimentacoes-page";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgProtectedMovimentacoesPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <MovimentacoesPage orgSlug={orgSlug} />;
}
