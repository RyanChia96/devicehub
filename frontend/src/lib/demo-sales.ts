/**
 * Mock sales for reports and commission until the backend exists.
 * Generated from a fixed seed: October 2026 and 1 to 18 November 2026.
 */
import type { BranchId } from "./branches";

export type SaleCategory = "new" | "comp" | "acc" | "used";

export interface SaleLine {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  invoice: string;
  staffId: string;
  branch: Exclude<BranchId, "">;
  item: string;
  brand: string;
  category: SaleCategory;
  /** Negative for a refund. */
  amount: number;
  cost: number;
  receipt: "einv" | "cash";
}

export interface Staff {
  id: string;
  name: string;
  branch: Exclude<BranchId, "">;
}

export const SALES_STAFF: Staff[] = [
  { id: "aisyah", name: "Aisyah Rahman", branch: "KLSW" },
  { id: "daniel", name: "Daniel Lim", branch: "KLSW" },
  { id: "farid", name: "Farid Iskandar", branch: "KLSW" },
  { id: "kevin", name: "Kevin Tan", branch: "PJ" },
  { id: "nurul", name: "Nurul Ain", branch: "PJ" },
  { id: "siti", name: "Siti Hajar", branch: "JB" },
  { id: "rajesh", name: "Rajesh Kumar", branch: "JB" },
];

const CATALOG: { item: string; brand: string; category: SaleCategory; price: number; margin: number }[] = [
  { item: "iPhone 16 Pro 256GB", brand: "Apple", category: "new", price: 5499, margin: 0.11 },
  { item: "iPhone 16 128GB", brand: "Apple", category: "new", price: 3999, margin: 0.12 },
  { item: "Galaxy S25 Ultra 512GB", brand: "Samsung", category: "new", price: 5999, margin: 0.11 },
  { item: "Galaxy A56 5G 256GB", brand: "Samsung", category: "new", price: 1699, margin: 0.14 },
  { item: "Galaxy Z Flip7 256GB", brand: "Samsung", category: "new", price: 4699, margin: 0.12 },
  { item: "Xiaomi 15 512GB", brand: "Xiaomi", category: "new", price: 3299, margin: 0.15 },
  { item: "Redmi Note 14 Pro 256GB", brand: "Xiaomi", category: "new", price: 1299, margin: 0.13 },
  { item: "OPPO Find X8 512GB", brand: "OPPO", category: "new", price: 3999, margin: 0.13 },
  { item: 'iPad Air 11" M3', brand: "Apple", category: "comp", price: 2799, margin: 0.14 },
  { item: 'MacBook Air M4 13"', brand: "Apple", category: "comp", price: 5199, margin: 0.12 },
  { item: "Lenovo IdeaPad Slim 5", brand: "Lenovo", category: "comp", price: 3599, margin: 0.15 },
  { item: "iPhone 13 128GB (used)", brand: "Apple", category: "used", price: 1899, margin: 0.24 },
  { item: "Galaxy S24 256GB (used)", brand: "Samsung", category: "used", price: 2099, margin: 0.22 },
  { item: "OPPO Reno12 F (used)", brand: "OPPO", category: "used", price: 899, margin: 0.3 },
  { item: "Accessories", brand: "Accessories", category: "acc", price: 0, margin: 0.55 },
];

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSales(): SaleLine[] {
  const r = rng(118);
  const lines: SaleLine[] = [];
  const seq: Record<string, number> = { KLSW: 300, PJ: 180, JB: 90 };
  const days: string[] = [];
  for (let d = new Date(Date.UTC(2026, 9, 1)); d <= new Date(Date.UTC(2026, 10, 18)); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  for (const date of days) {
    const weekend = [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());
    for (const staff of SALES_STAFF) {
      const count = Math.floor(r() * (weekend ? 3.2 : 2.2));
      for (let k = 0; k < count; k++) {
        const c = CATALOG[Math.floor(r() * CATALOG.length)];
        const amount = c.category === "acc" ? 35 + Math.round(r() * 12) * 10 : c.price - (r() < 0.3 ? Math.round(r() * 4) * 50 : 0);
        const ym = date.slice(2, 4) + date.slice(5, 7);
        seq[staff.branch] += 1;
        const receipt: SaleLine["receipt"] = amount > 10000 || r() < 0.55 ? "einv" : "cash";
        lines.push({
          id: `s${lines.length + 1}`,
          date,
          invoice: `${receipt === "einv" ? "INV" : "CB"}-${staff.branch}-${ym}-${String(seq[staff.branch]).padStart(5, "0")}`,
          staffId: staff.id,
          branch: staff.branch,
          item: c.category === "acc" ? `Accessories, ${1 + Math.floor(r() * 8)} items` : c.item,
          brand: c.brand,
          category: c.category,
          amount,
          cost: Math.round(amount * (1 - c.margin)),
          receipt,
        });
      }
    }
  }
  // Two refunds in November.
  const refundOf = (staffId: string, item: string, amount: number, date: string): SaleLine => ({
    id: `s${lines.length + 1}`,
    date,
    invoice: `CN-${SALES_STAFF.find((s) => s.id === staffId)!.branch}-2611-0000${lines.length % 9}`,
    staffId,
    branch: SALES_STAFF.find((s) => s.id === staffId)!.branch,
    item: `Refund: ${item}`,
    brand: "Xiaomi",
    category: "new",
    amount: -amount,
    cost: -Math.round(amount * 0.85),
    receipt: "einv",
  });
  lines.push(refundOf("daniel", "Xiaomi 15 512GB", 3299, "2026-11-15"));
  lines.push(refundOf("kevin", "Redmi Note 14 Pro 256GB", 1299, "2026-11-09"));
  return lines;
}

export const DEMO_SALES: SaleLine[] = buildSales();

/** Monthly totals for earlier months of 2026 and past years (sample figures). */
export const MONTHLY_2026_EARLIER: { month: string; sales: number; cost: number; transactions: number }[] = [
  { month: "Jan", sales: 612400, cost: 529800, transactions: 241 },
  { month: "Feb", sales: 698100, cost: 601300, transactions: 268 },
  { month: "Mar", sales: 571900, cost: 495600, transactions: 226 },
  { month: "Apr", sales: 589300, cost: 508100, transactions: 233 },
  { month: "May", sales: 603800, cost: 520700, transactions: 239 },
  { month: "Jun", sales: 624600, cost: 537900, transactions: 247 },
  { month: "Jul", sales: 588200, cost: 507400, transactions: 231 },
  { month: "Aug", sales: 642700, cost: 553900, transactions: 252 },
  { month: "Sep", sales: 701500, cost: 603200, transactions: 274 },
];

export const YEARLY: { year: string; sales: number; cost: number; transactions: number }[] = [
  { year: "2022", sales: 5120400, cost: 4459700, transactions: 2104 },
  { year: "2023", sales: 6034800, cost: 5231600, transactions: 2416 },
  { year: "2024", sales: 6788900, cost: 5872100, transactions: 2690 },
  { year: "2025", sales: 7402600, cost: 6385500, transactions: 2903 },
];
