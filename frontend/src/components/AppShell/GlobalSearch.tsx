import { useQuery } from "@tanstack/react-query";
import { ScanLine } from "lucide-react";
import { useId, useState } from "react";
import { itemCode, itemName, searchCatalog } from "@/api/catalog";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import type { CatalogItem } from "@/lib/demo-data";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { usePos } from "@/sections/pos/pos-context";

type StatusVariant = "success" | "warning" | "error" | "secondary";

export function itemStatus(item: CatalogItem): { label: string; variant: StatusVariant } {
  if (item.kind === "device") {
    if (item.status === "Available") return { label: "Available", variant: "success" };
    if (item.status === "Repairing") return { label: "Repairing", variant: "warning" };
    return { label: "Sold", variant: "secondary" };
  }
  if (item.qty === 0) return { label: "Out of stock", variant: "error" };
  if (item.qty <= item.lowAt) return { label: "Low stock", variant: "error" };
  return { label: "In stock", variant: "success" };
}

/**
 * Top-bar item search, the same on every screen. Picking a result, or pressing
 * Enter the way a barcode scanner does, opens the POS with that item.
 */
export function GlobalSearch() {
  const pos = usePos();
  const { branch } = useBranch();
  const [query, setQuery] = useState("");
  const listId = useId();
  const open = query.trim().length > 0;
  const { data: results = [] } = useQuery({
    queryKey: QK.catalogSearch(query, branch),
    queryFn: () => searchCatalog(query),
    enabled: open,
  });

  const sell = (code: string) => {
    setQuery("");
    pos.openWithCode(code);
  };

  return (
    <div className="relative w-full max-w-[480px] min-w-60">
      <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
        <ScanLine className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Scan or search items"
          autoComplete="off"
          placeholder="Scan or search items: IMEI, serial, model, SKU"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
            if (e.key === "Enter" && open) {
              e.preventDefault();
              const typed = query.trim().toLowerCase();
              const exact = results.find((r) => itemCode(r).toLowerCase() === typed);
              if (exact) sell(itemCode(exact));
              else if (results.length === 1) sell(itemCode(results[0]));
              else sell(query.trim());
            }
          }}
        />
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[420px] overflow-auto rounded-lg border bg-popover p-1.5 shadow-modal"
        >
          {results.map((item) => {
            const status = itemStatus(item);
            const where = item.kind === "device" ? branchName(item.branch) : "KL Sungai Wang";
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={false}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto_96px] items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-muted"
                onClick={() => sell(itemCode(item))}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{itemName(item)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {itemCode(item)} · {where}
                  </span>
                </span>
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="tabular text-right text-sm">{formatRM(item.price)}</span>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">
              No items match. Press Enter to look it up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
