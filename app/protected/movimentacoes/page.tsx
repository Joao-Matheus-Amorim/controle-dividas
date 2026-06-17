import { MovimentacoesPage } from "@/features/protected-pages/movimentacoes-page";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProtectedMovimentacoesPage({ searchParams }: PageProps) {
  return <MovimentacoesPage searchParams={searchParams} />;
}
