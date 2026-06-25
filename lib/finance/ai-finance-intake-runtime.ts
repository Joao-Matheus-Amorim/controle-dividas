import "server-only";

import { getAiFinanceIntakeCatalogs } from "@/lib/finance/ai-finance-intake-catalogs";
import {
  validateAiFinanceIntakeDraft,
  type AiFinanceIntakeCatalogs,
  type AiFinanceIntakeDraft,
  type AiFinanceIntakeValidationResult,
  type AiFinanceIntent,
} from "@/lib/finance/ai-finance-intake-schema";

export type AiFinanceReviewOnlyBoundary = {
  mode: "review_only";
  intent: AiFinanceIntent;
  provider: "none";
  reviewRequired: true;
  canAutoSave: false;
  directSaveAction: null;
  catalogs: AiFinanceIntakeCatalogs;
  draft: AiFinanceIntakeDraft | null;
  missingFields: string[];
  errors: string[];
  validation: AiFinanceIntakeValidationResult;
};

export type BuildAiFinanceReviewOnlyBoundaryInput = {
  intent: AiFinanceIntent;
  draft: unknown;
  orgSlug?: string;
};

export async function buildAiFinanceReviewOnlyBoundary({
  intent,
  draft,
  orgSlug,
}: BuildAiFinanceReviewOnlyBoundaryInput): Promise<AiFinanceReviewOnlyBoundary> {
  const catalogs = await getAiFinanceIntakeCatalogs(intent, orgSlug);
  const validation = validateAiFinanceIntakeDraft(draft, catalogs);

  return {
    mode: "review_only",
    intent,
    provider: "none",
    reviewRequired: true,
    canAutoSave: false,
    directSaveAction: null,
    catalogs,
    draft: validation.draft,
    missingFields: validation.missingFields,
    errors: validation.errors,
    validation,
  };
}
