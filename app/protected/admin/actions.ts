"use server";

import { createHash, randomBytes } from "node:crypto";

import { buildAdminInvitationUrl, sendAdminInvitationEmail } from "@/lib/admin-invitations/delivery";
import { recordAuditEvent } from "@/lib/audit/events";
import { ensureAdminProfile } from "@/lib/finance/admin-server";
import type { PermissionFormState, ProfileFormState } from "@/lib/finance/admin-types";
import {
  FEATURE_PERMISSIONS,
  FINANCE_MODULES,
  type FeaturePermissionKey,
  type FinanceModuleKey,
  type PermissionScope,
} from "@/lib/finance/permissions";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FamilyUserActionState = {
  error?: string;
  success?: string;
  invitationUrl?: string;
};

const adminPermissionUpdateRateLimit = {
  operationKey: "admin.permission.update",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const adminFeaturePermissionUpdateRateLimit = {
  operationKey: "admin.feature_permission.update",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const adminUserRateLimits = {
  create: {
    operationKey: "admin.user.create",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  update: {
    operationKey: "admin.user.update",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  authLinkSync: {
    operationKey: "admin.user.auth_link.sync",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  delete: {
    operationKey: "admin.user.delete",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  status: {
    operationKey: "admin.user.status.update",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  invitationResend: {
    operationKey: "admin.user.invitation.resend",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
};

const familyInvitationExpiresInMs = 7 * 24 * 60 * 60 * 1000;

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
  return new Date(now + familyInvitationExpiresInMs).toISOString();
}

function normalizeScope(value: FormDataEntryValue | null): PermissionScope {
  if (value === "selected" || value === "family") {
    return value;
  }

  return "own";
}

function getAllowedMemberIds(formData: FormData, moduleKey: FinanceModuleKey) {
  return formData
    .getAll(`${moduleKey}.allowed_member_ids`)
    .map((value) => String(value))
    .filter(Boolean);
}

function isFeatureEnabled(formData: FormData, featureKey: FeaturePermissionKey) {
  return formData.get(`${featureKey}.is_enabled`) === "on";
}

async function recordAdminPermissionAuditEvent({
  organizationId,
  action,
  profileId,
  changedCount,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action: "admin.permission.update" | "admin.feature_permission.update";
  profileId: string;
  changedCount: number;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "profile",
    targetId: profileId,
    outcome,
    metadata: {
      ...metadata,
      profile_id: profileId,
      changed_count: changedCount,
    },
  });
}

async function recordAdminUserAuditEvent({
  organizationId,
  action,
  profileId,
  targetType = "profile",
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action:
    | "admin.user.create"
    | "admin.user.update"
    | "admin.user.activate"
    | "admin.user.deactivate"
    | "admin.user.delete"
    | "admin.user.auth_link.sync"
    | "admin.user.invitation.resend";
  profileId: string;
  targetType?: "profile" | "family_member";
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType,
    targetId: profileId,
    outcome,
    metadata,
  });
}

function normalizeAccessModel(value: string) {
  if (["basic", "family", "admin", "custom"].includes(value)) {
    return value;
  }

  return "basic";
}

function getDefaultPermissionForAccessModel(accessModel: string, module: FinanceModuleKey) {
  if (accessModel === "admin") {
    return {
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      scope: "family" as PermissionScope,
    };
  }

  if (accessModel === "family") {
    const allowedModules: FinanceModuleKey[] = [
      "DASHBOARD",
      "GASTOS",
      "CONTAS_A_PAGAR",
      "CONTAS_A_RECEBER",
      "BANCOS",
    ];
    const canUseModule = allowedModules.includes(module);

    return {
      can_view: canUseModule,
      can_create: canUseModule && module !== "DASHBOARD",
      can_edit: canUseModule && module !== "DASHBOARD",
      can_delete: false,
      scope: "own" as PermissionScope,
    };
  }

  if (accessModel === "basic") {
    const canUseModule = module === "DASHBOARD" || module === "GASTOS";

    return {
      can_view: canUseModule,
      can_create: module === "GASTOS",
      can_edit: false,
      can_delete: false,
      scope: "own" as PermissionScope,
    };
  }

  return {
    can_view: module === "DASHBOARD",
    can_create: false,
    can_delete: false,
    can_edit: false,
    scope: "own" as PermissionScope,
  };
}

async function ensureUniqueEmail({
  organizationId,
  email,
  ignoreProfileId,
}: {
  organizationId: string;
  email: string;
  ignoreProfileId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id && data.id !== ignoreProfileId) {
    throw new Error("Este email ja esta cadastrado para outro acesso familiar.");
  }
}

async function ensureUniqueMemberAccess({
  organizationId,
  memberId,
  ignoreProfileId,
}: {
  organizationId: string;
  memberId: string;
  ignoreProfileId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("linked_family_member_id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id && data.id !== ignoreProfileId) {
    throw new Error("Este membro da familia ja possui um acesso vinculado.");
  }
}

async function ensureMemberBelongsToOrganization(organizationId: string, memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Membro da familia invalido para esta organizacao.");
  }
}

async function ensureProfileBelongsToOrganization(organizationId: string, profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Perfil invalido para esta organizacao.");
  }
}

async function findAuthUserIdByEmail(email: string) {
  const adminSupabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (user?.id) {
      return user.id;
    }

    if (data.users.length < 100) {
      break;
    }

    page += 1;
  }

  return null;
}

async function upsertFamilyUserMembership({
  organizationId,
  authUserId,
}: {
  organizationId: string;
  authUserId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_memberships")
    .upsert({
      organization_id: organizationId,
      auth_user_id: authUserId,
      role: "member",
      is_active: true,
    }, {
      onConflict: "organization_id,auth_user_id",
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function createFamilyAccessInvitation({
  organizationId,
  organizationSlug,
  invitedByAuthUserId,
  invitedEmail,
  role,
}: {
  organizationId: string;
  organizationSlug: string;
  invitedByAuthUserId: string;
  invitedEmail: string;
  role: "admin" | "member";
}) {
  const supabase = await createClient();
  const credential = createInvitationCredential();
  const expiresAt = invitationExpiresAt();

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: organizationId,
      invited_email_normalized: invitedEmail,
      invited_by_auth_user_id: invitedByAuthUserId,
      role,
      status: "pending",
      token_hash: credential.tokenHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const invitationId = String(data.id);
  const delivery = await sendAdminInvitationEmail({
    invitationId,
    invitedEmail,
    organizationSlug,
    role,
    rawToken: credential.rawToken,
    expiresAt,
  });

  return {
    invitationId,
    invitationUrl: await buildAdminInvitationUrl(credential.rawToken),
    deliveryStatus: delivery.delivered ? "sent" : delivery.reason,
  };
}

export async function createFamilyUser(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const linkedFamilyMemberId = String(formData.get("linked_family_member_id") ?? "");
  const accessModel = normalizeAccessModel(String(formData.get("access_model") ?? "basic"));
  const role = accessModel === "admin" ? "admin" : "user";

  if (!name) return { error: "Informe o nome do acesso familiar." };
  if (!email) return { error: "Informe o email de acesso." };
  if (!linkedFamilyMemberId) return { error: "Selecione o membro da familia vinculado a este acesso." };

  try {
    const supabase = await createClient();
    const adminProfile = await ensureAdminProfile();
    const { organization, membership } = await requireOrganizationAdmin();
    const legacyOwnerId = organization.owner_auth_user_id;

    await ensureUniqueEmail({ organizationId: organization.id, email });
    await ensureUniqueMemberAccess({
      organizationId: organization.id,
      memberId: linkedFamilyMemberId,
    });
    await ensureMemberBelongsToOrganization(organization.id, linkedFamilyMemberId);

    const rateLimit = checkSensitiveOperationRateLimit({
      ...adminUserRateLimits.create,
      actorKey: adminProfile.id,
      organizationId: organization.id,
      targetKey: linkedFamilyMemberId,
    });

    if (!rateLimit.allowed) {
      await recordAdminUserAuditEvent({
        organizationId: organization.id,
        action: "admin.user.create",
        profileId: linkedFamilyMemberId,
        targetType: "family_member",
        outcome: "denied",
        metadata: {
          status: "rate_limited",
        },
      });

      return { error: "Muitas tentativas de cadastro de acesso familiar. Tente novamente em alguns minutos." };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        owner_id: legacyOwnerId,
        organization_id: organization.id,
        auth_user_id: null,
        linked_family_member_id: linkedFamilyMemberId,
        name,
        email,
        role,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    let invitationUrl: string | undefined;

    if (profile?.id) {
      const permissionRows = FINANCE_MODULES.map((module) => {
        const defaults = getDefaultPermissionForAccessModel(accessModel, module.key as FinanceModuleKey);

        return {
          owner_id: legacyOwnerId,
          organization_id: organization.id,
          profile_id: profile.id,
          module: module.key,
          can_view: defaults.can_view,
          can_create: defaults.can_create,
          can_edit: defaults.can_edit,
          can_delete: defaults.can_delete,
          scope: defaults.scope,
          allowed_member_ids: [],
          granted_by: adminProfile.id,
        };
      });

      const { error: permissionsError } = await supabase
        .from("user_module_permissions")
        .insert(permissionRows);

      if (permissionsError) return { error: permissionsError.message };

      const invitation = await createFamilyAccessInvitation({
        organizationId: organization.id,
        organizationSlug: organization.slug,
        invitedByAuthUserId: membership.auth_user_id,
        invitedEmail: email,
        role: role === "admin" ? "admin" : "member",
      });
      invitationUrl = invitation.invitationUrl;

      await recordAdminUserAuditEvent({
        organizationId: organization.id,
        action: "admin.user.create",
        profileId: profile.id,
        metadata: {
          role,
          access_model: accessModel,
          default_permission_count: permissionRows.length,
          invitation_id: invitation.invitationId,
          invitation_delivery_status: invitation.deliveryStatus,
        },
      });
    }

    revalidateOrganizationPaths(
      ["/protected/admin", "/protected/admin/usuarios", "/protected/admin/permissoes"],
      organization.slug,
    );

    return {
      success: "Acesso familiar cadastrado e convite enviado/preparado com sucesso.",
      invitationUrl,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel cadastrar este acesso.",
    };
  }
}

export async function resendFamilyUserInvitation(formData: FormData): Promise<FamilyUserActionState> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) return { error: "Acesso familiar nao encontrado." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization, membership } = await requireOrganizationAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, auth_user_id")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile?.id) return { error: "Acesso familiar nao encontrado." };
  if (profile.auth_user_id) return { error: "Este acesso ja possui login ativo." };

  const invitedEmail = String(profile.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invitedEmail)) {
    return { error: "Este acesso familiar nao possui email valido para convite." };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminUserRateLimits.invitationResend,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminUserAuditEvent({
      organizationId: organization.id,
      action: "admin.user.invitation.resend",
      profileId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de reenvio de convite. Tente novamente em alguns minutos." };
  }

  const credential = createInvitationCredential();
  const expiresAt = invitationExpiresAt();
  const inviteRole = profile.role === "admin" ? "admin" : "member";

  const { data: existingInvitation, error: invitationLookupError } = await supabase
    .from("organization_invitations")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("invited_email_normalized", invitedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (invitationLookupError) return { error: invitationLookupError.message };

  const invitationMutation = existingInvitation?.id
    ? supabase
      .from("organization_invitations")
      .update({
        token_hash: credential.tokenHash,
        expires_at: expiresAt,
        role: inviteRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingInvitation.id)
      .eq("organization_id", organization.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()
    : supabase
      .from("organization_invitations")
      .insert({
        organization_id: organization.id,
        invited_email_normalized: invitedEmail,
        invited_by_auth_user_id: membership.auth_user_id,
        role: inviteRole,
        status: "pending",
        token_hash: credential.tokenHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

  const { data: invitation, error: invitationError } = await invitationMutation;
  if (invitationError) return { error: invitationError.message };
  if (!invitation?.id) return { error: "O status deste convite mudou. Atualize a pagina e tente novamente." };

  const invitationId = String(invitation.id);
  const invitationUrl = await buildAdminInvitationUrl(credential.rawToken);
  const delivery = await sendAdminInvitationEmail({
    invitationId,
    invitedEmail,
    organizationSlug: organization.slug,
    role: inviteRole,
    rawToken: credential.rawToken,
    expiresAt,
  });

  await recordAdminUserAuditEvent({
    organizationId: organization.id,
    action: "admin.user.invitation.resend",
    profileId: id,
    metadata: {
      invitation_id: invitationId,
      invitation_delivery_status: delivery.delivered ? "sent" : delivery.reason,
    },
  });

  revalidateOrganizationPaths(["/protected/admin", "/protected/admin/usuarios"], organization.slug);

  return {
    success: delivery.delivered ? "Convite reenviado com sucesso." : "Convite preparado. Copie o link e envie para a pessoa.",
    invitationUrl,
  };
}

export async function updateFamilyUser(formData: FormData): Promise<FamilyUserActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const linkedFamilyMemberId = String(formData.get("linked_family_member_id") ?? "");

  if (!id) return { error: "Acesso familiar nao encontrado." };
  if (!name) return { error: "Informe o nome do acesso familiar." };
  if (!email) return { error: "Informe o email de acesso." };
  if (!linkedFamilyMemberId) return { error: "Selecione o membro da familia vinculado a este acesso." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile) return { error: "Acesso familiar nao encontrado." };
  if (profile.role === "admin") return { error: "Nao e possivel editar o Admin familiar por esta acao." };

  try {
    await ensureUniqueEmail({
      organizationId: organization.id,
      email,
      ignoreProfileId: id,
    });
    await ensureUniqueMemberAccess({
      organizationId: organization.id,
      memberId: linkedFamilyMemberId,
      ignoreProfileId: id,
    });
    await ensureMemberBelongsToOrganization(organization.id, linkedFamilyMemberId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel validar o acesso familiar.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminUserRateLimits.update,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminUserAuditEvent({
      organizationId: organization.id,
      action: "admin.user.update",
      profileId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de alteracao de acesso familiar. Tente novamente em alguns minutos." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, email, linked_family_member_id: linkedFamilyMemberId, organization_id: organization.id })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { error: error.message };

  await recordAdminUserAuditEvent({
    organizationId: organization.id,
    action: "admin.user.update",
    profileId: id,
    metadata: {
      fields_changed: "name,email,linked_family_member_id",
    },
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/usuarios", "/protected/admin/permissoes"],
    organization.slug,
  );

  return { success: "Acesso familiar atualizado com sucesso." };
}

export async function updateFamilyUserFormAction(formData: FormData): Promise<void> {
  await updateFamilyUser(formData);
}

export async function syncFamilyUserAuthLink(formData: FormData): Promise<FamilyUserActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) return { error: "Acesso familiar nao encontrado." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile?.email) return { error: "Acesso familiar nao encontrado ou sem email." };
  if (profile.role === "admin") return { error: "Nao e possivel sincronizar o Admin familiar por esta acao." };

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminUserRateLimits.authLinkSync,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminUserAuditEvent({
      organizationId: organization.id,
      action: "admin.user.auth_link.sync",
      profileId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de sincronizacao de login. Tente novamente em alguns minutos." };
  }

  const authUserId = await findAuthUserIdByEmail(profile.email);

  if (!authUserId) return { error: "Nenhum usuario autenticado encontrado para este email." };

  const { error: clearLinkError } = await supabase
    .from("profiles")
    .update({ auth_user_id: null })
    .eq("organization_id", organization.id)
    .eq("auth_user_id", authUserId);

  if (clearLinkError) return { error: clearLinkError.message };

  const { error: linkError } = await supabase
    .from("profiles")
    .update({ auth_user_id: authUserId, organization_id: organization.id })
    .eq("id", profile.id)
    .eq("organization_id", organization.id);

  if (linkError) return { error: linkError.message };

  try {
    await upsertFamilyUserMembership({
      organizationId: organization.id,
      authUserId,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel liberar o acesso a organizacao.",
    };
  }

  await recordAdminUserAuditEvent({
    organizationId: organization.id,
    action: "admin.user.auth_link.sync",
    profileId: profile.id,
    metadata: {
      auth_linked: true,
      membership_synced: true,
    },
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/usuarios", "/protected/admin/permissoes", "/protected"],
    organization.slug,
  );

  return { success: "Login sincronizado com sucesso." };
}

export async function syncFamilyUserAuthLinkFormAction(formData: FormData): Promise<void> {
  await syncFamilyUserAuthLink(formData);
}

export async function deleteFamilyUser(formData: FormData): Promise<FamilyUserActionState> {
  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");
  if (!id) return { error: "Acesso familiar nao encontrado." };
  if (confirmation !== "confirmado") return { error: "Confirme a exclusao antes de continuar." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile) return { error: "Acesso familiar nao encontrado." };
  if (profile.role === "admin") return { error: "Nao e possivel excluir o Admin familiar." };

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminUserRateLimits.delete,
    actorKey: adminProfile.id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordAdminUserAuditEvent({
      organizationId: organization.id,
      action: "admin.user.delete",
      profileId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de exclusao de acesso familiar. Tente novamente em alguns minutos." };
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { error: error.message };

  await recordAdminUserAuditEvent({
    organizationId: organization.id,
    action: "admin.user.delete",
    profileId: id,
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/usuarios", "/protected/admin/permissoes"],
    organization.slug,
  );

  return { success: "Acesso familiar excluido com sucesso." };
}

export async function deleteFamilyUserFormAction(formData: FormData): Promise<void> {
  await deleteFamilyUser(formData);
}

export async function toggleFamilyUserStatus(formData: FormData): Promise<FamilyUserActionState> {
  const id = String(formData.get("id") ?? "");
  const submittedActiveValue = String(formData.get("is_active") ?? "");

  if (!id) return { error: "Acesso familiar nao encontrado." };
  if (!["true", "false"].includes(submittedActiveValue)) {
    return { error: "Status do acesso familiar invalido." };
  }

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile) return { error: "Acesso familiar nao encontrado." };
  if (profile.role === "admin") return { error: "Nao e possivel alterar o status do Admin familiar." };

  const currentActive = profile.is_active === true;
  const submittedActive = submittedActiveValue === "true";
  if (currentActive !== submittedActive) {
    return { error: "O status deste acesso mudou. Atualize a pagina e tente novamente." };
  }

  const nextActive = !currentActive;

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminUserRateLimits.status,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordAdminUserAuditEvent({
      organizationId: organization.id,
      action: currentActive ? "admin.user.deactivate" : "admin.user.activate",
      profileId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: nextActive, organization_id: organization.id })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { error: error.message };

  await recordAdminUserAuditEvent({
    organizationId: organization.id,
    action: currentActive ? "admin.user.deactivate" : "admin.user.activate",
    profileId: id,
    metadata: {
      previous_active: currentActive,
      next_active: nextActive,
    },
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/usuarios", "/protected/admin/permissoes"],
    organization.slug,
  );

  return { success: currentActive ? "Acesso familiar desativado com sucesso." : "Acesso familiar ativado com sucesso." };
}

export async function toggleFamilyUserStatusFormAction(formData: FormData): Promise<void> {
  await toggleFamilyUserStatus(formData);
}

export async function saveProfilePermissions(
  _prevState: PermissionFormState,
  formData: FormData,
): Promise<PermissionFormState> {
  const profileId = String(formData.get("profile_id") ?? "");

  if (!profileId) return { error: "Selecione um perfil para configurar permissoes." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();
  const legacyOwnerId = organization.owner_auth_user_id;

  try {
    await ensureProfileBelongsToOrganization(organization.id, profileId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar este perfil.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminPermissionUpdateRateLimit,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: profileId,
  });

  if (!rateLimit.allowed) {
    await recordAdminPermissionAuditEvent({
      organizationId: organization.id,
      action: "admin.permission.update",
      profileId,
      changedCount: 0,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de alteracao de permissoes. Tente novamente em alguns minutos." };
  }

  const rows = FINANCE_MODULES.map((module) => {
    const key = module.key as FinanceModuleKey;
    const scope = normalizeScope(formData.get(`${key}.scope`));

    return {
      owner_id: legacyOwnerId,
      organization_id: organization.id,
      profile_id: profileId,
      module: key,
      can_view: formData.get(`${key}.can_view`) === "on",
      can_create: formData.get(`${key}.can_create`) === "on",
      can_edit: formData.get(`${key}.can_edit`) === "on",
      can_delete: formData.get(`${key}.can_delete`) === "on",
      scope,
      allowed_member_ids: scope === "selected" ? getAllowedMemberIds(formData, key) : [],
      granted_by: adminProfile.id,
    };
  });

  const { error } = await supabase
    .from("user_module_permissions")
    .upsert(rows, { onConflict: "profile_id,module" });

  if (error) return { error: error.message };

  await recordAdminPermissionAuditEvent({
    organizationId: organization.id,
    action: "admin.permission.update",
    profileId,
    changedCount: rows.length,
    outcome: "success",
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/permissoes"],
    organization.slug,
  );

  return { success: "Permissoes salvas com sucesso." };
}

export async function saveProfileFeaturePermissions(
  _prevState: PermissionFormState,
  formData: FormData,
): Promise<PermissionFormState> {
  const profileId = String(formData.get("profile_id") ?? "");

  if (!profileId) return { error: "Selecione um perfil para configurar funcionalidades." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();
  const { organization } = await requireOrganizationAdmin();
  const legacyOwnerId = organization.owner_auth_user_id;

  try {
    await ensureProfileBelongsToOrganization(organization.id, profileId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar este perfil.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...adminFeaturePermissionUpdateRateLimit,
    actorKey: adminProfile.id,
    organizationId: organization.id,
    targetKey: profileId,
  });

  if (!rateLimit.allowed) {
    await recordAdminPermissionAuditEvent({
      organizationId: organization.id,
      action: "admin.feature_permission.update",
      profileId,
      changedCount: 0,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de alteracao de funcionalidades. Tente novamente em alguns minutos." };
  }

  const rows = FEATURE_PERMISSIONS.map((feature) => ({
    owner_id: legacyOwnerId,
    organization_id: organization.id,
    profile_id: profileId,
    feature_key: feature.key,
    is_enabled: isFeatureEnabled(formData, feature.key),
    granted_by: adminProfile.id,
  }));

  const { error } = await supabase
    .from("user_feature_permissions")
    .upsert(rows, { onConflict: "profile_id,feature_key" });

  if (error) return { error: error.message };

  await recordAdminPermissionAuditEvent({
    organizationId: organization.id,
    action: "admin.feature_permission.update",
    profileId,
    changedCount: rows.length,
    outcome: "success",
  });

  revalidateOrganizationPaths(
    ["/protected/admin", "/protected/admin/permissoes"],
    organization.slug,
  );

  return { success: "Funcionalidades salvas com sucesso." };
}
