import { financeTools } from './tools/finance-tools';

export const actionRegistry: Record<string, (...args: unknown[]) => Promise<unknown>> = {
  getDashboardSummary: financeTools.getDashboardSummary as (...args: unknown[]) => Promise<unknown>,
  getUpcomingBills: financeTools.getUpcomingBills as (...args: unknown[]) => Promise<unknown>,
};

export type AIAction = keyof typeof actionRegistry;
