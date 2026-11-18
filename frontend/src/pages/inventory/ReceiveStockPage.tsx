import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScanLine, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { knownCodes, receiveUnits, type InventoryUnit } from "@/api/inventory";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/lib/branch-context";
import { BRANCHES } from "@/lib/branches";
import { DEMO_TOOLS } from "@/lib/demo-flag";
import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";

const PRODUCTS: { brand: string; model: string; variant: string; colors: string[]; category: InventoryUnit["category"]; cost: number; price: number; serial?: boolean }[] = [
  { brand: "Apple", model: "iPhone 16 Pro", variant: "256GB", colors: ["Desert Titanium", "Black Titanium"], category: "Phone", cost: 4820, price: 5499 },
  { brand: "Apple", model: "iPhone 16", variant: "128GB", colors: ["Ultramarine", "Black"], category: "Phone", cost: 3480, price: 3999 },
  { brand: "Samsung", model: "Galaxy S25 Ultra", variant: "512GB", colors: ["Titanium Gray"], category: "Phone", cost: 5310, price: 5999 },
  { brand: "Samsung", model: "Galaxy A56 5G", variant: "256GB", colors: ["Awesome Lightgray", "Awesome Graphite"], category: "Phone", cost: 1460, price: 1699 },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro", variant: "256GB", colors: ["Midnight Black"], category: "Phone", cost: 1120, price: 1299 },
  { brand: "Apple", model: 'iPad Air 11" M3', variant: "128GB Wi-Fi", colors: ["Space Gray"], category: "Tablet", cost: 2390, price: 2799, serial: true },
  { brand: "Lenovo", model: "IdeaPad Slim 5", variant: "Ryzen 7 · 16GB · 512GB", colors: ["Cloud Grey"], category: "Laptop", cost: 3050, price: 3599, serial: true },
];
const SUPPLIERS = ["Apple Malaysia", "Samsung Malaysia Electronics", "Xiaomi Technology Malaysia", "OPPO Malaysia", "MBG Distribution"];

interface Scan {
  code: string;
  error: string | null;
}

function luhnOk(code: string): boolean {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    let d = Number(code[code.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function sampleImei(n: number): string {
  const body = `35${String(817300000000 + n * 7919).padStart(12, "0")}`;
  for (let d = 0; d <= 9; d++) if (luhnOk(body + d)) return body + d;
  return body + "0";
}

export default function ReceiveStockPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scanRef = useRef<HTMLInputElement>(null);
  const { data: existing = new Set<string>() } = useQuery({ queryKey: ["inventory", "codes"], queryFn: knownCodes });

  const [into, setInto] = useState<InventoryUnit["branch"]>((branch || "KLSW") as InventoryUnit["branch"]);
  const [productIdx, setProductIdx] = useState(0);
  const product = PRODUCTS[productIdx];
  const [color, setColor] = useState(product.colors[0]);
  const [condition, setCondition] = useState<InventoryUnit["condition"]>("New");
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [cost, setCost] = useState(String(product.cost));
  const [price, setPrice] = useState(String(product.price));
  const [cashBillOnly, setCashBillOnly] = useState(false);
  const [scanText, setScanText] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [simCount, setSimCount] = useState(0);

  const good = scans.filter((s) => !s.error);
  const costN = Number(cost);
  const priceN = Number(price);
  const formError =
    !Number.isFinite(costN) || costN <= 0
      ? "Enter the cost per unit."
      : !Number.isFinite(priceN) || priceN <= 0
        ? "Enter the selling price."
        : priceN < costN
          ? "The selling price is below cost."
          : good.length === 0
            ? "Scan at least one IMEI or serial."
            : "";

  const checkCode = (raw: string): Scan => {
    const code = raw.replace(/[\s-]/g, "").toUpperCase();
    if (scans.some((s) => s.code === code)) return { code, error: "Already scanned in this batch" };
    if (existing.has(code)) return { code, error: "Already in stock" };
    if (product.serial) return { code, error: code.length < 6 ? "Serial looks too short" : null };
    if (!/^\d+$/.test(code) || code.length !== 15) return { code, error: `IMEI must be 15 digits (got ${code.length})` };
    if (!luhnOk(code)) return { code, error: "Fails the IMEI check digit" };
    return { code, error: null };
  };
  const addScan = (raw: string) => {
    if (!raw.trim()) return;
    setScans((s) => [checkCode(raw), ...s]);
    setScanText("");
    scanRef.current?.focus();
  };
  const simulate = () => {
    // Every 4th sample repeats the previous code, every 5th has a bad check digit.
    const n = simCount + 1;
    setSimCount(n);
    if (product.serial) return addScan(`S${(9_000_000 + n * 7_331).toString(36).toUpperCase()}`);
    if (n % 4 === 0 && scans[0]) return addScan(scans[0].code);
    const imei = sampleImei(n);
    addScan(n % 5 === 0 ? imei.slice(0, 14) + ((Number(imei[14]) + 1) % 10) : imei);
  };

  const receive = useMutation({
    mutationFn: () =>
      receiveUnits({
        branch: into,
        brand: product.brand,
        model: product.model,
        variant: product.variant,
        color,
        category: product.category,
        condition,
        supplier,
        cost: costN,
        price: priceN,
        cashBillOnly,
        codes: good.map((s) => s.code),
      }),
    onSuccess: (n) => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setScans([]);
      show(`Received ${n} × ${product.model} into ${BRANCHES.find((b) => b.id === into)?.name}.`, {
        label: "View in inventory",
        onClick: () => navigate("/inventory"),
      });
    },
  });

  const margin = useMemo(() => (priceN > 0 ? ((priceN - costN) / priceN) * 100 : 0), [costN, priceN]);
  const select = "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm";

  return (
    <>
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section aria-labelledby="rcv-details" className="flex flex-col gap-5 rounded-lg border bg-card p-6">
          <h2 id="rcv-details" className="text-[15px] font-semibold">
            What you're receiving
          </h2>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Receive into">
              <select className={select} value={into} onChange={(e) => setInto(e.target.value as InventoryUnit["branch"])}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Supplier">
              <select className={select} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                {SUPPLIERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Model" className="sm:col-span-2">
              <select
                className={select}
                value={productIdx}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  setProductIdx(i);
                  setColor(PRODUCTS[i].colors[0]);
                  setCost(String(PRODUCTS[i].cost));
                  setPrice(String(PRODUCTS[i].price));
                  setScans([]);
                }}
              >
                {PRODUCTS.map((p, i) => (
                  <option key={p.model + p.variant} value={i}>
                    {p.model} {p.variant}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Colour">
              <select className={select} value={color} onChange={(e) => setColor(e.target.value)}>
                {product.colors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Condition">
              <select className={select} value={condition} onChange={(e) => setCondition(e.target.value as InventoryUnit["condition"])}>
                <option>New</option>
                <option>Used</option>
              </select>
            </Field>
            <Field label="Cost per unit (RM)">
              <Input inputMode="decimal" className="tabular" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
            <Field label="Selling price (RM)">
              <Input inputMode="decimal" className="tabular" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          </div>
          <p className={cn("text-[13px] text-muted-foreground", margin < 10 && "text-destructive")}>
            Margin {Number.isFinite(margin) ? margin.toFixed(1) : "0"}% per unit.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={cashBillOnly} onChange={(e) => setCashBillOnly(e.target.checked)} />
            Cash bill only (no e-invoice for these units)
          </label>
        </section>

        <section aria-labelledby="rcv-scan" className="flex flex-col gap-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <h2 id="rcv-scan" className="text-[15px] font-semibold">
              Scan {product.serial ? "serials" : "IMEIs"}
            </h2>
            <span className="ml-auto text-[13px] text-muted-foreground">
              {good.length} ready{scans.length > good.length ? `, ${scans.length - good.length} rejected` : ""}
            </span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <ScanLine className="size-[18px] text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <input
              ref={scanRef}
              aria-label={product.serial ? "Scan serial number" : "Scan IMEI"}
              placeholder={product.serial ? "Scan serials one after another" : "Scan IMEIs one after another"}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addScan(scanText);
                }
              }}
            />
          </div>
          {DEMO_TOOLS && (
            <Button variant="outline" size="sm" className="self-start border-dashed" onClick={simulate}>
              Simulate next scan
            </Button>
          )}
          <ul className="flex max-h-[360px] min-h-24 flex-col gap-1 overflow-auto">
            {scans.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing scanned yet.</li>}
            {scans.map((s, i) => (
              <li key={`${s.code}-${i}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-mono text-[13px]", s.error && "text-muted-foreground line-through")}>{s.code}</span>
                  {s.error && <span className="block text-xs text-destructive">{s.error}</span>}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${s.code}`}
                  onClick={() => setScans((list) => list.filter((_, j) => j !== i))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total cost</span>
              <span className="tabular">{formatRM(good.length * (costN || 0))}</span>
            </div>
            <Button size="lg" disabled={Boolean(formError) || receive.isPending} onClick={() => receive.mutate()}>
              Receive {good.length || ""} {good.length === 1 ? "unit" : "units"}
            </Button>
            <p className={cn("text-center text-xs text-muted-foreground", !formError && "invisible")}>{formError || "Ready"}</p>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <Label className={cn("flex flex-col items-stretch gap-2 font-medium", className)}>
      <span>{label}</span>
      {children}
    </Label>
  );
}
