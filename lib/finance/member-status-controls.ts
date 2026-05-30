import { recordAuditEvent } from "@/lib/audit/events";

export const familyMemberStatusRateLimit = {
  operationKey: "finance.member.status.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export async function recordFamilyMemberStatusAuditEvent({
  organizationId,
  familyMemberId,
  outcome = "success",
  metadata = {},
}: {
  organizationId: string;
  familyMemberId: string;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action: "finance.member.status.update",
    targetType: "family_member",
    targetId: familyMemberId,
    outcome,
    metadata,
  });
}
