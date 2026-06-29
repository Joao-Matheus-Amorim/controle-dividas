import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { clearConversation } from "@/lib/ai/conversation";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const organization_id = body?.organization_id as string | undefined;

    if (!organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }

    const profile = await getCurrentOrganizationProfile();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Inactive or missing profile" }, { status: 403 });
    }

    if (profile.organization_id !== organization_id) {
      return NextResponse.json({ error: "Invalid organization context" }, { status: 403 });
    }

    clearConversation(organization_id, profile.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API AI Chat Clear] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
