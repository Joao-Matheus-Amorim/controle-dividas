import { describe, expect, it } from "vitest";

import { buildPayableBillsDashboardData } from "@/lib/finance/payable-dashboard-server";
import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/types";

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

function createBill(overrides: Partial<DbPayableBill>): DbPayableBill {
  return {
    id: "bill-1",
    owner_id: ownerId,
    name: "Bill",
    category: "Casa",
    amount: 100,
    currency: "BRL",
    due_date: "2999-01-01",
    responsible_member_id: "member-1",
    status: "pendente",
    bill_type: "avulsa",
    bank_used: null,
    recurrence: null,
    notes: null,
    created_at: "2026-05-01T00:00:00.000Z",
    family_members: null,
    ...overrides,
  };
}

describe("payable dashboard aggregation helper", () => {
  it("filters active accessible members and aggregates by computed status and bill type", () => {
    const members = [
      createMember({ id: "member-visible", name: "Visible" }),
      createMember({ id: "member-hidden", name: "Hidden" }),
      createMember({ id: "member-inactive", name: "Inactive", is_active: false }),
    ];
    const bills = [
      createBill({
        id: "pending-bill",
        amount: 100,
        due_date: "2999-01-01",
        status: "pendente",
        bill_type: "avulsa",
        responsible_member_id: "member-visible",
      }),
      createBill({
        id: "overdue-bill",
        amount: 250.5,
        due_date: "2000-01-01",
        status: "pendente",
        bill_type: "fixa",
        responsible_member_id: "member-visible",
      }),
      createBill({
        id: "paid-past-due-bill",
        amount: 75,
        due_date: "2000-01-01",
        status: "pago",
        bill_type: "fixa",
        responsible_member_id: "member-visible",
      }),
    ];

    const result = buildPayableBillsDashboardData({
      allMembers: members,
      bills,
      accessibleMemberIds: ["member-visible"],
    });

    expect(result.members.map((member) => member.id)).toEqual(["member-visible"]);
    expect(result.bills).toEqual([
      { ...bills[0], computed_status: "pendente" },
      { ...bills[1], computed_status: "atrasado" },
      { ...bills[2], computed_status: "pago" },
    ]);
    expect(result).toMatchObject({
      totalPending: 100,
      totalOverdue: 250.5,
      totalPaid: 75,
      totalOneOff: 100,
      totalFixed: 325.5,
      pendingCount: 1,
      overdueCount: 1,
      paidCount: 1,
      oneOffCount: 1,
      fixedCount: 2,
    });
  });

  it("keeps unpaid future bills in their original status", () => {
    const member = createMember({ id: "member-1" });
    const bill = createBill({
      id: "future-bill",
      due_date: "2999-01-01",
      status: "pendente",
    });

    const result = buildPayableBillsDashboardData({
      allMembers: [member],
      bills: [bill],
      accessibleMemberIds: ["member-1"],
    });

    expect(result.bills[0].computed_status).toBe("pendente");
    expect(result.totalPending).toBe(100);
    expect(result.totalOverdue).toBe(0);
  });
});
