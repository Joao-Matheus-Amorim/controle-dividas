import { canUseFeature, getCurrentOrganizationProfile } from '@/lib/finance/access-control';
import type { FeaturePermissionKey } from '@/lib/finance/permissions';

interface GuardResult {
  allowed: boolean;
  message?: string;
}

const ACTION_TO_FEATURE: Record<string, FeaturePermissionKey> = {
  getDashboardSummary: 'view_own_dashboard',
  getUpcomingBills: 'view_own_dashboard',
  getCategorySpendingSummary: 'view_reports',
  getMemberLimitsSummary: 'view_own_limit',
};

export async function checkAiAction(
  action: string,
  organizationId: string,
): Promise<GuardResult> {
  const featureKey = ACTION_TO_FEATURE[action];

  if (!featureKey) {
    return { allowed: false, message: `Unknown action: ${action}` };
  }

  try {
    const allowed = await canUseFeature(featureKey);

    if (!allowed) {
      return {
        allowed: false,
        message: `Access denied: missing permission ${featureKey}`,
      };
    }

    const profile = await getCurrentOrganizationProfile();

    if (!profile || !profile.is_active) {
      return { allowed: false, message: 'Inactive or missing profile' };
    }

    if (profile.organization_id !== organizationId) {
      return { allowed: false, message: 'Invalid organization context' };
    }

    return { allowed: true };
  } catch {
    return { allowed: false, message: 'Guard check failed' };
  }
}
