import type { DbFamilyMember } from "@/lib/finance/types";
import type { FeaturePermissionKey, FinanceModuleKey, PermissionScope } from "./permissions";

export type ProfileRole = "admin" | "adult" | "child" | "custom" | "user";

export type DbProfile = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
  name: string;
  email: string | null;
  role: ProfileRole;
  is_active: boolean;
  created_at: string;
  family_members?: Pick<DbFamilyMember, "id" | "name"> | null;
};

export type DbModulePermission = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  profile_id: string;
  module: FinanceModuleKey;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: PermissionScope;
  allowed_member_ids: string[];
  granted_by: string | null;
  created_at: string;
};

export type DbFeaturePermission = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  profile_id: string;
  feature_key: FeaturePermissionKey;
  is_enabled: boolean;
  granted_by: string | null;
  created_at: string;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
};

export type PermissionFormState = {
  error?: string;
  success?: string;
};
