import { z } from 'zod';
import { getAccessibleMemberIds } from '@/lib/finance/access-control';
import { createClient } from '@/lib/supabase/server';

export const dashboardSchema = z.object({
  organization_id: z.string().uuid(),
});

export const upcomingBillsSchema = z.object({
  organization_id: z.string().uuid(),
});

export type DashboardPayload = z.infer<typeof dashboardSchema>;
export type UpcomingBillsPayload = z.infer<typeof upcomingBillsSchema>;

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
};

export type FinanceTools = typeof financeTools;
