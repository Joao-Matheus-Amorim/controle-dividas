import { recordAuditEvent } from "@/lib/audit/events";
import type { PermissionAction } from "@/lib/finance/permissions";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { assertCanAccessMember, getCurrentProfile } from "@/lib/finance/access-control";

export type ActionState = {
  error?: string;
  success?: string;
};

export type RateLimitConfig = {
  operationKey: string;
  limit: number;
  windowMs: number;
};

export function rateLimitConfig(operationKey: string, limit = 10, windowMs = 10 * 60 * 1000): RateLimitConfig {
  return { operationKey, limit, windowMs };
}

export function checkFinanceRateLimit(config: RateLimitConfig & { actorKey: string; organizationId: string }) {
  const result = checkSensitiveOperationRateLimit(config);
  if (!result.allowed) {
    throw new Error("Limite de operacoes atingido. Tente novamente mais tarde.");
  }
  return result;
}

export async function recordFinanceAuditEvent(
  organizationId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  outcome: "success" | "denied" = "success",
  metadata?: Record<string, string | number | boolean | null>,
) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType,
    targetId,
    outcome,
    metadata,
  });
}

export async function assertMemberInOrganization(organizationId: string, memberId: string) {
  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!member) throw new Error("Pessoa vinculada nao pertence a esta organizacao.");
  return member;
}

export async function requireOrgAndProfile() {
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  return { profile, organization };
}

export async function assertCanManageEntity(
  tableName: string,
  entityId: string,
  module: "CONTAS_A_PAGAR" | "CONTAS_A_RECEBER" | "GASTOS" | "BANCOS",
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
  memberColumn: string,
) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess();
  const { data: entity, error } = await supabase
    .from(tableName)
    .select(`id, ${memberColumn}`)
    .eq("id", entityId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!entity?.[memberColumn as keyof typeof entity]) throw new Error("Registro nao encontrado.");
  await assertMemberInOrganization(organization.id, String(entity[memberColumn as keyof typeof entity]));
  await assertCanAccessMember(module, action, String(entity[memberColumn as keyof typeof entity]));
  return entity;
}

export function revalidateAfterMutation(paths: string[], orgSlug?: string | null) {
  revalidateOrganizationPaths(paths, orgSlug);
}
