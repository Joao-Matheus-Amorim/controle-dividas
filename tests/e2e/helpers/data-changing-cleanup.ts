import { createClient } from "@supabase/supabase-js";

const e2eMarkerPrefix = "e2e-";
const safeE2eMarkerPattern = /^e2e-[a-z0-9-]+-\d{13}-[a-z0-9]{6}$/;

export function createE2eRunMarker(scope: string) {
  const normalizedScope = scope.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${e2eMarkerPrefix}${normalizedScope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function assertSafeE2eMarker(marker: string) {
  if (!safeE2eMarkerPattern.test(marker)) {
    throw new Error("Refusing to cleanup records without a safe E2E marker.");
  }
}

function createCleanupClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Data-changing E2E cleanup requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function cleanupFamilyMembersByNameMarker(marker: string) {
  assertSafeE2eMarker(marker);

  const supabase = createCleanupClient();
  const { error } = await supabase
    .from("family_members")
    .delete()
    .ilike("name", `%${marker}%`);

  if (error) {
    throw new Error(`Failed to cleanup family_members for marker ${marker}: ${error.message}`);
  }
}

export async function cleanupExpensesByDescriptionMarker(marker: string) {
  assertSafeE2eMarker(marker);

  const supabase = createCleanupClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .ilike("description", `%${marker}%`);

  if (error) {
    throw new Error(`Failed to cleanup expenses for marker ${marker}: ${error.message}`);
  }
}
export async function cleanupPayableBillsByNameMarker(marker: string) {
  assertSafeE2eMarker(marker);

  const supabase = createCleanupClient();
  const { error } = await supabase
    .from("payable_bills")
    .delete()
    .ilike("name", `%${marker}%`);

  if (error) {
    throw new Error(`Failed to cleanup payable_bills for marker ${marker}: ${error.message}`);
  }
}
export async function cleanupReceivableIncomesByNotesMarker(marker: string) {
  assertSafeE2eMarker(marker);

  const supabase = createCleanupClient();
  const { error } = await supabase
    .from("receivable_incomes")
    .delete()
    .ilike("notes", `%${marker}%`);

  if (error) {
    throw new Error(`Failed to cleanup receivable_incomes for marker ${marker}: ${error.message}`);
  }
}
