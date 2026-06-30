import { PageWithPullToRefresh } from "@/components/app/page-with-pull-to-refresh";
import { ContasAPagarPage } from "@/features/protected-pages/contas-a-pagar-page";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProtectedContasAPagarPage({ searchParams }: PageProps) {
  return (
    <PageWithPullToRefresh>
      <ContasAPagarPage searchParams={searchParams} />
    </PageWithPullToRefresh>
  );
}
