"use server";

import { createHash, randomBytes } from "node:crypto";

import { sendAdminInvitationEmail } from "@/lib/admin-invitations/delivery";
import { recordAuditEvent } from "@/lib/audit/events";
import { ensureAdminProfile } from "@/lib/finance/admin-server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type AdminInvitationActionState = {
  error?: string;
  success?: string;
};

const invitationExpiresInMs = 7 * 24 * 60 * 60 * 1000;

const adminInvitationRateLimits = {
  create: {
    operationKey: "admin.invitation.create",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  revoke: {
    operationKey: "admin.invitation.revoke",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  },
  resend: {
    operationKey: "admin.invitation.resend",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
};

type InvitationLookup = {
  id: string;
  invited_email_normalized: string;
  status: string;
};

function normalizeInvitedEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidNormalizedEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function emailDomain(email: string) {
  return email.split("@")[1] ?? "unknown";
}

function emailLookupKey(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

function invitationTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createInvitationCredential() {
  const token = randomBytes(32).toString("base64url");

  return {
    rawToken: token,
    tokenHash: invitationTokenHash(token),
  };
}

function invitationExpiresAt(now = Date.now()) {
  return new Date(now + invitationExpiresInMs).toISOString();
}

async function recordAdminInvitationAuditEvent({
  organizationId,
  action,
  invitationId = null,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action: "admin.invitation.create" | "admin.invitation.revoke" | "admin.invitation.resend";
  invitationId?: string | null;
  outcome?: "success" | "denied" | "validation_error" | "failure";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "organization_invitation",
    targetId: invitationId,
    outcome,
    metadata,
  });
}

async function getInvitationForAdmin(id: string, organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, invited_email_normalized, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as InvitationLookup | null;
}

async function compensateUndeliveredInvitation({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_invitations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (error) {
    return {
      compensated: false as const,
      reason: "update_error",
      message: error.message,
    };
  }

  if (!data?.id || data.status !== "revoked") {
    return {
      compensated: false as const,
      reason: "row_not_revoked",
    };
  }

  return {
    compensated: true as const,
  };
}

export async function createAdminInvitation(
  _prevState: AdminInvitationActionState,
  formData: FormData,
): Promise<AdminInvitationActionState> {
  const invitedEmail = normalizeInvitedEmail(formData.get("email"));

  if (!invitedEmail || !isValidNormalizedEmail(invitedEmail)) {
    return { error: "Informe um email valido para o convite." };
  }

  const supabase = await createClient();
  await ensureAdminProfile();
  const { organization, membership } = await requireOrganizationAdmin();

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminInvitationRateLimits.create,
    actorKey: membership.auth_user_id,
    organizationId: organization.id,
    targetKey: emailLookupKey(invitedEmail),
  });

  if (!rateLimit.allowed) {
    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.create",
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        email_domain: emailDomain(invitedEmail),
      },
    });

    return { error: "Muitas tentativas de criacao de convite. Tente novamente em alguns minutos." };
  }

  const credential = createInvitationCredential();
  const expiresAt = invitationExpiresAt();

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: organization.id,
      invited_email_normalized: invitedEmail,
      invited_by_auth_user_id: membership.auth_user_id,
      role: "admin",
      status: "pending",
      token_hash: credential.tokenHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.create",
      outcome: "failure",
      metadata: {
        status: "database_error",
        email_domain: emailDomain(invitedEmail),
      },
    });

    return { error: error.message };
  }

  const invitationId = String(data.id);
  const delivery = await sendAdminInvitationEmail({
    invitationId,
    invitedEmail,
    organizationSlug: organization.slug,
    role: "admin",
    rawToken: credential.rawToken,
    expiresAt,
  });

  if (!delivery.delivered && delivery.reason !== "delivery_disabled") {
    const compensation = await compensateUndeliveredInvitation({
      id: invitationId,
      organizationId: organization.id,
    });

    if (!compensation.compensated) {
      await recordAdminInvitationAuditEvent({
        organizationId: organization.id,
        action: "admin.invitation.create",
        invitationId,
        outcome: "failure",
        metadata: {
          status: "delivery_compensation_failed",
          delivery_reason: delivery.reason,
          compensation_reason: compensation.reason,
          email_domain: emailDomain(invitedEmail),
        },
      });

      return { error: "Nao foi possivel entregar ou cancelar o convite admin. Acione o suporte." };
    }

    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.create",
      invitationId,
      outcome: "failure",
      metadata: {
        status: "delivery_failed",
        delivery_reason: delivery.reason,
        email_domain: emailDomain(invitedEmail),
      },
    });

    return { error: "Nao foi possivel entregar o convite admin. Tente novamente mais tarde." };
  }

  await recordAdminInvitationAuditEvent({
    organizationId: organization.id,
    action: "admin.invitation.create",
    invitationId,
    metadata: {
      role: "admin",
      email_domain: emailDomain(invitedEmail),
      expires_in_days: 7,
      delivery_status: delivery.delivered ? "sent" : "prepared",
    },
  });

  revalidateOrganizationPaths(["/protected/admin", "/protected/admin/usuarios"], organization.slug);

  return {
    success: delivery.delivered
      ? "Convite admin enviado com sucesso."
      : "Convite admin preparado com sucesso.",
  };
}

export async function revokeAdminInvitation(formData: FormData): Promise<AdminInvitationActionState> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { error: "Convite nao encontrado." };
  }

  const supabase = await createClient();
  await ensureAdminProfile();
  const { organization, membership } = await requireOrganizationAdmin();

  const invitation = await getInvitationForAdmin(id, organization.id);
  if (!invitation) {
    return { error: "Convite nao encontrado." };
  }

  if (invitation.status !== "pending") {
    return { error: "Apenas convites pendentes podem ser revogados." };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminInvitationRateLimits.revoke,
    actorKey: membership.auth_user_id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.revoke",
      invitationId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        email_domain: emailDomain(invitation.invited_email_normalized),
      },
    });

    return { error: "Muitas tentativas de revogacao de convite. Tente novamente em alguns minutos." };
  }

  const { data, error } = await supabase
    .from("organization_invitations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organization.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data?.id) {
    return { error: "O status deste convite mudou. Atualize a pagina e tente novamente." };
  }

  await recordAdminInvitationAuditEvent({
    organizationId: organization.id,
    action: "admin.invitation.revoke",
    invitationId: id,
    metadata: {
      email_domain: emailDomain(invitation.invited_email_normalized),
    },
  });

  revalidateOrganizationPaths(["/protected/admin", "/protected/admin/usuarios"], organization.slug);

  return { success: "Convite revogado com sucesso." };
}

export async function resendAdminInvitation(formData: FormData): Promise<AdminInvitationActionState> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { error: "Convite nao encontrado." };
  }

  const supabase = await createClient();
  await ensureAdminProfile();
  const { organization, membership } = await requireOrganizationAdmin();

  const invitation = await getInvitationForAdmin(id, organization.id);
  if (!invitation) {
    return { error: "Convite nao encontrado." };
  }

  if (invitation.status !== "pending") {
    return { error: "Apenas convites pendentes podem ser reenviados." };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminInvitationRateLimits.resend,
    actorKey: membership.auth_user_id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.resend",
      invitationId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        email_domain: emailDomain(invitation.invited_email_normalized),
      },
    });

    return { error: "Muitas tentativas de reenvio de convite. Tente novamente em alguns minutos." };
  }

  const credential = createInvitationCredential();
  const expiresAt = invitationExpiresAt();

  const { data, error } = await supabase
    .from("organization_invitations")
    .update({
      token_hash: credential.tokenHash,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organization.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data?.id) {
    return { error: "O status deste convite mudou. Atualize a pagina e tente novamente." };
  }

  const delivery = await sendAdminInvitationEmail({
    invitationId: id,
    invitedEmail: invitation.invited_email_normalized,
    organizationSlug: organization.slug,
    role: "admin",
    rawToken: credential.rawToken,
    expiresAt,
  });

  if (!delivery.delivered && delivery.reason !== "delivery_disabled") {
    const compensation = await compensateUndeliveredInvitation({
      id,
      organizationId: organization.id,
    });

    if (!compensation.compensated) {
      await recordAdminInvitationAuditEvent({
        organizationId: organization.id,
        action: "admin.invitation.resend",
        invitationId: id,
        outcome: "failure",
        metadata: {
          status: "delivery_compensation_failed",
          delivery_reason: delivery.reason,
          compensation_reason: compensation.reason,
          email_domain: emailDomain(invitation.invited_email_normalized),
        },
      });

      return { error: "Nao foi possivel entregar ou cancelar o convite admin. Acione o suporte." };
    }

    await recordAdminInvitationAuditEvent({
      organizationId: organization.id,
      action: "admin.invitation.resend",
      invitationId: id,
      outcome: "failure",
      metadata: {
        status: "delivery_failed",
        delivery_reason: delivery.reason,
        email_domain: emailDomain(invitation.invited_email_normalized),
      },
    });

    return { error: "Nao foi possivel entregar o convite admin. Tente novamente mais tarde." };
  }

  await recordAdminInvitationAuditEvent({
    organizationId: organization.id,
    action: "admin.invitation.resend",
    invitationId: id,
    metadata: {
      email_domain: emailDomain(invitation.invited_email_normalized),
      expires_in_days: 7,
      credential_refreshed: true,
      delivery_status: delivery.delivered ? "sent" : "prepared",
    },
  });

  revalidateOrganizationPaths(["/protected/admin", "/protected/admin/usuarios"], organization.slug);

  return {
    success: delivery.delivered
      ? "Convite admin reenviado com sucesso."
      : "Convite preparado para reenvio com sucesso.",
  };
}
