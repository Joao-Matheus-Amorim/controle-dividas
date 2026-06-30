import { PageWithPullToRefresh } from "@/components/app/page-with-pull-to-refresh";
import { ContasAReceberPage } from "@/features/protected-pages/contas-a-receber-page";

export default async function ProtectedContasAReceberPage() {
  return (
    <PageWithPullToRefresh>
      <ContasAReceberPage />
    </PageWithPullToRefresh>
  );
}
