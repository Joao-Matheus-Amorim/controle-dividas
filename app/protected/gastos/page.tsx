import { PageWithPullToRefresh } from "@/components/app/page-with-pull-to-refresh";
import { GastosPage } from "@/features/protected-pages/gastos-page";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProtectedGastosPage({ searchParams }: PageProps) {
  return (
    <PageWithPullToRefresh>
      <GastosPage searchParams={searchParams} />
    </PageWithPullToRefresh>
  );
}
