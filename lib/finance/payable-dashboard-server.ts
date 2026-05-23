import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/types";

export type PayableComputedStatus = DbPayableBill["status"] | "atrasado";

export type PayableDashboardBill = DbPayableBill & {
  computed_status: PayableComputedStatus;
};

export function buildPayableBillsDashboardData({
  allMembers,
  bills,
  accessibleMemberIds,
}: {
  allMembers: DbFamilyMember[];
  bills: DbPayableBill[];
  accessibleMemberIds: string[];
}) {
  const members = allMembers
    .filter((member) => member.is_active)
    .filter((member) => accessibleMemberIds.includes(member.id));

  const today = new Date().toISOString().slice(0, 10);
  const enrichedBills: PayableDashboardBill[] = bills.map((bill) => ({
    ...bill,
    computed_status:
      bill.status !== "pago" && bill.due_date < today ? "atrasado" : bill.status,
  }));

  const pendingBills = enrichedBills.filter((bill) => bill.computed_status === "pendente");
  const overdueBills = enrichedBills.filter((bill) => bill.computed_status === "atrasado");
  const paidBills = enrichedBills.filter((bill) => bill.computed_status === "pago");
  const oneOffBills = enrichedBills.filter((bill) => bill.bill_type === "avulsa");
  const fixedBills = enrichedBills.filter((bill) => bill.bill_type === "fixa");

  return {
    members,
    bills: enrichedBills,
    totalPending: pendingBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalOverdue: overdueBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalPaid: paidBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalOneOff: oneOffBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalFixed: fixedBills.reduce((total, bill) => total + Number(bill.amount), 0),
    pendingCount: pendingBills.length,
    overdueCount: overdueBills.length,
    paidCount: paidBills.length,
    oneOffCount: oneOffBills.length,
    fixedCount: fixedBills.length,
  };
}
