import { recordAuditEvent } from "@/lib/audit/events";

export const familyMemberLimitRateLimit = {
  operationKey: "finance.member.limit.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export async function recordFamilyMemberLimitAuditEvent({
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
    action: "finance.member.limit.update",
    targetType: "family_member",
    targetId: familyMemberId,
    outcome,
    metadata,
  });
}
