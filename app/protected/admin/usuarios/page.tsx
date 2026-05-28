import { AdminUsersCreateSection } from "@/components/admin/users/admin-users-create-section";
import { AdminUsersHeroSummary } from "@/components/admin/users/admin-users-hero-summary";
import { AdminUsersList } from "@/components/admin/users/admin-users-list";
import { AdminUsersPageHeader } from "@/components/admin/users/admin-users-page-header";
import { AdminUsersSummaryCards } from "@/components/admin/users/admin-users-summary-cards";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

type AdminUsuariosPageProps = {
  orgSlug?: string;
};

export async function AdminUsuariosPage({ orgSlug }: AdminUsuariosPageProps = {}) {
  const { adminProfile, profiles, members } = await getAdminDashboardData(orgSlug);
  const familyUsers = profiles.filter((profile) => profile.role !== "admin");
  const activeProfiles = profiles.filter((profile) => profile.is_active);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <AdminUsersPageHeader />

      <AdminUsersHeroSummary
        profileCount={profiles.length}
        familyUserCount={familyUsers.length}
        activeProfileCount={activeProfiles.length}
      />

      <AdminUsersSummaryCards
        activeProfileCount={activeProfiles.length}
        memberCount={members.length}
      />

      <AdminUsersCreateSection members={members} />

      <AdminUsersList
        profiles={profiles}
        adminProfileId={adminProfile.id}
        members={members}
      />
    </div>
  );
}

export default async function ProtectedAdminUsuariosPage() {
  return <AdminUsuariosPage />;
}
