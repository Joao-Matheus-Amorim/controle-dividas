import { revalidatePath } from "next/cache";

import { getOrgPathFromProtectedPath } from "./paths";

export function revalidateOrganizationPaths(
  protectedPaths: string[],
  orgSlug?: string | null,
) {
  for (const protectedPath of protectedPaths) {
    revalidatePath(protectedPath);

    const orgPath = getOrgPathFromProtectedPath(protectedPath, orgSlug);
    if (orgPath !== protectedPath) {
      revalidatePath(orgPath);
    }
  }
}
