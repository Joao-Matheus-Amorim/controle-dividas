import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAiAction } from '@/lib/ai/guard';
import { auditLog } from '@/lib/ai/audit';
import { confirmIfNeeded } from '@/lib/ai/confirm';
import { actionRegistry } from '@/lib/ai/registry';
import { getCurrentOrganizationProfile } from '@/lib/finance/access-control';
import { z } from 'zod';

const aiRequestSchema = z.object({
  action: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getClaims();

    if (authError || !data?.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = aiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, payload } = parsed.data;

    const organizationId = payload.organization_id as string;

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    const guardResult = await checkAiAction(action, organizationId);

    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.message || 'Forbidden' },
        { status: 403 },
      );
    }

    const profile = await getCurrentOrganizationProfile();

    if (!profile || profile.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Invalid organization context' }, { status: 403 });
    }

    const confirmed = await confirmIfNeeded(action, payload);

    if (!confirmed) {
      return NextResponse.json({ error: 'Action not confirmed' }, { status: 409 });
    }

    const tool = actionRegistry[action];

    if (!tool) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const result = await tool(payload);

    await auditLog({
      action,
      payload,
      result: result as Record<string, unknown>,
      success: true,
      organization_id: organizationId,
      created_by: profile.id,
    });

    return NextResponse.json({ result });
  } catch (err) {
    console.error('[API AI] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
