import { describe, expect, it } from "vitest";

import { buildReceivableIncomesDashboardData } from "@/lib/finance/receivable-dashboard-server";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";

const ownerId = "owner-123";

function createMember(overrides: Partial<DbFamilyMember>): DbFamilyMember {
  return {
    id: "member-1",
    owner_id: ownerId,
    name: "Member",
    role: null,
    monthly_limit: 1000,
    currency: "BRL",
    is_active: true,
    created_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function createIncome(overrides: Partial<DbReceivableIncome>): DbReceivableIncome {
  return {
    id: "income-1",
    owner_id: ownerId,
    receiver_member_id: "member-1",
    source: "Income",
    payment_origin: null,
    income_type: "fixa",
    amount: 100,
    currency: "BRL",
    expected_date: "2999-01-01",
    status: "previsto",
    receiving_bank: null,
    notes: null,
    created_at: "2026-05-01T00:00:00.000Z",
    family_members: null,
    ...overrides,
  };
}

describe("receivable dashboard aggregation helper", () => {
  it("filters active accessible members and aggregates by computed status and income type", () => {
    const members = [
      createMember({ id: "member-visible", name: "Visible" }),
      createMember({ id: "member-hidden", name: "Hidden" }),
      createMember({ id: "member-inactive", name: "Inactive", is_active: false }),
    ];
    const incomes = [
      createIncome({
        id: "expected-income",
        amount: 1000,
        expected_date: "2999-01-01",
        status: "previsto",
        income_type: "fixa",
        receiver_member_id: "member-visible",
      }),
      createIncome({
        id: "overdue-income",
        amount: 250.5,
        expected_date: "2000-01-01",
        status: "previsto",
        income_type: "variavel",
        receiver_member_id: "member-visible",
      }),
      createIncome({
        id: "received-past-date-income",
        amount: 75,
        expected_date: "2000-01-01",
        status: "recebido",
        income_type: "variavel",
        receiver_member_id: "member-visible",
      }),
    ];

    const result = buildReceivableIncomesDashboardData({
      allMembers: members,
      incomes,
      accessibleMemberIds: ["member-visible"],
    });

    expect(result.members.map((member) => member.id)).toEqual(["member-visible"]);
    expect(result.incomes).toEqual([
      { ...incomes[0], computed_status: "previsto" },
      { ...incomes[1], computed_status: "atrasado" },
      { ...incomes[2], computed_status: "recebido" },
    ]);
    expect(result).toMatchObject({
      totalExpected: 1000,
      totalOverdue: 250.5,
      totalReceived: 75,
      totalFixed: 1000,
      totalVariable: 325.5,
      expectedCount: 1,
      overdueCount: 1,
      receivedCount: 1,
    });
  });

  it("keeps unreceived future incomes in their original status", () => {
    const member = createMember({ id: "member-1" });
    const income = createIncome({
      id: "future-income",
      expected_date: "2999-01-01",
      status: "previsto",
    });

    const result = buildReceivableIncomesDashboardData({
      allMembers: [member],
      incomes: [income],
      accessibleMemberIds: ["member-1"],
    });

    expect(result.incomes[0].computed_status).toBe("previsto");
    expect(result.totalExpected).toBe(100);
    expect(result.totalOverdue).toBe(0);
  });
});
