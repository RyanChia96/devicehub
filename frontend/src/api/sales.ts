import type { BranchId } from "@/lib/branches";
import { DEMO_SALES, MONTHLY_2026_EARLIER, SALES_STAFF, YEARLY, type SaleCategory, type SaleLine } from "@/lib/demo-sales";

export type { SaleCategory, SaleLine, Staff } from "@/lib/demo-sales";
export { SALES_STAFF } from "@/lib/demo-sales";

/** TODO(backend): GET /sales/?branch=…&from=…&to=… */
export async function getSales(branch: BranchId): Promise<SaleLine[]> {
  return DEMO_SALES.filter((s) => !branch || s.branch === branch);
}

export interface PeriodTotal {
  label: string;
  sales: number;
  cost: number;
  transactions: number;
}

/**
 * Month totals for 2026. Oct and Nov come from the sale lines; earlier months
 * are sample figures for all branches, scaled down for a single branch.
 * TODO(backend): GET /reports/monthly/?year=2026&branch=…
 */
export async function getMonthly(branch: BranchId): Promise<PeriodTotal[]> {
  const share = branch === "KLSW" ? 0.46 : branch === "PJ" ? 0.32 : branch === "JB" ? 0.22 : 1;
  const lines = await getSales(branch);
  const sum = (m: string) => {
    const ls = lines.filter((l) => l.date.startsWith(m));
    return { sales: ls.reduce((a, l) => a + l.amount, 0), cost: ls.reduce((a, l) => a + l.cost, 0), transactions: ls.length };
  };
  return [
    ...MONTHLY_2026_EARLIER.map((m) => ({
      label: m.month,
      sales: Math.round(m.sales * share),
      cost: Math.round(m.cost * share),
      transactions: Math.round(m.transactions * share),
    })),
    { label: "Oct", ...sum("2026-10") },
    { label: "Nov", ...sum("2026-11") },
  ];
}

/** TODO(backend): GET /reports/yearly/?branch=… */
export async function getYearly(branch: BranchId): Promise<PeriodTotal[]> {
  const share = branch === "KLSW" ? 0.46 : branch === "PJ" ? 0.32 : branch === "JB" ? 0.22 : 1;
  const months = await getMonthly(branch);
  const ytd = months.reduce(
    (a, m) => ({ sales: a.sales + m.sales, cost: a.cost + m.cost, transactions: a.transactions + m.transactions }),
    { sales: 0, cost: 0, transactions: 0 },
  );
  return [
    ...YEARLY.map((y) => ({
      label: y.year,
      sales: Math.round(y.sales * share),
      cost: Math.round(y.cost * share),
      transactions: Math.round(y.transactions * share),
    })),
    { label: "2026", ...ytd },
  ];
}

// ---------------------------------------------------------------- commission

export type CommissionStatus = "In progress" | "Pending approval" | "Approved" | "Paid";

export interface CommissionRates {
  /** % of sale price after discount. */
  new: number;
  comp: number;
  acc: number;
  /** RM per unit. */
  used: number;
}

let rates: CommissionRates = { new: 1, comp: 0.8, acc: 5, used: 40 };
/** October is closed and keeps the rates it was calculated with. */
const OCTOBER_RATES: CommissionRates = { new: 1, comp: 0.8, acc: 5, used: 40 };
let statuses: Record<string, CommissionStatus> = {
  "2026-10:aisyah": "Paid",
  "2026-10:daniel": "Paid",
  "2026-10:farid": "Paid",
  "2026-10:kevin": "Approved",
  "2026-10:nurul": "Approved",
  "2026-10:siti": "Pending approval",
  "2026-10:rajesh": "Pending approval",
};

export const CATEGORY_LABEL: Record<SaleCategory, string> = {
  new: "New phones",
  comp: "Laptops & tablets",
  acc: "Accessories",
  used: "Used & trade-in phones",
};

export function commissionFor(line: SaleLine, r: CommissionRates): number {
  if (line.category === "used") return (line.amount < 0 ? -1 : 1) * r.used;
  return Math.round(line.amount * r[line.category]) / 100;
}

/** TODO(backend): GET /commission/rates/ */
export async function getRates(month: string): Promise<CommissionRates> {
  return month === "2026-10" ? { ...OCTOBER_RATES } : { ...rates };
}

/** TODO(backend): PUT /commission/rates/ (applies from the open month). */
export async function saveRates(next: CommissionRates): Promise<void> {
  rates = { ...next };
}

/** TODO(backend): GET /commission/statements/?month=… */
export async function getCommissionStatuses(month: string): Promise<Record<string, CommissionStatus>> {
  const out: Record<string, CommissionStatus> = {};
  for (const s of SALES_STAFF) out[s.id] = statuses[`${month}:${s.id}`] ?? (month === "2026-11" ? "In progress" : "Paid");
  return out;
}

/** TODO(backend): POST /commission/statements/:id/status/ */
export async function setCommissionStatus(month: string, staffId: string, status: CommissionStatus): Promise<void> {
  statuses = { ...statuses, [`${month}:${staffId}`]: status };
}
