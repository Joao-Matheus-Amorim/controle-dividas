import { recordAuditEvent } from "@/lib/audit/events";

export const familyMemberCreateRateLimit = {
  operationKey: "finance.member.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export const familyMemberUpdateRateLimit = {
  operationKey: "finance.member.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export const familyMemberDeleteRateLimit = {
  operationKey: "finance.member.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

export async function recordFamilyMemberWriteAuditEvent({
  organizationId,
  action,
  familyMemberId = null,
  outcome = "success",
  metadata = {},
}: {
  organizationId: string;
  action: "finance.member.create" | "finance.member.update" | "finance.member.delete";
  familyMemberId?: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "family_member",
    targetId: familyMemberId,
    outcome,
    metadata,
  });
}
