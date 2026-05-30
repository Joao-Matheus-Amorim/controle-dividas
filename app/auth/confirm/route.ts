import { linkAuthUserToFamilyProfile } from "@/lib/finance/profile-linking";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

const authConfirmRateLimit = {
  operationKey: "auth.confirm.verify",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function getPublicAuthActorKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown-client";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/protected";

  if (!token_hash || !type) {
    redirect(`/auth/error?error=No token hash or type`);
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...authConfirmRateLimit,
    actorKey: getPublicAuthActorKey(request),
    organizationId: "public-auth",
    targetKey: type,
  });

  if (!rateLimit.allowed) {
    redirect("/auth/error?error=Muitas tentativas de confirmacao. Tente novamente em alguns minutos.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (!error) {
    const { data } = await supabase.auth.getClaims();
    const authUserId = data?.claims?.sub ? String(data.claims.sub) : null;
    const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

    if (authUserId) {
      await linkAuthUserToFamilyProfile({ authUserId, email });
    }

    redirect(next);
  }

  redirect(`/auth/error?error=${error?.message}`);
}
