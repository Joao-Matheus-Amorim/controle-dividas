import { AdminPermissionsFormSection } from "@/components/admin/permissions/admin-permissions-form-section";
import { AdminPermissionsHeroSummary } from "@/components/admin/permissions/admin-permissions-hero-summary";
import { AdminPermissionsModulesList } from "@/components/admin/permissions/admin-permissions-modules-list";
import { AdminPermissionsPageHeader } from "@/components/admin/permissions/admin-permissions-page-header";
import { AdminPermissionsSummaryCards } from "@/components/admin/permissions/admin-permissions-summary-cards";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

type AdminPermissoesPageProps = {
  orgSlug?: string;
};

export async function AdminPermissoesPage({ orgSlug }: AdminPermissoesPageProps = {}) {
  const { profiles, permissions, featurePermissions, modules, members } = await getAdminDashboardData(orgSlug);
  const familyUsers = profiles.filter((profile) => profile.role !== "admin");
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <AdminPermissionsPageHeader />
      <AdminPermissionsHeroSummary
        permissionCount={permissions.length}
        familyUserCount={familyUsers.length}
        configuredProfileCount={configuredProfiles.size}
      />
      <AdminPermissionsSummaryCards
        familyUserCount={familyUsers.length}
        permissionCount={permissions.length}
        moduleCount={modules.length}
      />
      <AdminPermissionsFormSection
        profiles={profiles}
        permissions={permissions}
        featurePermissions={featurePermissions}
        members={members}
      />
      <AdminPermissionsModulesList modules={modules} />
    </div>
  );
}
