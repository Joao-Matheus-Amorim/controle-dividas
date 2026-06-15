import { AdminHeroSummary } from "@/components/admin/admin-hero-summary";
import { AdminManagementLinks } from "@/components/admin/admin-management-links";
import { AdminModuleBadges } from "@/components/admin/admin-module-badges";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSummaryCards } from "@/components/admin/admin-summary-cards";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

type AdminPageProps = {
  orgSlug?: string;
};

export async function AdminPage({ orgSlug }: AdminPageProps = {}) {
  const { adminProfile, profiles, permissions, modules } = await getAdminDashboardData(orgSlug);

  const familyUsers = profiles.filter((profile) => profile.role === "user");
  const activeUsers = profiles.filter((profile) => profile.is_active);
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="app-container">
      <AdminPageHeader />

      <AdminHeroSummary
        adminProfile={adminProfile}
        familyUserCount={familyUsers.length}
        permissionCount={permissions.length}
      />

      <AdminSummaryCards
        activeUserCount={activeUsers.length}
        configuredProfileCount={configuredProfiles.size}
      />

      <AdminManagementLinks orgSlug={orgSlug} />

      <AdminModuleBadges modules={modules} />
    </div>
  );
}
