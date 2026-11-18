/**
 * Mock stock for the Inventory page until the backend exists. Generated from a
 * fixed seed, so the same units appear on every reload.
 */
import type { BranchId } from "./branches";

export type UnitStatus = "Available" | "Reserved" | "Repairing" | "In transit" | "Sold";
export type UnitCondition = "New" | "Used" | "Trade-in";

export interface UnitEvent {
  at: string;
  what: string;
  by: string;
}

export interface InventoryUnit {
  id: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
  category: "Phone" | "Tablet" | "Laptop";
  imei: string;
  serial: string;
  branch: Exclude<BranchId, "">;
  status: UnitStatus;
  condition: UnitCondition;
  /** Battery health %, used and trade-in units only. */
  battery: number | null;
  supplier: string;
  /** ISO date (yyyy-mm-dd). */
  received: string;
  cost: number;
  price: number;
  cashBillOnly: boolean;
  history: UnitEvent[];
}

interface ModelSpec {
  brand: string;
  model: string;
  category: InventoryUnit["category"];
  variants: string[];
  colors: string[];
  price: number;
  serialOnly?: boolean;
}

const MODELS: ModelSpec[] = [
  { brand: "Apple", model: "iPhone 16 Pro", category: "Phone", variants: ["256GB", "512GB"], colors: ["Desert Titanium", "Black Titanium", "Natural Titanium"], price: 5499 },
  { brand: "Apple", model: "iPhone 16", category: "Phone", variants: ["128GB", "256GB"], colors: ["Ultramarine", "Black", "Pink"], price: 3999 },
  { brand: "Apple", model: "iPhone 15", category: "Phone", variants: ["128GB"], colors: ["Black", "Blue"], price: 3299 },
  { brand: "Apple", model: "iPhone 13", category: "Phone", variants: ["128GB"], colors: ["Midnight", "Starlight"], price: 1899 },
  { brand: "Samsung", model: "Galaxy S25 Ultra", category: "Phone", variants: ["256GB", "512GB"], colors: ["Titanium Gray", "Titanium Black"], price: 5999 },
  { brand: "Samsung", model: "Galaxy S24", category: "Phone", variants: ["256GB"], colors: ["Onyx Black", "Marble Gray"], price: 2899 },
  { brand: "Samsung", model: "Galaxy A56 5G", category: "Phone", variants: ["256GB"], colors: ["Awesome Lightgray", "Awesome Graphite"], price: 1699 },
  { brand: "Samsung", model: "Galaxy Z Flip7", category: "Phone", variants: ["256GB"], colors: ["Blue Shadow", "Jetblack"], price: 4699 },
  { brand: "Xiaomi", model: "Xiaomi 15", category: "Phone", variants: ["512GB"], colors: ["Black", "White"], price: 3299 },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro", category: "Phone", variants: ["256GB"], colors: ["Midnight Black", "Ocean Blue"], price: 1299 },
  { brand: "OPPO", model: "Reno12 F", category: "Phone", variants: ["256GB"], colors: ["Olive Green", "Matte Grey"], price: 1199 },
  { brand: "OPPO", model: "Find X8", category: "Phone", variants: ["512GB"], colors: ["Space Black"], price: 3999 },
  { brand: "Apple", model: 'iPad Air 11" M3', category: "Tablet", variants: ["128GB Wi-Fi", "256GB Wi-Fi"], colors: ["Space Gray", "Blue"], price: 2799, serialOnly: true },
  { brand: "Samsung", model: "Galaxy Tab S10 FE", category: "Tablet", variants: ["128GB Wi-Fi"], colors: ["Gray"], price: 1999, serialOnly: true },
  { brand: "Apple", model: 'MacBook Air M4 13"', category: "Laptop", variants: ["16GB · 512GB"], colors: ["Sky Blue", "Midnight"], price: 5199, serialOnly: true },
  { brand: "Lenovo", model: "IdeaPad Slim 5", category: "Laptop", variants: ["Ryzen 7 · 16GB · 512GB"], colors: ["Cloud Grey"], price: 3599, serialOnly: true },
];

const SUPPLIERS = ["Apple Malaysia", "Samsung Malaysia Electronics", "Xiaomi Technology Malaysia", "OPPO Malaysia", "MBG Distribution", "Customer trade-in"];
const STAFF = ["Lim Wei Jie", "Nurul Ain", "Farid Iskandar", "Aisyah Rahman", "Kevin Tan", "Siti Hajar", "Kumar Selvam"];
const BRANCH_IDS: InventoryUnit["branch"][] = ["KLSW", "KLSW", "KLSW", "PJ", "PJ", "JB"];

/** Small deterministic random generator (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function luhnDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let d = Number(body[body.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.UTC(2026, 10, 18));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function ddmm(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function buildUnits(): InventoryUnit[] {
  const r = rng(20261118);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const units: InventoryUnit[] = [];

  for (let i = 0; i < 64; i++) {
    const spec = MODELS[i % MODELS.length];
    const roll = r();
    const condition: UnitCondition = spec.category !== "Phone" ? (roll < 0.85 ? "New" : "Used") : roll < 0.6 ? "New" : roll < 0.8 ? "Used" : "Trade-in";
    const statusRoll = r();
    const status: UnitStatus =
      condition === "Trade-in" && statusRoll < 0.35 ? "Repairing" : statusRoll < 0.72 ? "Available" : statusRoll < 0.8 ? "Reserved" : statusRoll < 0.88 ? "In transit" : statusRoll < 0.94 && condition !== "New" ? "Repairing" : "Sold";
    const discount = condition === "New" ? 1 : condition === "Used" ? 0.72 : 0.62;
    const price = Math.round((spec.price * discount) / 10) * 10 - 1;
    const margin = condition === "New" ? 0.08 + r() * 0.07 : 0.18 + r() * 0.12;
    const cost = Math.round(price * (1 - margin));
    const receivedDaysAgo = Math.floor(r() * 75);
    const received = isoDaysAgo(receivedDaysAgo);
    const body = `35${String(Math.floor(r() * 1e12)).padStart(12, "0")}`;
    const imei = spec.serialOnly ? "" : body + luhnDigit(body);
    const serial = spec.serialOnly ? `${spec.brand.slice(0, 1)}${Math.floor(r() * 36 ** 8).toString(36).toUpperCase().padStart(9, "X")}` : "";
    const branch = pick(BRANCH_IDS);
    const supplier = condition === "Trade-in" ? "Customer trade-in" : pick(SUPPLIERS.filter((s) => s !== "Customer trade-in"));
    const by = pick(STAFF);

    const history: UnitEvent[] = [{ at: `${ddmm(received)} 10:${String(10 + (i % 50)).padStart(2, "0")}`, what: condition === "Trade-in" ? "Bought as a trade-in" : `Received from ${supplier}`, by }];
    if (status === "In transit") history.unshift({ at: `${ddmm(isoDaysAgo(Math.max(0, receivedDaysAgo - 3)))} 15:20`, what: "Transfer started", by: pick(STAFF) });
    if (status === "Repairing") history.unshift({ at: `${ddmm(isoDaysAgo(Math.max(0, receivedDaysAgo - 1)))} 11:05`, what: "Sent to refurbishment", by: "Kumar Selvam" });
    if (status === "Reserved") history.unshift({ at: `${ddmm(isoDaysAgo(1))} 17:42`, what: "Reserved for a customer", by: pick(STAFF) });
    if (status === "Sold") history.unshift({ at: `${ddmm(isoDaysAgo(Math.max(0, receivedDaysAgo - 5)))} 14:31`, what: "Sold", by: pick(STAFF) });

    units.push({
      id: `u${String(i + 1).padStart(3, "0")}`,
      brand: spec.brand,
      model: spec.model,
      variant: pick(spec.variants),
      color: pick(spec.colors),
      category: spec.category,
      imei,
      serial,
      branch,
      status,
      condition,
      battery: condition === "New" ? null : 78 + Math.floor(r() * 21),
      supplier,
      received,
      cost,
      price,
      cashBillOnly: condition !== "New" && r() < 0.25,
      history,
    });
  }
  return units;
}

export const DEMO_UNITS: InventoryUnit[] = buildUnits();
