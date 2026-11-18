import type { InventoryUnit, UnitStatus } from "@/api/inventory";

export const STATUSES: UnitStatus[] = ["Available", "Reserved", "Repairing", "In transit", "Sold"];
export const CONDITIONS = ["New", "Used", "Trade-in"] as const;
export const CATEGORIES = ["Phone", "Tablet", "Laptop"] as const;

export type StatusVariant = "success" | "warning" | "info" | "secondary" | "outline";

export const STATUS_VARIANT: Record<UnitStatus, StatusVariant> = {
  Available: "success",
  Reserved: "info",
  Repairing: "warning",
  "In transit": "outline",
  Sold: "secondary",
};

/** Columns people can show or hide. Item, status and price are always shown. */
export const OPTIONAL_COLUMNS = [
  { key: "code", label: "IMEI / serial" },
  { key: "branch", label: "Branch" },
  { key: "condition", label: "Condition" },
  { key: "battery", label: "Battery" },
  { key: "received", label: "Received" },
  { key: "supplier", label: "Supplier" },
  { key: "cost", label: "Cost" },
  { key: "margin", label: "Margin" },
] as const;
export type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number]["key"];

export const DEFAULT_COLUMNS: Record<OptionalColumn, boolean> = {
  code: true,
  branch: true,
  condition: true,
  battery: true,
  received: true,
  supplier: false,
  cost: true,
  margin: true,
};

export type SortKey = "item" | "received" | "price" | "battery" | "margin";
export interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

export interface Filters {
  q: string;
  status: string;
  condition: string;
  category: string;
  branch: string;
}

export const EMPTY_FILTERS: Filters = { q: "", status: "", condition: "", category: "", branch: "" };

export const unitName = (u: InventoryUnit) => `${u.model} ${u.variant}`;
export const unitCode = (u: InventoryUnit) => u.imei || u.serial;
export const marginPct = (u: InventoryUnit) => ((u.price - u.cost) / u.price) * 100;

export function applyFilters(units: InventoryUnit[], f: Filters): InventoryUnit[] {
  const q = f.q.trim().toLowerCase();
  const key = q.replace(/[\s-]/g, "");
  return units.filter(
    (u) =>
      (!f.status || u.status === f.status) &&
      (!f.condition || u.condition === f.condition) &&
      (!f.category || u.category === f.category) &&
      (!f.branch || u.branch === f.branch) &&
      (!q ||
        `${u.brand} ${u.model} ${u.variant} ${u.color} ${u.supplier}`.toLowerCase().includes(q) ||
        (key.length > 0 && `${u.imei} ${u.serial}`.toLowerCase().includes(key))),
  );
}

export function applySort(units: InventoryUnit[], sort: Sort): InventoryUnit[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const value = (u: InventoryUnit): string | number => {
    switch (sort.key) {
      case "item":
        return unitName(u).toLowerCase();
      case "received":
        return u.received;
      case "price":
        return u.price;
      case "battery":
        return u.battery ?? -1;
      case "margin":
        return marginPct(u);
    }
  };
  return [...units].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    return va < vb ? -dir : va > vb ? dir : 0;
  });
}

/** 2026-11-03 -> 03/11/2026 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
