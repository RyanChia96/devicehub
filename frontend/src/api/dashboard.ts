import { BRANCHES, type BranchId } from "@/lib/branches";
import { DASHBOARD } from "@/lib/demo-data";

export interface DashboardSummary {
  sales: number;
  lastWeek: number;
  transactions: number;
  tradeIns: number;
  week: number[];
}

/** TODO(backend): GET /dashboard/?branch=… */
export async function getDashboard(branch: BranchId): Promise<DashboardSummary> {
  const ids = branch ? [branch] : BRANCHES.map((b) => b.id);
  const rows = ids.map((id) => DASHBOARD[id as keyof typeof DASHBOARD]);
  return {
    sales: rows.reduce((a, r) => a + r.sales, 0),
    lastWeek: rows.reduce((a, r) => a + r.lastWeek, 0),
    transactions: rows.reduce((a, r) => a + r.transactions, 0),
    tradeIns: rows.reduce((a, r) => a + r.tradeIns, 0),
    week: [0, 1, 2, 3, 4, 5, 6].map((i) => rows.reduce((a, r) => a + r.week[i], 0)),
  };
}
