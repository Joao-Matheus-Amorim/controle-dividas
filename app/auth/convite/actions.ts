"use server";

import { createHash } from "node:crypto";

import { recordAuditEvent } from "@/lib/audit/events";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type AcceptAdminInvitationState = {
  error?: string;
  success?: string;
};

type AcceptInvitationRpcResult = {
  status?: string;
  organization_id?: string;
  organization_slug?: string | null;
  invitation_id?: string;
  role?: string;
  email_domain?: string;
  profile_linked?: boolean;
};

const acceptInvitationRateLimit = {
  operationKey: "admin.invitation.accept",
  limit: 8,
  windowMs: 10 * 60 * 1000,
};

function normalizeInvitationToken(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function invitationTokenLookupKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function acceptErrorMessage(status: string | undefined) {
  switch (status) {
    case "unauthenticated":
      return "Entre na sua conta para aceitar o convite.";
    case "missing_token":
    case "not_found":
      return "Convite invalido ou ja utilizado.";
    case "expired":
      return "Este convite expirou.";
    case "revoked":
      return "Este convite foi revogado.";
    case "accepted":
      return "Este convite ja foi aceito.";
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
    },
  });
}

export async function acceptAdminInvitation(
  _prevState: AcceptAdminInvitationState,
  formData: FormData,
): Promise<AcceptAdminInvitationState> {
  const token = normalizeInvitationToken(formData.get("token"));

  if (!token) {
    return { error: acceptErrorMessage("missing_token") };
  }

  const authUserId = await getCurrentAuthUserId();
  if (!authUserId) {
    return { error: acceptErrorMessage("unauthenticated") };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...acceptInvitationRateLimit,
    actorKey: authUserId,
    organizationId: "pending-invitation",
    targetKey: invitationTokenLookupKey(token),
  });

  if (!rateLimit.allowed) {
    return { error: "Muitas tentativas de aceite de convite. Tente novamente em alguns minutos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    p_token: token,
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
    revalidateOrganizationPaths(["/protected/admin", "/protected/admin/usuarios"], result.organization_slug);
  }

  return { success: "Convite aceito com sucesso." };
}
