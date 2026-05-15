import { getCurrentProfile } from "@/lib/finance/access-control";

export function getCurrentMonthLabel() {
  return new Date().toLocaleString("pt-BR", { month: "long" });
}

export function getFamilyDisplayName(profileName: string | null | undefined) {
  const normalizedName = profileName?.trim();
  return normalizedName ? `Família ${normalizedName}` : "Família";
}

export async function getCurrentPeriodContextLabel() {
  const profile = await getCurrentProfile();
  return `${getCurrentMonthLabel()} · ${getFamilyDisplayName(profile.name)}`;
}
