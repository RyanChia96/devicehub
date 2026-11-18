/**
 * Mock e-invoices, consolidated submissions and self-billed trade-ins until the
 * MyInvois integration exists. All names, TINs and numbers are made up.
 */
import type { BranchId } from "./branches";

export type EinvStatus = "Valid" | "Submitted" | "Invalid" | "Cancelled";
export type EinvType = "Invoice" | "Credit note" | "Refund note" | "Debit note";

export interface Einvoice {
  no: string;
  type: EinvType;
  branch: Exclude<BranchId, "">;
  /** dd/mm/yyyy hh:mm */
  issued: string;
  /** Hours since validation, for the 72-hour cancel window. Null if not validated. */
  hoursSinceValid: number | null;
  buyer: string;
  idType: "NRIC" | "BRN" | "PASSPORT";
  idNo: string;
  tin: string;
  /** For the rejected invoice: the TIN that matches the ID. */
  correctTin?: string;
  email: string;
  total: number;
  status: EinvStatus;
  uin: string | null;
  error?: string;
  cancelReason?: string;
}

const BUYERS: [string, "NRIC" | "BRN" | "PASSPORT", string, string, string][] = [
  ["Muhammad Hafiz bin Razak", "NRIC", "900514-14-5523", "IG21450981070", "hafiz.razak@gmail.com"],
  ["Syarikat Teknologi Maju Sdn Bhd", "BRN", "201901023456", "C25873641090", "accounts@tekmaju.com.my"],
  ["Tan Mei Ling", "NRIC", "880921-10-5248", "IG10398822041", "meiling.tan@yahoo.com"],
  ["Lee Chong Wei Trading", "BRN", "201601004417", "C10744302080", "admin@lcwtrading.my"],
  ["Nor Azizah binti Hamid", "NRIC", "950302-01-6612", "IG30118745210", "azizah.hamid@gmail.com"],
  ["Ravi Chandran", "NRIC", "870716-08-5531", "IG22984410650", "ravi.c@outlook.com"],
  ["Kumpulan Bina Jaya Sdn Bhd", "BRN", "201201030988", "C20551873010", "finance@binajaya.com.my"],
  ["Wong Kar Hoe", "NRIC", "910205-14-5107", "IG40877120330", "karhoe.w@gmail.com"],
];

function uin(seed: number): string {
  const chars = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";
  let s = "";
  let x = seed * 2654435761;
  for (let i = 0; i < 26; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    s += chars[x % chars.length];
  }
  return s;
}

function build(): Einvoice[] {
  const out: Einvoice[] = [];
  const branches: Einvoice["branch"][] = ["KLSW", "KLSW", "PJ", "KLSW", "JB", "PJ"];
  for (let i = 0; i < 28; i++) {
    const day = 18 - Math.floor(i / 2);
    const b = BUYERS[i % BUYERS.length];
    const branch = branches[i % branches.length];
    const hours = (18 - day) * 24 + (i % 2 ? 5 : 2);
    out.push({
      no: `INV-${branch}-2611-${String(481 - i).padStart(5, "0")}`,
      type: "Invoice",
      branch,
      issued: `${String(day).padStart(2, "0")}/11/2026 ${10 + (i % 8)}:${String((i * 7) % 60).padStart(2, "0")}`,
      hoursSinceValid: hours,
      buyer: b[0],
      idType: b[1],
      idNo: b[2],
      tin: b[3],
      email: b[4],
      total: [5499, 5999, 3299, 1699, 4699, 2799, 6188, 12450][i % 8],
      status: "Valid",
      uin: uin(i + 7),
    });
  }
  // Rejected: TIN doesn't match the ID.
  out[3] = { ...out[3], no: "INV-KLSW-2611-00470", status: "Invalid", hoursSinceValid: null, uin: null, tin: "IG21450981007", correctTin: "IG21450981070", buyer: BUYERS[0][0], idNo: BUYERS[0][2], error: "Buyer TIN does not match the buyer's ID number." };
  // Still sending to LHDN.
  out[0] = { ...out[0], no: "INV-KLSW-2611-00481", status: "Submitted", hoursSinceValid: null, uin: null };
  // Cancel window almost closed.
  out[8] = { ...out[8], no: "INV-KLSW-2611-00412", branch: "KLSW", hoursSinceValid: 63 };
  // Cancelled earlier.
  out[12] = { ...out[12], status: "Cancelled", cancelReason: "Wrong buyer details" };
  // A credit note.
  out[15] = { ...out[15], type: "Credit note", total: -1299, no: "CN-PJ-2611-00004" };
  return out;
}

export const DEMO_EINVOICES: Einvoice[] = build();

export interface ConsolidatedMonth {
  month: string;
  /** dd/mm/yyyy, the LHDN deadline (7th of the next month). */
  due: string;
  cashBills: number;
  total: number;
  status: "Open" | "Ready" | "Valid";
  submitted?: string;
  uin?: string;
}

export const DEMO_CONSOLIDATED: ConsolidatedMonth[] = [
  { month: "November 2026", due: "07/12/2026", cashBills: 0, total: 0, status: "Open" },
  { month: "October 2026", due: "07/11/2026", cashBills: 0, total: 0, status: "Valid", submitted: "03/11/2026 09:42", uin: uin(901) },
  { month: "September 2026", due: "07/10/2026", cashBills: 214, total: 318640, status: "Valid", submitted: "02/10/2026 10:15", uin: uin(902) },
];

export interface SelfBilled {
  no: string;
  date: string;
  branch: Exclude<BranchId, "">;
  seller: string;
  idNo: string;
  device: string;
  imei: string;
  amount: number;
  status: "Valid" | "Pending" | "Not submitted";
}

export const DEMO_SELF_BILLED: SelfBilled[] = [
  { no: "SB-KLSW-2611-00031", date: "18/11/2026", branch: "KLSW", seller: "Muhammad Hafiz bin Razak", idNo: "900514-14-5523", device: "Galaxy S23 256GB", imei: "352811094736215", amount: 1500, status: "Pending" },
  { no: "SB-PJ-2611-00012", date: "17/11/2026", branch: "PJ", seller: "Chong Wai Mun", idNo: "930811-10-6623", device: "iPhone 14 128GB", imei: "353904117742108", amount: 1750, status: "Valid" },
  { no: "SB-KLSW-2611-00030", date: "15/11/2026", branch: "KLSW", seller: "Siti Nurhaliza binti Omar", idNo: "960104-03-5810", device: "iPhone 13 128GB", imei: "357721093316640", amount: 1300, status: "Valid" },
  { no: "SB-JB-2611-00007", date: "14/11/2026", branch: "JB", seller: "Arun Pillai", idNo: "850627-01-5291", device: "Xiaomi 14 256GB", imei: "861734052219983", amount: 1200, status: "Valid" },
  { no: "SB-KLSW-2611-00029", date: "12/11/2026", branch: "KLSW", seller: "Lim Siew Ling", idNo: "990318-14-6040", device: "Galaxy S24 256GB", imei: "358379170244186", amount: 1900, status: "Valid" },
  { no: "SB-PJ-2611-00011", date: "10/11/2026", branch: "PJ", seller: "Faizal bin Ahmad", idNo: "880412-08-5577", device: "iPhone 15 128GB", imei: "354478120988134", amount: 2300, status: "Not submitted" },
];

export interface SellerProfile {
  name: string;
  tin: string;
  brn: string;
  sst: string;
  msic: string;
  activity: string;
  address: string;
  email: string;
  phone: string;
}

export const DEMO_SELLER: SellerProfile = {
  name: "Serigajet Mobile Sdn Bhd",
  tin: "C24581937020",
  brn: "201801039127",
  sst: "W10-1808-32001455",
  msic: "47412",
  activity: "Retail sale of telecommunication equipment",
  address: "Lot 3.21, Sungei Wang Plaza, Jalan Bukit Bintang, 55100 Kuala Lumpur",
  email: "einvoice@serigajet.com.my",
  phone: "03-2148 7710",
};
