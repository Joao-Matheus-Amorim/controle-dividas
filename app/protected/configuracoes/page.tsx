import { SettingsAutomaticRules } from "@/components/settings/settings-automatic-rules";
import { SettingsCategories } from "@/components/settings/settings-categories";
import { SettingsHeroSummary } from "@/components/settings/settings-hero-summary";
import { SettingsMemberLimits } from "@/components/settings/settings-member-limits";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { SettingsSummaryCards } from "@/components/settings/settings-summary-cards";
import { getExpenseCategories, getFamilyMembers } from "@/lib/finance/server";

export default async function ConfiguracoesPage() {
  const [members, categories] = await Promise.all([
    getFamilyMembers(),
    getExpenseCategories(),
  ]);

  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <SettingsPageHeader />

      <SettingsHeroSummary
        totalLimit={totalLimit}
        categoryCount={categories.length}
      />

      <SettingsSummaryCards
        totalLimit={totalLimit}
        categoryCount={categories.length}
      />

      <SettingsMemberLimits members={members} />

      <SettingsCategories categories={categories} />

      <SettingsAutomaticRules />
    </div>
  );
}
