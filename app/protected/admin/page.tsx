import { AdminHeroSummary } from "@/components/admin/admin-hero-summary";
import { AdminManagementLinks } from "@/components/admin/admin-management-links";
import { AdminModuleBadges } from "@/components/admin/admin-module-badges";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSummaryCards } from "@/components/admin/admin-summary-cards";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminPage() {
  const { adminProfile, profiles, permissions, modules } = await getAdminDashboardData();

  const familyUsers = profiles.filter((profile) => profile.role === "user");
  const activeUsers = profiles.filter((profile) => profile.is_active);
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
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

      <AdminManagementLinks />

      <AdminModuleBadges modules={modules} />
    </div>
  );
}
