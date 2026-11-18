import type { BranchId } from "@/lib/branches";
import { DEMO_UNITS, type InventoryUnit, type UnitStatus } from "@/lib/demo-inventory";

export type { InventoryUnit, UnitStatus, UnitCondition, UnitEvent } from "@/lib/demo-inventory";

/** In-memory copy so changes survive until reload. Replaced by the API later. */
let store: InventoryUnit[] = DEMO_UNITS.map((u) => ({ ...u, history: [...u.history] }));

const CURRENT_USER = "Ong Kah Hoe";

function stamp(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`;
}

/** TODO(backend): GET /inventory/?branch=… */
export async function getInventory(branch: BranchId): Promise<InventoryUnit[]> {
  return store.filter((u) => !branch || u.branch === branch).map((u) => ({ ...u }));
}

/** TODO(backend): POST /inventory/status/ { ids, status } */
export async function setUnitStatus(ids: string[], status: UnitStatus): Promise<number> {
  let changed = 0;
  store = store.map((u) => {
    if (!ids.includes(u.id) || u.status === status || u.status === "Sold") return u;
    changed++;
    return { ...u, status, history: [{ at: stamp(), what: `Marked ${status}`, by: CURRENT_USER }, ...u.history] };
  });
  return changed;
}

/** TODO(backend): POST /inventory/transfers/ { ids, to } */
export async function transferUnits(ids: string[], to: InventoryUnit["branch"]): Promise<number> {
  let moved = 0;
  store = store.map((u) => {
    if (!ids.includes(u.id) || u.branch === to || u.status === "Sold") return u;
    moved++;
    return {
      ...u,
      status: "In transit",
      branch: to,
      history: [{ at: stamp(), what: `Transfer started to ${to}`, by: CURRENT_USER }, ...u.history],
    };
  });
  return moved;
}

/** Reorder level per model (same number for every branch). Keyed by "Model Variant". */
let thresholds: Record<string, number> = {};

/** TODO(backend): GET /inventory/thresholds/ */
export async function getThresholds(): Promise<Record<string, number>> {
  return { ...thresholds };
}

/** TODO(backend): PUT /inventory/thresholds/: applies to every branch at once. */
export async function saveThresholds(next: Record<string, number>): Promise<void> {
  thresholds = { ...thresholds, ...next };
}

export interface ReceiveInput {
  branch: InventoryUnit["branch"];
  brand: string;
  model: string;
  variant: string;
  color: string;
  category: InventoryUnit["category"];
  condition: InventoryUnit["condition"];
  supplier: string;
  cost: number;
  price: number;
  cashBillOnly: boolean;
  /** One IMEI or serial per unit. */
  codes: string[];
}

/** Every IMEI and serial already in stock, for duplicate checks while scanning. */
export async function knownCodes(): Promise<Set<string>> {
  return new Set(store.flatMap((u) => [u.imei, u.serial]).filter(Boolean));
}

/** TODO(backend): POST /inventory/receive/ */
export async function receiveUnits(input: ReceiveInput): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const isImei = (c: string) => /^\d{15}$/.test(c);
  const added: InventoryUnit[] = input.codes.map((code, i) => ({
    id: `r${Date.now()}${i}`,
    brand: input.brand,
    model: input.model,
    variant: input.variant,
    color: input.color,
    category: input.category,
    imei: isImei(code) ? code : "",
    serial: isImei(code) ? "" : code,
    branch: input.branch,
    status: "Available",
    condition: input.condition,
    battery: input.condition === "New" ? null : 100,
    supplier: input.supplier,
    received: today,
    cost: input.cost,
    price: input.price,
    cashBillOnly: input.cashBillOnly,
    history: [{ at: stamp(), what: `Received from ${input.supplier}`, by: CURRENT_USER }],
  }));
  store = [...added, ...store];
  return added.length;
}

export type RefurbStage = "Grading" | "Waiting on part" | "In repair" | "Testing";

export interface RefurbJob {
  unitId: string;
  stage: RefurbStage;
  partsCost: number;
  notes: string;
}

/** Refurbishment details per unit in Repairing status. */
let jobs: Record<string, RefurbJob> = {};
const STAGES: RefurbStage[] = ["Grading", "Waiting on part", "In repair", "Testing"];

/** TODO(backend): GET /refurbishment/ */
export async function getRefurbQueue(branch: BranchId): Promise<(InventoryUnit & { job: RefurbJob })[]> {
  return store
    .filter((u) => u.status === "Repairing" && (!branch || u.branch === branch))
    .map((u, i) => {
      jobs[u.id] ??= { unitId: u.id, stage: STAGES[i % STAGES.length], partsCost: [0, 189, 45, 120][i % 4], notes: "" };
      return { ...u, job: { ...jobs[u.id] } };
    });
}

/** TODO(backend): PATCH /refurbishment/:id/ */
export async function updateRefurbJob(unitId: string, patch: Partial<Omit<RefurbJob, "unitId">>): Promise<void> {
  jobs = { ...jobs, [unitId]: { ...jobs[unitId], ...patch } };
}

/** TODO(backend): POST /refurbishment/:id/finish/: battery and price set, back on sale. */
export async function finishRefurb(unitId: string, battery: number, price: number): Promise<void> {
  const job = jobs[unitId];
  store = store.map((u) =>
    u.id === unitId
      ? {
          ...u,
          status: "Available",
          battery,
          price,
          cost: u.cost + (job?.partsCost ?? 0),
          history: [{ at: stamp(), what: `Refurbished, battery ${battery}%, listed at RM ${price}`, by: CURRENT_USER }, ...u.history],
        }
      : u,
  );
}
