import type { InventoryUnit } from "@/api/inventory";
import { BRANCHES } from "@/lib/branches";

export interface ModelRow {
  key: string;
  brand: string;
  name: string;
  category: InventoryUnit["category"];
  supplier: string;
  available: number;
  reserved: number;
  inTransit: number;
  repairing: number;
  /** Available units per branch id. */
  byBranch: Record<string, number>;
  value: number;
  threshold: number;
  /** Branches where available stock is under the reorder level. */
  lowAt: string[];
  /**
   * Needs reordering. For one branch: that branch is under the level. For all
   * branches: the company-wide available total is under the level.
   */
  low: boolean;
  /** Units to order to get back to the level. */
  shortBy: number;
  avgCost: number;
}

/** Default reorder level when none has been set. */
export function defaultThreshold(category: InventoryUnit["category"]): number {
  return category === "Phone" ? 2 : 1;
}

export const modelKey = (u: InventoryUnit) => `${u.model} ${u.variant}`;

export function summarise(units: InventoryUnit[], thresholds: Record<string, number>, branchIds: string[]): ModelRow[] {
  const rows = new Map<string, ModelRow>();
  for (const u of units) {
    if (u.status === "Sold") continue;
    const key = modelKey(u);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        brand: u.brand,
        name: key,
        category: u.category,
        supplier: u.condition === "Trade-in" ? "Trade-ins" : u.supplier,
        available: 0,
        reserved: 0,
        inTransit: 0,
        repairing: 0,
        byBranch: Object.fromEntries(BRANCHES.map((b) => [b.id, 0])),
        value: 0,
        threshold: thresholds[key] ?? defaultThreshold(u.category),
        lowAt: [],
        low: false,
        shortBy: 0,
        avgCost: 0,
      };
      rows.set(key, row);
    }
    if (u.status === "Available") {
      row.available++;
      row.byBranch[u.branch]++;
    }
    if (u.status === "Reserved") row.reserved++;
    if (u.status === "In transit") row.inTransit++;
    if (u.status === "Repairing") row.repairing++;
    row.value += u.cost;
    row.avgCost += u.cost;
  }
  const out = [...rows.values()].map((r) => {
    const count = r.available + r.reserved + r.inTransit + r.repairing;
    const have = branchIds.length === 1 ? r.byBranch[branchIds[0]] : r.available;
    return {
      ...r,
      avgCost: count ? Math.round(r.avgCost / count) : 0,
      lowAt: branchIds.filter((b) => r.byBranch[b] < r.threshold),
      low: have < r.threshold,
      shortBy: Math.max(0, r.threshold - have - r.inTransit),
    };
  });
  // Low stock first, then by name.
  return out.sort((a, b) => Number(b.low) - Number(a.low) || a.name.localeCompare(b.name));
}
