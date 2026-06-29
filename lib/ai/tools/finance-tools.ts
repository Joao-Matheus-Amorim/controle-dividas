import { z } from 'zod';
import { getAccessibleMemberIds } from '@/lib/finance/access-control';
import { createClient } from '@/lib/supabase/server';

export const dashboardSchema = z.object({
  organization_id: z.string().uuid(),
});

export const upcomingBillsSchema = z.object({
  organization_id: z.string().uuid(),
});

export const categorySpendingSchema = z.object({
  organization_id: z.string().uuid(),
});

export const memberLimitsSchema = z.object({
  organization_id: z.string().uuid(),
});

export type DashboardPayload = z.infer<typeof dashboardSchema>;
export type UpcomingBillsPayload = z.infer<typeof upcomingBillsSchema>;
export type CategorySpendingPayload = z.infer<typeof categorySpendingSchema>;
export type MemberLimitsPayload = z.infer<typeof memberLimitsSchema>;

function getExpenseCategoryName(expense: { expense_categories?: { name?: string | null } | { name?: string | null }[] | null }) {
  const category = Array.isArray(expense.expense_categories)
    ? expense.expense_categories[0]
    : expense.expense_categories;

  return category?.name ?? 'Sem categoria';
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export const financeTools = {
  async getDashboardSummary(payload: DashboardPayload) {
    const supabase = await createClient();
    const expenseMemberIds = await getAccessibleMemberIds('GASTOS', 'can_view');
    const payableMemberIds = await getAccessibleMemberIds('CONTAS_A_PAGAR', 'can_view');

    const { data: expenses } = expenseMemberIds.length > 0
      ? await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', payload.organization_id)
        .in('family_member_id', expenseMemberIds)
      : { data: [] };

    const totalExpenses =
      expenses?.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0) || 0;

    const { data: bills } = payableMemberIds.length > 0
      ? await supabase
        .from('payable_bills')
        .select('amount')
        .eq('organization_id', payload.organization_id)
        .eq('status', 'pendente')
        .in('responsible_member_id', payableMemberIds)
      : { data: [] };

    const totalOpenBills =
      bills?.reduce((sum: number, bill: { amount: number }) => sum + bill.amount, 0) || 0;

    return {
      totalExpenses,
      totalOpenBills,
      organization_id: payload.organization_id,
    };
  },

  async getUpcomingBills(payload: UpcomingBillsPayload) {
    const supabase = await createClient();
    const payableMemberIds = await getAccessibleMemberIds('CONTAS_A_PAGAR', 'can_view');

    if (payableMemberIds.length === 0) {
      return [];
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: bills, error } = await supabase
      .from('payable_bills')
      .select('*')
      .eq('organization_id', payload.organization_id)
      .eq('status', 'pendente')
      .in('responsible_member_id', payableMemberIds)
      .lte('due_date', thirtyDaysFromNow.toISOString())
      .gte('due_date', new Date().toISOString());

    if (error) throw error;
    return bills;
  },

  async getCategorySpendingSummary(payload: CategorySpendingPayload) {
    const supabase = await createClient();
    const expenseMemberIds = await getAccessibleMemberIds('GASTOS', 'can_view');
    const { startDate, endDate } = getCurrentMonthRange();

    if (expenseMemberIds.length === 0) {
      return [];
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount, expense_categories(name)')
      .eq('organization_id', payload.organization_id)
      .in('family_member_id', expenseMemberIds)
      .gte('expense_date', startDate)
      .lt('expense_date', endDate);

    if (error) throw error;

    const totals = new Map<string, number>();

    for (const expense of expenses ?? []) {
      const categoryName = getExpenseCategoryName(expense);
      totals.set(categoryName, (totals.get(categoryName) ?? 0) + Number(expense.amount ?? 0));
    }

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .map((summary) => ({ ...summary, start_date: startDate, end_date: endDate }));
  },

  async getMemberLimitsSummary(payload: MemberLimitsPayload) {
    const supabase = await createClient();
    const expenseMemberIds = await getAccessibleMemberIds('GASTOS', 'can_view');
    const { startDate, endDate } = getCurrentMonthRange();

    if (expenseMemberIds.length === 0) {
      return [];
    }

    const [{ data: members, error: membersError }, { data: expenses, error: expensesError }] = await Promise.all([
      supabase
        .from('family_members')
        .select('id, name, monthly_limit, currency')
        .eq('organization_id', payload.organization_id)
        .in('id', expenseMemberIds),
      supabase
        .from('expenses')
        .select('family_member_id, amount')
        .eq('organization_id', payload.organization_id)
        .in('family_member_id', expenseMemberIds)
        .gte('expense_date', startDate)
        .lt('expense_date', endDate),
    ]);

    if (membersError) throw membersError;
    if (expensesError) throw expensesError;

    const spentByMember = new Map<string, number>();

    for (const expense of expenses ?? []) {
      const memberId = String(expense.family_member_id ?? '');
      if (!memberId) continue;
      spentByMember.set(memberId, (spentByMember.get(memberId) ?? 0) + Number(expense.amount ?? 0));
    }

    return (members ?? []).map((member) => {
      const spent = spentByMember.get(String(member.id)) ?? 0;
      const limit = Number(member.monthly_limit ?? 0);

      return {
        member_id: member.id,
        member_name: member.name,
        currency: member.currency,
        monthly_limit: limit,
        spent,
        remaining: limit - spent,
        start_date: startDate,
        end_date: endDate,
      };
    });
  },
};

export type FinanceTools = typeof financeTools;
