import { Minus, Plus, ScanLine } from "lucide-react";
import { useState } from "react";
import { itemName } from "@/api/catalog";
import { Button } from "@/components/ui/button";
import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";
import { usePos, type CartLine } from "./pos-context";

const DISCOUNTS = [0, 50, 100, 200, 500];

function lineDetail(line: CartLine): string {
  const item = line.item;
  if (item.kind === "accessory") return `${line.qty} × ${formatRM(item.price)}`;
  const condition = item.cashBillOnly ? `${item.condition}, cash bill only` : item.condition;
  return `${condition} · ${item.imei || item.serial}`;
}

/** Right panel during the sale: cart lines (click one to edit it), total and Pay. */
export function CartPanel() {
  const { state, totals, dispatch } = usePos();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const count = state.lines.reduce((a, l) => a + l.qty, 0);

  return (
    <>
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-3">
        <h2 className="text-lg font-semibold">Cart</h2>
        {count > 0 && (
          <span className="text-[13px] text-muted-foreground">
            {count} {count === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 pb-3">
        {state.lines.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <ScanLine className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="font-medium">Scan an item to start</p>
          </div>
        )}
        {state.lines.map((line) => {
          const isOpen = openKey === line.key;
          const amount = line.item.price * line.qty - line.discount;
          return (
            <div key={line.key} className={cn("rounded-lg", isOpen && "bg-muted")}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(isOpen ? null : line.key)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 rounded-lg px-3 py-3.5 text-left hover:bg-muted"
              >
                <span className="text-[15px] font-medium">{itemName(line.item)}</span>
                <span className="tabular text-right text-[15px] font-medium">{formatRM(amount)}</span>
                <span className="truncate text-xs text-muted-foreground">{lineDetail(line)}</span>
                <span className="tabular text-right text-xs text-muted-foreground line-through">
                  {line.discount > 0 ? formatRM(line.item.price * line.qty) : ""}
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-3 px-3 pb-3.5">
                  {line.item.kind === "device" ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">Discount</span>
                      <div className="flex flex-wrap gap-1.5">
                        {DISCOUNTS.map((d) => (
                          <Button
                            key={d}
                            size="sm"
                            variant={line.discount === d ? "default" : "outline"}
                            aria-pressed={line.discount === d}
                            onClick={() => dispatch({ type: "discount", key: line.key, amount: d })}
                          >
                            {d === 0 ? "None" : `−RM ${d}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2.5">
                    {line.item.kind === "accessory" && (
                      <>
                        <Button size="icon-sm" variant="outline" aria-label="One less" onClick={() => dispatch({ type: "qty", key: line.key, delta: -1 })}>
                          <Minus />
                        </Button>
                        <span className="tabular min-w-6 text-center">{line.qty}</span>
                        <Button size="icon-sm" variant="outline" aria-label="One more" onClick={() => dispatch({ type: "qty", key: line.key, delta: 1 })}>
                          <Plus />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => dispatch({ type: "remove", key: line.key })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t px-6 pt-4 pb-6">
        {totals.discount > 0 && (
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular">{formatRM(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discounts</span>
              <span className="tabular">{formatRM(-totals.discount)}</span>
            </div>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-medium">Total</span>
          <span className="tabular text-3xl font-semibold">{formatRM(totals.total)}</span>
        </div>
        <Button
          size="lg"
          className="h-14 text-base"
          disabled={state.lines.length === 0}
          onClick={() => dispatch({ type: "step", step: "pay" })}
        >
          {state.lines.length ? `Pay ${formatRM(totals.total)}` : "Pay"}
        </Button>
      </div>
    </>
  );
}
