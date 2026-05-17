import { PeopleCreateSection } from "@/components/people/people-create-section";
import { PeopleHeroSummary } from "@/components/people/people-hero-summary";
import { PeopleList } from "@/components/people/people-list";
import { PeoplePageHeader } from "@/components/people/people-page-header";
import { PeopleSummaryCards } from "@/components/people/people-summary-cards";
import type { AccessProfileSummary } from "@/components/people/people-utils";
import { getCurrentProfile } from "@/lib/finance/access-control";
import { getOrganizationFamilyMembers } from "@/lib/organizations/people";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

async function getAccessProfilesByMember(ownerId: string, organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, auth_user_id, linked_family_member_id")
    .eq("owner_id", ownerId)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as AccessProfileSummary[])
      .filter((profile) => profile.linked_family_member_id)
      .map((profile) => [String(profile.linked_family_member_id), profile]),
  );
}

export default async function PessoasPage() {
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const [members, accessByMember] = await Promise.all([
    getOrganizationFamilyMembers(),
    getAccessProfilesByMember(profile.owner_id, organization.id),
  ]);
  const activeMembers = members.filter((member) => member.is_active);
  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <PeoplePageHeader />

      <PeopleHeroSummary
        totalLimit={totalLimit}
        activeCount={activeMembers.length}
        accessCount={accessByMember.size}
      />

      <PeopleSummaryCards
        memberCount={members.length}
        activeCount={activeMembers.length}
        missingLoginCount={members.length - accessByMember.size}
      />

      <PeopleCreateSection />

      <PeopleList members={members} profiles={accessByMember} />
    </div>
  );
}
