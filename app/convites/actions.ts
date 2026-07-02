"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type AcceptPendingInvitationState = {
  error?: string;
  success?: string;
  organizationSlug?: string;
};

type AcceptInvitationRpcResult = {
  status?: string;
  organization_id?: string;
  organization_slug?: string | null;
  invitation_id?: string;
  role?: string;
  email_domain?: string;
  profile_linked?: boolean;
  profile_created?: boolean;
};

const acceptInvitationRateLimit = {
  operationKey: "admin.invitation.accept.by_email",
  limit: 8,
  windowMs: 10 * 60 * 1000,
};

function acceptErrorMessage(status: string | undefined) {
  switch (status) {
    case "unauthenticated":
      return "Entre na sua conta para aceitar o convite.";
    case "missing_invitation":
    case "not_found":
    case "expired":
    case "revoked":
    case "accepted":
      return "Convite invalido ou ja utilizado.";
    case "email_mismatch":
      return "Este convite pertence a outro email.";
    default:
      return "Nao foi possivel aceitar o convite.";
  }
}

async function getCurrentAuthUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return String(data.claims.sub);
}

async function recordAcceptAudit(result: AcceptInvitationRpcResult) {
  if (result.status !== "accepted" || !result.organization_id) {
    return;
  }

  await recordAuditEvent({
    organizationId: result.organization_id,
    action: "admin.invitation.accept",
    targetType: "organization_invitation",
    targetId: result.invitation_id ?? null,
    outcome: "success",
    metadata: {
      role: result.role ?? "member",
      email_domain: result.email_domain ?? "unknown",
      profile_linked: Boolean(result.profile_linked),
      profile_created: Boolean(result.profile_created),
      accepted_from: "pending_email_screen",
    },
  });
}

export async function acceptPendingOrganizationInvitation(
  _prevState: AcceptPendingInvitationState,
  formData: FormData,
): Promise<AcceptPendingInvitationState> {
  const invitationId = String(formData.get("invitation_id") ?? "").trim();

  if (!invitationId) {
    return { error: acceptErrorMessage("missing_invitation") };
  }

  const authUserId = await getCurrentAuthUserId();
  if (!authUserId) {
    return { error: acceptErrorMessage("unauthenticated") };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...acceptInvitationRateLimit,
    actorKey: authUserId,
    organizationId: "pending-invitation",
    targetKey: invitationId,
  });

  if (!rateLimit.allowed) {
    return { error: "Muitas tentativas de aceite de convite. Tente novamente em alguns minutos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation_by_id", {
    p_invitation_id: invitationId,
  });

  if (error) {
    return { error: error.message };
  }

  const result = (data ?? {}) as AcceptInvitationRpcResult;

  if (result.status !== "accepted") {
    return { error: acceptErrorMessage(result.status) };
  }

  await recordAcceptAudit(result);

  if (result.organization_slug) {
    revalidateOrganizationPaths(["/protected", "/protected/admin", "/protected/admin/usuarios"], result.organization_slug);
  }

  return {
    success: "Convite aceito com sucesso.",
    organizationSlug: result.organization_slug ?? undefined,
  };
}
