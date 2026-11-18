import type { BranchId } from "@/lib/branches";
import { DEMO_SALES } from "@/lib/demo-sales";
import {
  DEMO_CONSOLIDATED,
  DEMO_EINVOICES,
  DEMO_SELF_BILLED,
  DEMO_SELLER,
  type ConsolidatedMonth,
  type Einvoice,
  type SelfBilled,
  type SellerProfile,
} from "@/lib/demo-einvoices";

export type { ConsolidatedMonth, Einvoice, EinvStatus, SelfBilled, SellerProfile } from "@/lib/demo-einvoices";

let invoices: Einvoice[] = DEMO_EINVOICES.map((e) => ({ ...e }));
let consolidated: ConsolidatedMonth[] = DEMO_CONSOLIDATED.map((c) => ({ ...c }));
let selfBilled: SelfBilled[] = DEMO_SELF_BILLED.map((s) => ({ ...s }));
let seller: SellerProfile = { ...DEMO_SELLER };

const TIN_FORMAT = /^(IG\d{11}|C\d{10,11}|EI\d{11})$/;

/** True when the 72-hour cancellation window is still open. */
export const canCancel = (e: Einvoice) => e.status === "Valid" && e.type === "Invoice" && (e.hoursSinceValid ?? 99) < 72;

/** Rejected, still sending, or a cancel window closing within 12 hours. */
export const needsAttention = (e: Einvoice) =>
  e.status === "Invalid" || e.status === "Submitted" || (canCancel(e) && (e.hoursSinceValid ?? 0) > 60);

/** TODO(backend): GET /einvoices/?branch=… */
export async function getEinvoices(branch: BranchId): Promise<Einvoice[]> {
  return invoices.filter((e) => !branch || e.branch === branch).map((e) => ({ ...e }));
}

/** TODO(backend): POST /einvoices/validate-tin/ (calls MyInvois). */
export async function validateTin(tin: string): Promise<{ ok: boolean; message: string }> {
  const t = tin.trim().toUpperCase();
  if (!t) return { ok: false, message: "Enter a TIN. A buyer with only a MyKad uses the general public TIN EI00000000010." };
  if (!TIN_FORMAT.test(t)) return { ok: false, message: "TIN format looks wrong. Individuals: IG + 11 digits. Companies: C + 10 or 11 digits." };
  return { ok: true, message: "TIN is registered on MyInvois." };
}

/** TODO(backend): POST /einvoices/:no/resubmit/ */
export async function resubmit(no: string, tin: string): Promise<Einvoice> {
  const current = invoices.find((e) => e.no === no)!;
  const matches = !current.correctTin || current.correctTin === tin.trim().toUpperCase();
  const next: Einvoice = matches
    ? { ...current, tin: tin.trim().toUpperCase(), status: "Valid", hoursSinceValid: 0, uin: "K4T9QX2M7B1H8ZC3VR6N0PLWE5", error: undefined }
    : { ...current, tin: tin.trim().toUpperCase(), error: "Buyer TIN still does not match the buyer's ID number." };
  invoices = invoices.map((e) => (e.no === no ? next : e));
  return { ...next };
}

/** TODO(backend): POST /einvoices/:no/cancel/ */
export async function cancelEinvoice(no: string, reason: string): Promise<void> {
  invoices = invoices.map((e) => (e.no === no ? { ...e, status: "Cancelled", cancelReason: reason } : e));
}

/** TODO(backend): POST /einvoices/:no/notes/ (credit, refund or debit note). */
export async function issueNote(no: string, type: "Credit note" | "Refund note" | "Debit note", amount: number): Promise<string> {
  const base = invoices.find((e) => e.no === no)!;
  const prefix = type === "Credit note" ? "CN" : type === "Refund note" ? "RN" : "DN";
  const noteNo = `${prefix}-${base.branch}-2611-${String(10 + invoices.length).padStart(5, "0")}`;
  invoices = [
    { ...base, no: noteNo, type, total: type === "Debit note" ? amount : -amount, status: "Valid", hoursSinceValid: 0, uin: "N3T6RW8P1K4Q7XZ2MB9H0LVC5E", issued: "18/11/2026 11:30" },
    ...invoices,
  ];
  return noteNo;
}

/** TODO(backend): GET /einvoices/consolidated/ */
export async function getConsolidated(branch: BranchId): Promise<ConsolidatedMonth[]> {
  const cash = DEMO_SALES.filter((s) => s.receipt === "cash" && (!branch || s.branch === branch));
  const fill = (m: ConsolidatedMonth, prefix: string) =>
    prefix
      ? {
          ...m,
          cashBills: cash.filter((s) => s.date.startsWith(prefix)).length,
          total: cash.filter((s) => s.date.startsWith(prefix)).reduce((a, s) => a + s.amount, 0),
        }
      : m;
  return consolidated.map((m) => fill(m, m.month.startsWith("November") ? "2026-11" : m.month.startsWith("October") ? "2026-10" : ""));
}

/** TODO(backend): POST /einvoices/consolidated/:month/submit/ */
export async function submitConsolidated(month: string): Promise<void> {
  consolidated = consolidated.map((m) =>
    m.month === month ? { ...m, status: "Valid", submitted: "18/11/2026 11:40", uin: "C7M2Q9X4TB1H8ZK3VR6N0PLWE5" } : m,
  );
}

/** TODO(backend): GET /einvoices/self-billed/ */
export async function getSelfBilled(branch: BranchId): Promise<SelfBilled[]> {
  return selfBilled.filter((s) => !branch || s.branch === branch).map((s) => ({ ...s }));
}

/** TODO(backend): POST /einvoices/self-billed/:no/submit/ */
export async function submitSelfBilled(no: string): Promise<void> {
  selfBilled = selfBilled.map((s) => (s.no === no ? { ...s, status: "Valid" } : s));
}

/** TODO(backend): GET /einvoices/seller-profile/ */
export async function getSellerProfile(): Promise<SellerProfile> {
  return { ...seller };
}

/** TODO(backend): PUT /einvoices/seller-profile/ */
export async function saveSellerProfile(next: SellerProfile): Promise<void> {
  seller = { ...next };
}
