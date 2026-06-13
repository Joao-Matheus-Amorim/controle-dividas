import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("owner_id active consumers inventory guards", () => {
  const inventory = read("docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md");
  const retirement = read("docs/audits/OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md");
  const betaRunbook = read("docs/runbooks/BETA_CLIENT_VALIDATION_RUNBOOK.md");
  const runbooksReadme = read("docs/runbooks/README.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const organizationHelpers = [
    "lib/organizations/banks.ts",
    "lib/organizations/categories.ts",
    "lib/organizations/expenses.ts",
    "lib/organizations/payables.ts",
    "lib/organizations/people.ts",
    "lib/organizations/receivables.ts",
  ];
  const financeActions = [
    "app/protected/bancos/actions.ts",
    "app/protected/configuracoes/actions.ts",
    "app/protected/contas-a-pagar/actions.ts",
    "app/protected/contas-a-receber/actions.ts",
    "app/protected/gastos/actions.ts",
    "app/protected/pessoas/actions.ts",
  ];

  it("records Admin as the active owner-based runtime exception", () => {
    expect(inventory).toContain("admin usa `lib/finance/admin-server.ts`");
    expect(inventory).toContain("excecao admin parcial");
    expect(inventory).toContain("read/write path e access-control ja estao organization-first");
    expect(inventory).toContain("admin/access-control owner_id retirement contract");
    expect(inventory).toContain("__tests__/integration/rls/admin-multi-org.rls.test.ts");
    expect(inventory).toContain("esse contrato ainda bloqueia schema final");
    expect(inventory).toContain("nao remove `owner_id`");
  });

  it("keeps migrated protected finance pages away from legacy owner-only helpers", () => {
    const protectedPagesDir = join(process.cwd(), "features/protected-pages");
    const files = readdirSync(protectedPagesDir).filter((file) => file.endsWith(".tsx"));

    for (const file of files) {
      const source = read(`features/protected-pages/${file}`);
      expect(source).not.toContain("@/lib/finance/server");
      expect(source).not.toContain("@/lib/finance/banks-server");
      expect(source).not.toContain("@/lib/finance/reports-server");
    }
  });

  it("keeps admin pages limited to the documented admin-server exception", () => {
    const protectedPagesDir = join(process.cwd(), "features/protected-pages");
    const adminFiles = readdirSync(protectedPagesDir)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => file.startsWith("admin"));

    expect(adminFiles.length).toBeGreaterThan(0);

    for (const file of adminFiles) {
      const source = read(`features/protected-pages/${file}`);
      expect(source).toContain("@/lib/finance/admin-server");
      expect(source).not.toContain("@/lib/finance/server");
      expect(source).not.toContain("@/lib/finance/banks-server");
      expect(source).not.toContain("@/lib/finance/reports-server");
    }
  });

  it("keeps organization helpers and finance actions away from legacy owner-only type imports", () => {
    for (const path of [...organizationHelpers, ...financeActions]) {
      const source = read(path);

      expect(source).not.toContain("@/lib/finance/server");
      expect(source).not.toContain("@/lib/finance/banks-server");
      expect(source).not.toContain("@/lib/finance/reports-server");
    }
  });

  it("registers the active-consumer inventory in live DocDoc indexes", () => {
    expect(inventory).toContain("status docdoc: atual");
    expect(retirement).toContain("owner_id_active_consumers_2026-06-01.md");
    expect(auditsReadme).toContain("owner_id_active_consumers_2026-06-01.md");
    expect(statusMap).toContain("owner_id_active_consumers_2026-06-01.md");
  });

  it("keeps beta validation separate from owner_id schema retirement", () => {
    expect(betaRunbook).toContain("status docdoc: atual");
    expect(betaRunbook).toContain("runtime por organization_id + memberships + permissoes");
    expect(betaRunbook).toContain("owner_id apenas como compatibilidade");
    expect(betaRunbook).toContain("nao fazer neste ciclo");
    expect(betaRunbook).toContain("remover coluna `owner_id`");
    expect(betaRunbook).toContain("run_post_deploy_smoke_e2e=true");
    expect(betaRunbook).toContain("playwright_base_url=url_publica_do_deploy");
    expect(betaRunbook).toContain("playwright.config.ts");
    expect(betaRunbook).toContain("production_app_url");
    expect(betaRunbook).toContain("run_data_changing_e2e=true");
    expect(betaRunbook).toContain("e2e_data_changing_email");
    expect(betaRunbook).toContain("supabase_service_role_key");
    expect(runbooksReadme).toContain("beta_client_validation_runbook.md");
    expect(statusMap).toContain("docs/runbooks/beta_client_validation_runbook.md");
  });
});
