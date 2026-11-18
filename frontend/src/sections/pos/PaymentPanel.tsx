import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";
import { missingBuyerFields, receiptRule, usePos, type PayMethod } from "./pos-context";

const METHODS: PayMethod[] = ["Cash", "Card", "DuitNow QR", "E-wallet", "Bank transfer", "Instalment"];

/** Right panel after Pay: amount due, one payment method, cash change, Complete. */
export function PaymentPanel() {
  const { state, totals, dispatch } = usePos();
  const rule = receiptRule(state, totals);
  const due = totals.total;
  const tenders = [due, Math.ceil(due / 10) * 10, Math.ceil(due / 50) * 50, Math.ceil(due / 100) * 100]
    .filter((v, i, all) => all.indexOf(v) === i)
    .slice(0, 4);

  const missing = rule.effective === "einv" ? missingBuyerFields(state.buyer) : [];
  const reason = rule.blocked
    ? "Fix the receipt problem first."
    : missing.length
      ? `E-invoice needs the buyer's ${missing.join(", ")}.`
      : !state.method
        ? "Pick a payment method."
        : state.method === "Cash" && (state.cashReceived ?? 0) < due
          ? "Pick the cash received."
          : "";
  const change = state.method === "Cash" && state.cashReceived ? state.cashReceived - due : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 pt-5 pb-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 self-start text-muted-foreground"
        onClick={() => dispatch({ type: "step", step: "cart" })}
      >
        <ChevronLeft /> Back to cart
      </Button>

      <div>
        <div className="text-[13px] text-muted-foreground">Amount due</div>
        <div className="tabular text-[34px]/[42px] font-semibold">{formatRM(due)}</div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Pay with</h3>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <Button
              key={m}
              variant={state.method === m ? "default" : "outline"}
              aria-pressed={state.method === m}
              className="h-13 px-2"
              onClick={() => dispatch({ type: "method", method: m })}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {state.method === "Cash" && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-base font-semibold">Cash received</h3>
          <div className="flex flex-wrap gap-1.5">
            {tenders.map((v, i) => (
              <Button
                key={v}
                size="sm"
                variant={state.cashReceived === v ? "default" : "outline"}
                onClick={() => dispatch({ type: "cash", amount: v })}
              >
                {i === 0 ? `Exact ${formatRM(v)}` : formatRM(v)}
              </Button>
            ))}
          </div>
          <div className="flex items-baseline justify-between">
            <span>Change due</span>
            <span className="tabular text-2xl font-semibold">{formatRM(Math.max(change, 0))}</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2.5">
        <Button
          size="lg"
          className="h-14 text-base"
          disabled={Boolean(reason)}
          onClick={() =>
            dispatch({
              type: "complete",
              sale: {
                number: `${rule.effective === "einv" ? "INV" : "CB"}-KLSW-2611-${String(state.seq).padStart(5, "0")}`,
                total: due,
                method: state.method as PayMethod,
                change: Math.max(change, 0),
                receipt: rule.effective,
              },
            })
          }
        >
          {rule.effective === "einv" ? "Complete and send e-invoice" : "Complete sale"}
        </Button>
        <p className={cn("text-center text-[13px] text-muted-foreground", !reason && "invisible")}>
          {reason || "Ready"}
        </p>
      </div>
    </div>
  );
}
