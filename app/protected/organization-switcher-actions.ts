"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  ACTIVE_ORGANIZATION_COOKIE_NAME,
  getUserOrganizations,
} from "@/lib/organizations/server";

export async function setActiveOrganization(formData: FormData): Promise<void> {
  const organizationId = String(formData.get("organization_id") ?? "").trim();
  const cookieStore = await cookies();
  const contexts = await getUserOrganizations();

  const validContext = contexts.find((context) => context.organization.id === organizationId);

  if (!validContext) {
    return;
  }

  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE_NAME, organizationId, {
    path: "/protected",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/protected");
}
