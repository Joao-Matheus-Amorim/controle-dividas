import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const AUTH_HEADER_PREFIX = 'Bearer ';

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get('authorization') ?? '';

  return authorization === `${AUTH_HEADER_PREFIX}${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .rpc('delete_expired_audit_logs', { p_days_to_keep: 90 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    deleted: data, 
    timestamp: new Date().toISOString() 
  });
}
