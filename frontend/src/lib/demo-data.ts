/**
 * Sample data for building the UI before the backend exists.
 * Everything here is made up. The api/ modules read from it until real
 * endpoints replace them, so pages never import this file directly.
 */
import type { BranchId } from "./branches";

export type ItemStatus = "Available" | "Repairing" | "Sold";

export interface CatalogDevice {
  kind: "device";
  id: string;
  model: string;
  spec: string;
  condition: "New" | "Used" | "Trade-in";
  imei: string;
  serial: string;
  branch: Exclude<BranchId, "">;
  status: ItemStatus;
  price: number;
  cost: number;
  cashBillOnly: boolean;
}

export interface CatalogAccessory {
  kind: "accessory";
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  /** Units on hand at KL Sungai Wang. */
  qty: number;
  lowAt: number;
}

export type CatalogItem = CatalogDevice | CatalogAccessory;

export const DEVICES: CatalogDevice[] = [
  { kind: "device", id: "d1", model: "iPhone 16 Pro", spec: "256GB · Desert Titanium", condition: "New", imei: "356938035643809", serial: "", branch: "KLSW", status: "Available", price: 5499, cost: 4820, cashBillOnly: false },
  { kind: "device", id: "d2", model: "Galaxy S25 Ultra", spec: "512GB · Titanium Gray", condition: "New", imei: "352916112048716", serial: "", branch: "KLSW", status: "Available", price: 5999, cost: 5310, cashBillOnly: false },
  { kind: "device", id: "d3", model: "Xiaomi 15", spec: "512GB · Black", condition: "New", imei: "864122053392764", serial: "", branch: "KLSW", status: "Available", price: 3299, cost: 2780, cashBillOnly: false },
  { kind: "device", id: "d4", model: "OPPO Reno12 F", spec: "256GB · Olive Green", condition: "Used", imei: "867901044188226", serial: "", branch: "KLSW", status: "Available", price: 899, cost: 620, cashBillOnly: true },
  { kind: "device", id: "d5", model: 'MacBook Air M4 13"', spec: "16GB · 512GB · Sky Blue", condition: "New", imei: "", serial: "C02FM4XQ1KZ7", branch: "JB", status: "Available", price: 5199, cost: 4560, cashBillOnly: false },
  { kind: "device", id: "d6", model: "iPhone 15", spec: "128GB · Black", condition: "Trade-in", imei: "354478120988134", serial: "", branch: "KLSW", status: "Repairing", price: 2599, cost: 1980, cashBillOnly: false },
  { kind: "device", id: "d7", model: "Galaxy S24", spec: "256GB · Onyx Black", condition: "Used", imei: "358379170244186", serial: "", branch: "PJ", status: "Sold", price: 2399, cost: 1900, cashBillOnly: false },
  { kind: "device", id: "d8", model: 'iPad Air 11" M3', spec: "128GB · Wi-Fi · Space Gray", condition: "New", imei: "", serial: "DMPX72K9Q1", branch: "KLSW", status: "Available", price: 2799, cost: 2390, cashBillOnly: false },
  { kind: "device", id: "d9", model: "Lenovo IdeaPad Slim 5", spec: "Ryzen 7 · 16GB · 512GB", condition: "New", imei: "", serial: "PF4XK2LM", branch: "PJ", status: "Available", price: 3599, cost: 3050, cashBillOnly: false },
];

export const ACCESSORIES: CatalogAccessory[] = [
  { kind: "accessory", id: "a1", name: "USB-C to USB-C cable 1m", sku: "ACC-CBL-C2C-1M", barcode: "9555012345671", price: 39, cost: 14, qty: 24, lowAt: 5 },
  { kind: "accessory", id: "a2", name: "20W USB-C charger", sku: "ACC-CHG-20W", barcode: "9555012345688", price: 69, cost: 31, qty: 3, lowAt: 5 },
  { kind: "accessory", id: "a3", name: "iPhone 16 Pro clear case", sku: "ACC-CASE-16P", barcode: "9555012345695", price: 59, cost: 18, qty: 0, lowAt: 4 },
  { kind: "accessory", id: "a4", name: "Tempered glass, iPhone 16 Pro", sku: "ACC-SP-16P", barcode: "9555012345701", price: 35, cost: 8, qty: 40, lowAt: 10 },
];

/** Codes the POS "Test items" picker offers, with what each one exercises. */
export const TEST_ITEMS: { code: string; label: string; note: string }[] = [
  { code: "356938035643809", label: "iPhone 16 Pro 256GB", note: "Sells normally" },
  { code: "352916112048716", label: "Galaxy S25 Ultra 512GB", note: "Sells normally" },
  { code: "864122053392764", label: "Xiaomi 15 512GB", note: "Sells normally" },
  { code: "867901044188226", label: "OPPO Reno12 F", note: "Cash bill only" },
  { code: "C02FM4XQ1KZ7", label: 'MacBook Air M4 13"', note: "At Johor Bahru" },
  { code: "354478120988134", label: "iPhone 15 128GB", note: "Repairing: can't be sold" },
  { code: "358379170244186", label: "Galaxy S24 256GB", note: "Already sold" },
  { code: "356938035643801", label: "Mistyped IMEI", note: "Fails the check digit" },
  { code: "9555012345688", label: "20W USB-C charger", note: "Accessory, low stock" },
  { code: "9555012345671", label: "USB-C to USB-C cable 1m", note: "Accessory" },
  { code: "9555012345695", label: "iPhone 16 Pro clear case", note: "Accessory, out of stock" },
];

export interface BranchDay {
  sales: number;
  lastWeek: number;
  transactions: number;
  tradeIns: number;
  week: number[];
}

/** Dashboard figures per branch. Tue to Mon, today last. */
export const DASHBOARD: Record<Exclude<BranchId, "">, BranchDay> = {
  KLSW: { sales: 48320, lastWeek: 44100, transactions: 23, tradeIns: 4, week: [39800, 41250, 52600, 61900, 58400, 35200, 48320] },
  PJ: { sales: 31780, lastWeek: 33950, transactions: 17, tradeIns: 2, week: [28400, 30100, 33700, 41200, 44800, 26300, 31780] },
  JB: { sales: 22410, lastWeek: 19870, transactions: 12, tradeIns: 3, week: [18900, 17600, 21300, 27800, 30100, 16900, 22410] },
};
