import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin access-control owner_id retirement contract guards", () => {
  const contract = read("docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md");
  const activeConsumers = read("docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const adminMultiOrgRls = read("__tests__/integration/rls/admin-multi-org.rls.test.ts");

  it("keeps admin/access-control transitional until the required gates exist", () => {
    expect(contract).toContain("status docdoc: atual como contrato com read/write path admin organization-first");
    expect(contract).toContain("organization admin gate + organization.id");
    expect(contract).toContain("admin/access-control pronto para remover owner_id agora");
    expect(contract).toContain("estado proibido como conclusao");
    expect(contract).toContain("rls live gate verde com artifact");
    expect(contract).toContain("fixture rls cobrindo admin em duas organizacoes");
    expect(contract).toContain("rollback documentado");
    expect(contract).toContain("requireorganizationadmin(orgslug)");
    expect(contract).toContain("read/write path admin em `lib/finance/admin-server.ts` e `app/protected/admin/actions.ts` exige admin da organizacao ativa e esta organization-first");
    expect(contract).toContain("access-control organization-first em pr dedicado");
  });

  it("preserves admin audit and rate-limit boundaries before any refactor", () => {
    expect(contract).toContain("manutencao dos audit events admin");
    expect(contract).toContain("manutencao dos rate limits admin");
    expect(contract).toContain("writes admin devem continuar auditados e rate-limited");
    expect(contract).toContain("admin pages podem importar `@/lib/finance/admin-server`");
    expect(contract).not.toContain("admin/access-control permanece final");
  });

  it("keeps the admin multi-org RLS fixture concrete and owner-independent", () => {
    expect(contract).toContain("__tests__/integration/rls/admin-multi-org.rls.test.ts");
    expect(adminMultiOrgRls).toContain("admin multi-org rls gated integration");
    expect(adminMultiOrgRls).toContain("without shared owner_id");
    expect(adminMultiOrgRls).toContain('role: "admin"');
    expect(adminMultiOrgRls).toContain("owner_id: userbid");
    expect(adminMultiOrgRls).toContain("user_module_permissions");
    expect(adminMultiOrgRls).toContain("user_feature_permissions");
    expect(adminMultiOrgRls).toContain("const rlsit = runrlstests ? it : it.skip");
  });

  it("registers the contract in live DocDoc sources", () => {
    expect(activeConsumers).toContain("admin_access_control_owner_id_retirement_contract.md");
    expect(auditsReadme).toContain("admin_access_control_owner_id_retirement_contract.md");
    expect(statusMap).toContain("admin_access_control_owner_id_retirement_contract.md");
  });
});
