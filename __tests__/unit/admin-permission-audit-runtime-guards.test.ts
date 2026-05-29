import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin permission audit runtime guards", () => {
  const actions = read("app/protected/admin/actions.ts");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const controlsContract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records module and feature permission updates through the audit write boundary", () => {
    expect(actions).toContain("recordauditevent");
    expect(actions).toContain("recordadminpermissionauditevent");
    expect(actions).toContain("admin.permission.update");
    expect(actions).toContain("admin.feature_permission.update");
    expect(actions).toContain('targettype: "profile"');
    expect(actions).toContain('outcome: "success"');
    expect(actions).toContain("profile_id");
    expect(actions).toContain("changed_count");
  });

  it("keeps permission writes organization scoped before emitting audit events", () => {
    expect(actions).toContain("requireorganizationaccess");
    expect(actions).toContain("ensureprofilebelongstoorganization");
    expect(actions).toContain("organization_id: organization.id");
    expect(actions).toContain('from("user_module_permissions")');
    expect(actions).toContain('from("user_feature_permissions")');
    expect(actions).toContain(".upsert(rows");
  });

  it("keeps admin permission audit runtime free of rate limit, retention, webhook, and portal work", () => {
    expect(actions).not.toContain("rate_limit");
    expect(actions).not.toContain("retention");
    expect(actions).not.toContain("stripe.webhooks");
    expect(actions).not.toContain("billing portal");
    expect(actions).not.toContain("setinterval");
    expect(actions).not.toContain("cron.schedule");
  });

  it("keeps live docs aligned with admin permission audit runtime", () => {
    for (const source of [schemaPlan, controlsContract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("admin permission audit runtime");
      expect(source).toContain("record_audit_event");
    }

    expect(schemaPlan).toContain("admin permission runtime calls `record_audit_event`");
    expect(gapRegister).toContain("admin user audit runtime");
    expect(gapRegister).toContain("finance audit logging runtime");
    expect(roadmap).toContain("sem finance audit logging");
    expect(liveStatus).toContain("finance audit logging runtime");
  });
});
