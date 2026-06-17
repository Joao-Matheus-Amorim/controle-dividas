import { MovimentacoesPage } from "@/features/protected-pages/movimentacoes-page";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgProtectedMovimentacoesPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;

  return <MovimentacoesPage orgSlug={orgSlug} searchParams={searchParams} />;
}
