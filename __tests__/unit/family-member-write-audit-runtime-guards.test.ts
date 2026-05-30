import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function functionBlock(source: string, functionName: string) {
  const startToken = `export async function ${functionName}`;
  const start = source.indexOf(startToken);

  expect(start, `missing function ${functionName}`).toBeGreaterThanOrEqual(0);

  const next = source.indexOf("\nexport async function ", start + startToken.length);

  return source.slice(start, next >= 0 ? next : source.length);
}

function rateLimitCallBlock(source: string, spreadName: string) {
  const spreadStart = source.indexOf(`...${spreadName}`);

  expect(spreadStart, `missing rate limit ${spreadName}`).toBeGreaterThanOrEqual(0);

  const callStart = source.lastIndexOf("checksensitiveoperationratelimit({", spreadStart);
  const callEnd = source.indexOf("});", spreadStart);

  expect(callStart, `missing call start for ${spreadName}`).toBeGreaterThanOrEqual(0);
  expect(callEnd, `missing call end for ${spreadName}`).toBeGreaterThanOrEqual(0);

  return source.slice(callStart, callEnd);
}

describe("family member write audit runtime guards", () => {
  const peopleActions = read("app/protected/pessoas/actions.ts");
  const writeControls = read("lib/finance/member-write-controls.ts");
  const createAction = functionBlock(peopleActions, "createfamilymember");
  const updateAction = functionBlock(peopleActions, "updatefamilymember");
  const memberCreateRateLimitCall = rateLimitCallBlock(createAction, "familymembercreateratelimit");
  const memberUpdateRateLimitCall = updateAction;
  const actions = [peopleActions, writeControls].join("\n");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records member create and profile update through shared audit and rate limit boundaries", () => {
    expect(actions).toContain("recordfamilymemberwriteauditevent");
    expect(actions).toContain("finance.member.create");
    expect(actions).toContain("finance.member.update");
    expect(actions).toContain('targettype: "family_member"');
    expect(actions).toContain("checksensitiveoperationratelimit");
    expect(actions).toContain('operationkey: "finance.member.create"');
    expect(actions).toContain('operationkey: "finance.member.update"');

    expect(createAction).toContain("familymembercreateratelimit");
    expect(createAction).toContain("actorkey: profile.id");
    expect(createAction).toContain("organizationid: organization.id");
    expect(createAction).not.toContain("targetkey:");
    expect(createAction).toContain(".select(\"id\").single()");
    expect(createAction).toContain("member_created");

    expect(updateAction).toContain('select("id, name, role, monthly_limit")');
    expect(updateAction).toContain("const profilechanged");
    expect(updateAction).toContain("familymemberupdateratelimit");
    expect(updateAction).toContain("actorkey: profile.id");
    expect(updateAction).toContain("targetkey: id");
    expect(updateAction).toContain("member_profile_changed");
    expect(updateAction).toContain('outcome: "denied"');
    expect(updateAction).toContain("rate_limited");
    expect(updateAction).toContain("if (count !== 1)");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("member_created");
    expect(actions).toContain("member_profile_changed");
    expect(actions).not.toContain("previous_name");
    expect(actions).not.toContain("next_name");
    expect(actions).not.toContain("previous_role");
    expect(actions).not.toContain("next_role");
    expect(actions).not.toContain("previous_limit");
    expect(actions).not.toContain("next_limit");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("does not share member write rate limit buckets through the family owner id", () => {
    expect(memberCreateRateLimitCall).toContain("actorkey: profile.id");
    expect(memberUpdateRateLimitCall).toContain("actorkey: profile.id");
    expect(memberCreateRateLimitCall).not.toContain("actorkey: profile.owner_id");
    expect(memberUpdateRateLimitCall).not.toContain("actorkey: profile.owner_id");
  });

  it("keeps docs aligned with member write runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.member.create");
      expect(source).toContain("finance.member.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member write rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member write audit runtime");
    }
  });
});
