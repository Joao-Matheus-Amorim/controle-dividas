import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("SaaS hardening status docs", () => {
  const readme = read("README.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const hardeningPlan = read("docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const inventory = read("docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const e2eRoadmap = read("docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md");

  it("keeps README aligned with completed organization scope hardening and RLS fallback removal", () => {
    expect(readme).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(readme).toContain("021_family_members_organization_scope_hardening.sql");
    expect(readme).toContain("028_profiles_organization_scope_hardening.sql");
    expect(readme).toContain("030_expense_categories_rls_remove_legacy_fallback.sql");
    expect(readme).toContain("038_user_feature_permissions_rls_remove_legacy_fallback.sql");
    expect(readme).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(readme).toContain("fallback `organization_id is null` removido");
    expect(readme).toContain("versiona a limpeza idempotente das policies antigas `*_own`/`*_family`");
    expect(readme).toContain("/org/[orgslug]");
    expect(readme).toContain("run_orgslug_e2e=true");
    expect(readme).not.toContain("rotas por `orgslug` ainda nao foram implementadas");
    expect(readme).not.toContain("rotas ainda usam `/protected`");
  });

  it("keeps live SaaS status aligned with the completed hardening summary", () => {
    expect(liveStatus).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(liveStatus).toContain("021_family_members_organization_scope_hardening.sql");
    expect(liveStatus).toContain("028_profiles_organization_scope_hardening.sql");
    expect(liveStatus).toContain("030_expense_categories_rls_remove_legacy_fallback.sql");
    expect(liveStatus).toContain("038_user_feature_permissions_rls_remove_legacy_fallback.sql");
    expect(liveStatus).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(liveStatus).toContain("organization_id not null");
    expect(liveStatus).toContain("fallback rls legado `organization_id is null`");
  });

  it("records the live Supabase RLS policy application evidence", () => {
    expect(liveStatus).toContain("evidencia operacional de 2026-05-28");
    expect(liveStatus).toContain("policies rls finais de remocao");
    expect(liveStatus).toContain("policies antigas owner-centric");
    expect(liveStatus).toContain("policies `*_own` das tabelas financeiras");
    expect(liveStatus).toContain("policies `profiles_*_family`");
    expect(liveStatus).toContain("policies `feature_permissions_*_family`");
    expect(liveStatus).toContain("9 test files passed; 18 tests passed");
    expect(liveStatus).toContain("gate local completo foi reportado como aprovado");
    expect(liveStatus).toContain("npm audit --audit-level=moderate");
    expect(liveStatus).toContain("npm run test:e2e");
  });

  it("records the dedicated RLS Live Gate CI evidence", () => {
    expect(liveStatus).toContain("evidencia operacional de 2026-06-03");
    expect(liveStatus).toContain("run id: 26913026310");
    expect(liveStatus).toContain("run attempt: 5");
    expect(liveStatus).toContain("sha: 40093ab24559f064da59d46f5c88b48dc1b65d2c");
    expect(liveStatus).toContain("environment validation outcome: passed");
    expect(liveStatus).toContain("test step outcome: success");
    expect(liveStatus).toContain("artifact: rls-live-gate-evidence-26913026310-5");
    expect(roadmap).toContain("fechado-004 - rls live gate com evidencia de ci");
    expect(roadmap).toContain("rls-live-gate-evidence-26913026310-5");
    expect(gapRegister).toContain("rls live gate is green in run `26913026310`");
  });

  it("keeps the hardening plan explicit about completed profiles hardening", () => {
    expect(hardeningPlan).toContain("`expense_categories` | hardened");
    expect(hardeningPlan).toContain("`family_members` | hardened");
    expect(hardeningPlan).toContain("`expenses` | hardened");
    expect(hardeningPlan).toContain("`profiles` | hardened");
    expect(hardeningPlan).toContain("028_profiles_organization_scope_hardening.sql");
    expect(hardeningPlan).toContain("profiles note");
    expect(hardeningPlan).toContain("already completed in this sequence");
  });

  it("keeps the operational roadmap focused on the remaining real gaps", () => {
    expect(roadmap).toContain("saaS operational roadmap".toLowerCase());
    expect(roadmap).toContain("fechado-001 - limpeza de policies antigas versionada");
    expect(roadmap).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(roadmap).toContain("rls live gate");
    expect(roadmap).toContain("github step summary");
    expect(roadmap).toContain("rls-live-gate-evidence-*");
    expect(roadmap).toContain("execucao real verde");
    expect(roadmap).toContain("e2e multi-org switch");
    expect(roadmap).toContain("fechado-003 - rotas por `orgslug`");
    expect(roadmap).toContain("wrappers `app/org/[orgslug]`");
    expect(roadmap).toContain("dashboard possui contrato de ui");
    expect(roadmap).toContain("docs/audits/dashboard_ui_contract.md");
    expect(roadmap).toContain("listas financeiras primarias possuem contrato de ui");
    expect(roadmap).toContain("docs/audits/finance_list_ui_contract.md");
    expect(roadmap).toContain("formularios financeiros primarios possuem contrato de ui");
    expect(roadmap).toContain("docs/audits/finance_form_ui_contract.md");
    expect(roadmap).toContain("estrategia de snapshot visual seletivo esta documentada");
    expect(roadmap).toContain("docs/audits/selective_visual_snapshot_strategy.md");
    expect(roadmap).toContain("fixture deterministica do dashboard summary acima da dobra");
    expect(roadmap).toContain("docs/audits/dashboard_summary_visual_fixture.md");
    expect(roadmap).toContain("tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts");
    expect(roadmap).toContain("docs/audits/billing_settings_status_contract.md");
    expect(roadmap).toContain("docs/audits/billing_subscription_flow_contract.md");
    expect(roadmap).toContain("docs/audits/billing_stripe_configuration_boundary.md");
    expect(roadmap).toContain("plano atual da organizacao");
    expect(roadmap).toContain("fronteira de configuracao stripe");
    expect(roadmap).toContain("billing portal runtime");
    expect(roadmap).toContain("evidencia real de checkout e portal stripe ainda esta pendente");
    expect(roadmap).toContain("criar/configurar conta stripe de teste");
    expect(roadmap).toContain("gap-011 - contratos de ui financeira");
    expect(roadmap).not.toContain("gap-005 - contratos de ui financeira");
    expect(roadmap).toContain("gap-005 - remocao futura de `owner_id`");
    expect(roadmap).not.toContain("gap-004 - remocao futura de `owner_id`");
    expect(roadmap).toContain("billing");
    expect(roadmap).toContain("owner_id retirement plan");
  });

  it("keeps the RLS inventory explicit about the migration-history cleanup gap", () => {
    expect(inventory).toContain("migration history");
    expect(inventory).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(inventory).toContain("policies antigas `*_own`/`*_family`");
    expect(inventory).toContain("drop policy if exists");
    expect(inventory).toContain("user_feature_permissions");
    expect(inventory).toContain("gap operacional fechado na cadeia de migrations");
    expect(inventory).toContain("`owner_id` ainda e transicional");
  });

  it("keeps the gap register and E2E roadmap aligned with completed orgSlug work", () => {
    expect(gapRegister).toContain("explicit organization routes `/org/[orgslug]`");
    expect(gapRegister).toContain("gap-002 | routes | adr 0007");
    expect(gapRegister).toContain("gap-008 | multi-org tests");
    expect(gapRegister).toContain("gap-006 remains a product implementation risk");
    expect(gapRegister).toContain("billing settings status ui");
    expect(gapRegister).toContain("subscription flow contract");
    expect(gapRegister).toContain("stripe configuration boundary");
    expect(gapRegister).toContain("stripe checkout runtime");
    expect(gapRegister).toContain("billing portal runtime");
    expect(gapRegister).toContain("real stripe checkout and portal evidence is pending");
    expect(gapRegister).toContain("stripe test account and credentials");
    expect(gapRegister).toContain("dashboard, primary finance lists, primary data-changing forms, selective visual snapshot strategy, dashboard summary deterministic fixture, and gated dashboard summary screenshot are documented");
    expect(gapRegister).toContain("validate the first gated screenshot");
    expect(gapRegister).not.toContain("protected routes still use `/protected` instead of explicit organization routes");
    expect(gapRegister).not.toContain("switching between organizations has no dedicated tests");

    expect(e2eRoadmap).toContain("orgslug route contract");
    expect(e2eRoadmap).toContain("/org/[orgslug]");
    expect(e2eRoadmap).toContain("inaccessible slug");
    expect(e2eRoadmap).toContain("dashboard-summary-above-fold");
    expect(e2eRoadmap).toContain("run_dashboard_summary_visual_snapshot=true");
  });

  it("keeps the billing plan contract documented as the start of GAP-006", () => {
    const adrIndex = read("docs/adr/README.md");
    const billingAdr = read("docs/adr/0008-billing-plan-contract-before-stripe.md");

    expect(adrIndex).toContain("0008-billing-plan-contract-before-stripe.md");
    expect(adrIndex).toContain("checkout e portal em prs proprios");
    expect(adrIndex).toContain("webhook separado por contrato pre-runtime");
    expect(billingAdr).toContain("lib/billing/plans.ts");
    expect(billingAdr).toContain("free");
    expect(billingAdr).toContain("family_basic");
    expect(billingAdr).toContain("family_plus");
    expect(billingAdr).toContain("family_pro");
    expect(billingAdr).toContain("settings-billing-plan-status.tsx");
    expect(billingAdr).toContain("billing_subscription_flow_contract.md");
    expect(billingAdr).toContain("billing_stripe_configuration_boundary.md");
    expect(billingAdr).toContain("checkout runtime");
    expect(billingAdr).toContain("billing portal runtime");
    expect(billingAdr).toContain("nao implementa");
    expect(billingAdr).toContain("webhooks");
  });
});
