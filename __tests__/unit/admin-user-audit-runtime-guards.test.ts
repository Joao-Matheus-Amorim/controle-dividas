import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin user audit runtime guards", () => {
  const actions = read("app/protected/admin/actions.ts");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const controlsContract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records admin user lifecycle events through the audit write boundary", () => {
    expect(actions).toContain("recordadminuserauditevent");
    expect(actions).toContain("admin.user.create");
    expect(actions).toContain("admin.user.update");
    expect(actions).toContain("admin.user.auth_link.sync");
    expect(actions).toContain("admin.user.delete");
    expect(actions).toContain("admin.user.deactivate");
    expect(actions).toContain("admin.user.activate");
    expect(actions).toContain('targettype: "profile"');
    expect(actions).toContain('outcome: "success"');
  });

  it("keeps lifecycle events scoped after organization-owned profile writes", () => {
    expect(actions).toContain("requireorganizationaccess");
    expect(actions).toContain("ensureadminprofile");
    expect(actions).toContain("organization_id: organization.id");
    expect(actions).toContain('from("profiles")');
    expect(actions).toContain('from("user_module_permissions")');
    expect(actions).toContain("profileid: profile.id");
    expect(actions).toContain("profileid: id");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("default_permission_count");
    expect(actions).toContain("fields_changed");
    expect(actions).toContain("auth_linked");
    expect(actions).toContain("previous_active");
    expect(actions).toContain("next_active");
    expect(actions).not.toContain("password");
    expect(actions).not.toContain("service_role");
    expect(actions).not.toContain("raw_payload");
    expect(actions).not.toContain("full_payload");
  });

  it("derives status lifecycle events from persisted profile state", () => {
    const statusStart = actions.indexOf("export async function togglefamilyuserstatus");
    const statusBody = actions.slice(statusStart);

    expect(statusBody).toContain('.select("id, role, is_active")');
    expect(statusBody).toContain('formdata.get("is_active")');
    expect(statusBody).toContain("const currentactive = profile.is_active === true");
    expect(statusBody).toContain('if (currentactive !== submittedactive)');
    expect(statusBody).toContain("const nextactive = !currentactive");
    expect(statusBody).toContain('action: currentactive ? "admin.user.deactivate" : "admin.user.activate"');
  });

  it("keeps docs aligned with admin user audit runtime and remaining GAP-015 work", () => {
    for (const source of [schemaPlan, controlsContract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("admin user audit runtime");
      expect(source).toContain("record_audit_event");
    }

    expect(gapRegister).toContain("payable bill audit runtime");
    expect(gapRegister).toContain("receivable income audit runtime");
    expect(gapRegister).toContain("expense audit runtime");
    expect(gapRegister).toContain("bank audit runtime");
    expect(roadmap).toContain("rate limiting e data retention ainda nao tem runtime implementado");
    expect(liveStatus).toContain("rate limiting e data retention runtime controls ainda nao foram implementados");
  });
});
