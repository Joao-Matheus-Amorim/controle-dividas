import { PageWithPullToRefresh } from "@/components/app/page-with-pull-to-refresh";
import { DashboardPage } from "@/features/protected-pages/dashboard-page";

export default async function ProtectedPage() {
  return (
    <PageWithPullToRefresh>
      <DashboardPage />
    </PageWithPullToRefresh>
  );
}
