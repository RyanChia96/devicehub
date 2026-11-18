import { ACCESSORIES, DEVICES, type CatalogItem } from "@/lib/demo-data";

/** Result of looking up one scanned code. */
export type LookupResult =
  | { ok: true; item: CatalogItem }
  | { ok: false; reason: "bad-imei-length" | "bad-check-digit" | "not-found"; code: string };

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Exact lookup for a scanned IMEI, serial, SKU or barcode.
 * TODO(backend): GET /catalog/lookup/?code=…
 */
export async function lookupCode(raw: string): Promise<LookupResult> {
  const code = raw.replace(/[\s-]/g, "").toUpperCase();
  const device = DEVICES.find((d) => d.imei === code || d.serial === code);
  if (device) return { ok: true, item: device };
  const accessory = ACCESSORIES.find((a) => a.sku === code || a.barcode === code);
  if (accessory) return { ok: true, item: accessory };
  if (/^\d{8,}$/.test(code) && code.length !== 13) {
    if (code.length !== 15) return { ok: false, reason: "bad-imei-length", code };
    if (!luhn(code)) return { ok: false, reason: "bad-check-digit", code };
  }
  return { ok: false, reason: "not-found", code };
}

/**
 * Free-text search for the top-bar dropdown.
 * TODO(backend): GET /catalog/search/?q=…
 */
export async function searchCatalog(query: string): Promise<CatalogItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const key = q.replace(/[\s-]/g, "");
  const devices = DEVICES.filter(
    (d) =>
      `${d.model} ${d.spec}`.toLowerCase().includes(q) ||
      `${d.imei} ${d.serial}`.toLowerCase().includes(key),
  );
  const accessories = ACCESSORIES.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.sku.toLowerCase().replace(/-/g, "").includes(key) ||
      a.barcode.includes(key),
  );
  return [...devices, ...accessories].slice(0, 6);
}

export function itemCode(item: CatalogItem): string {
  return item.kind === "device" ? item.imei || item.serial : item.barcode;
}

export function itemName(item: CatalogItem): string {
  return item.kind === "device" ? `${item.model} ${item.spec.split(" · ")[0]}` : item.name;
}
