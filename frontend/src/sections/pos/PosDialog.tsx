import { CheckCircle2, ScanLine, X } from "lucide-react";
import { useState } from "react";
import { useSnackbar } from "@/components/Snackbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DEMO_TOOLS } from "@/lib/demo-flag";
import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CartPanel } from "./CartPanel";
import { PaymentPanel } from "./PaymentPanel";
import { ReceiptForm } from "./ReceiptForm";
import { TestItemsMenu } from "./TestItemsMenu";
import { usePos } from "./pos-context";

/**
 * The point of sale, as a popup over whichever screen is open. It opens when an
 * item is scanned or picked in the top-bar search. Closing keeps the cart.
 */
export function PosDialog() {
  const { state, close, addCode, counterBranch } = usePos();
  const [scan, setScan] = useState("");

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(860px,calc(100dvh-48px))] w-[min(1320px,calc(100vw-48px))] max-w-none flex-col gap-0 overflow-hidden rounded-lg p-0 text-sm text-foreground sm:max-w-none"
      >
        <header className="flex h-16 shrink-0 items-center gap-5 border-b pr-3 pl-6">
          <div className="shrink-0">
            <DialogTitle className="text-lg/[26px] font-semibold">Point of sale</DialogTitle>
            <DialogDescription className="text-xs">{counterBranch}, Counter 2</DialogDescription>
          </div>
          {state.step !== "done" && (
            <div className="flex h-10 w-full max-w-[520px] min-w-60 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
              <ScanLine className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <input
                autoFocus
                aria-label="Scan another item"
                placeholder="Scan another item: IMEI, serial, SKU"
                className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                value={scan}
                onChange={(e) => setScan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scan.trim()) {
                    e.preventDefault();
                    void addCode(scan.trim());
                    setScan("");
                  }
                }}
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {DEMO_TOOLS && state.step !== "done" && <TestItemsMenu />}
            <DialogClose
              aria-label="Close point of sale"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <X />
            </DialogClose>
          </div>
        </header>

        {state.step === "done" ? (
          <SaleComplete />
        ) : (
          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto px-8 pt-7 pb-10">
              {state.notice && (
                <div
                  role="status"
                  className={cn(
                    "max-w-[720px] rounded-lg border px-4 py-3",
                    state.notice.tone === "error" && "border-destructive/30 bg-destructive/5",
                    state.notice.tone === "warning" && "border-warning/30 bg-warning/5",
                    state.notice.tone === "info" && "border-info/30 bg-info/5",
                  )}
                >
                  <p className="font-medium">{state.notice.title}</p>
                  {state.notice.body && <p className="mt-0.5 text-muted-foreground">{state.notice.body}</p>}
                </div>
              )}
              <ReceiptForm />
            </section>
            <aside className="flex w-[420px] shrink-0 flex-col border-l bg-muted/40">
              {state.step === "cart" ? <CartPanel /> : <PaymentPanel />}
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SaleComplete() {
  const { state, dispatch } = usePos();
  const { show } = useSnackbar();
  const sale = state.lastSale;
  if (!sale) return null;

  return (
    <div className="flex flex-1 justify-center overflow-auto px-8 pt-10 pb-10">
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-[28px]/9 font-semibold tracking-tight">Sale complete</h2>
            <p className="text-[13px] text-muted-foreground">
              <span className="font-mono">{sale.number}</span> · {sale.method}
            </p>
          </div>
        </div>

        {sale.change > 0 && (
          <div className="flex items-baseline justify-between rounded-lg border bg-card px-6 py-4">
            <span className="text-[15px] font-medium">Change due</span>
            <span className="tabular text-3xl font-semibold">{formatRM(sale.change)}</span>
          </div>
        )}

        <div className="flex items-baseline justify-between rounded-lg border bg-card px-6 py-4">
          <span className="font-semibold">Total</span>
          <span className="tabular text-xl font-semibold">{formatRM(sale.total)}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <h3 className="text-base font-semibold">Receipt</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => show("Receipt sent to the 80mm printer.")}>Print 80mm</Button>
            <Button variant="outline" onClick={() => show("A4 invoice opened for printing.")}>Print A4</Button>
            <Button variant="outline" onClick={() => show("Receipt emailed to the buyer.")}>Email</Button>
            <Button variant="outline" onClick={() => show("WhatsApp opened with the receipt link.")}>WhatsApp</Button>
          </div>
        </div>

        <Button size="lg" className="h-14 self-start px-10 text-base" onClick={() => dispatch({ type: "newSale" })}>
          New sale
        </Button>
      </div>
    </div>
  );
}
