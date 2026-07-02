"use server";

import {
  deleteFamilyUser,
  resendFamilyUserInvitation,
  syncFamilyUserAuthLink,
  toggleFamilyUserStatus,
  updateFamilyUser,
  type FamilyUserActionState,
} from "./actions";

export async function updateFamilyUserWithState(
  _prevState: FamilyUserActionState,
  formData: FormData,
): Promise<FamilyUserActionState> {
  return updateFamilyUser(formData);
}

export async function syncFamilyUserAuthLinkWithState(
  _prevState: FamilyUserActionState,
  formData: FormData,
): Promise<FamilyUserActionState> {
  return syncFamilyUserAuthLink(formData);
}

export async function deleteFamilyUserWithState(
  _prevState: FamilyUserActionState,
  formData: FormData,
): Promise<FamilyUserActionState> {
  return deleteFamilyUser(formData);
}

export async function resendFamilyUserInvitationWithState(
  _prevState: FamilyUserActionState,
  formData: FormData,
): Promise<FamilyUserActionState> {
  return resendFamilyUserInvitation(formData);
}

export async function toggleFamilyUserStatusWithState(
  _prevState: FamilyUserActionState,
  formData: FormData,
): Promise<FamilyUserActionState> {
  return toggleFamilyUserStatus(formData);
}
