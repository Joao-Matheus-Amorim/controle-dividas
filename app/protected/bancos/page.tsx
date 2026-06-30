import { PageWithPullToRefresh } from "@/components/app/page-with-pull-to-refresh";
import { BancosPage } from "@/features/protected-pages/bancos-page";

export default async function ProtectedBancosPage() {
  return (
    <PageWithPullToRefresh>
      <BancosPage />
    </PageWithPullToRefresh>
  );
}
