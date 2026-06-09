import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const AUTH_HEADER_PREFIX = "Bearer ";

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";

  return authorization === `${AUTH_HEADER_PREFIX}${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "expire_pending_organization_invitations",
  );

  if (error) {
    console.error("Admin invitation expiry cleanup failed.", error);

    return NextResponse.json(
      { error: "Invitation expiry cleanup failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ expiredCount: Number(data ?? 0) });
}
