"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getUserOrganizations,
} from "@/lib/organizations/server";
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from "@/lib/organizations/constants";
import { getOrganizationPath } from "@/lib/organizations/paths";

export async function setActiveOrganization(formData: FormData): Promise<void> {
  const organizationId = String(formData.get("organization_id") ?? "").trim();
  const currentPath = String(formData.get("current_path") ?? "").trim();
  const cookieStore = await cookies();
  const contexts = await getUserOrganizations();

  const validContext = contexts.find((context) => context.organization.id === organizationId);

  if (!validContext) {
    return;
  }

  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE_NAME, organizationId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/protected");

  if (currentPath.startsWith("/org/")) {
    redirect(getOrganizationPath(validContext.organization.slug));
  }
}
