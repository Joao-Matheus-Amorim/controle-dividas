import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const entity = url.searchParams.get("entity");
    const id = url.searchParams.get("id");

    if (!entity || !id) {
      return NextResponse.json({ error: "Missing entity or id" }, { status: 400 });
    }

    const profile = await getCurrentOrganizationProfile();
    if (!profile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (entity === "expense") {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ result: data });
    }

    if (entity === "payable_bill") {
      const { data, error } = await supabase
        .from("payable_bills")
        .select("*")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ result: data });
    }

    if (entity === "receivable_income") {
      const { data, error } = await supabase
        .from("receivable_incomes")
        .select("*")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ result: data });
    }

    if (entity === "bank") {
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ result: data });
    }

    return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
  } catch (err) {
    console.error("[API Get Record] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}