import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { receiptRule, usePos, type Buyer } from "./pos-context";

const ID_PLACEHOLDER: Record<Buyer["idType"], string> = {
  NRIC: "900514-14-5523",
  BRN: "201901023456",
  PASSPORT: "A12345678",
  ARMY: "T1234567",
};

/**
 * Left side of the POS: E-invoice (default) or Cash bill, and the buyer fields.
 * For a cash bill the fields stay on screen, greyed out and locked.
 */
export function ReceiptForm() {
  const { state, totals, dispatch } = usePos();
  const rule = receiptRule(state, totals);
  const locked = rule.effective !== "einv";
  const b = state.buyer;
  const set = (patch: Partial<Buyer>) => dispatch({ type: "buyer", patch });

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div role="group" aria-label="Receipt type" className="inline-flex self-start rounded-md border border-input p-1">
          {(
            [
              ["einv", "E-invoice", rule.einvLocked],
              ["cash", "Cash bill", rule.cashLocked],
            ] as const
          ).map(([value, label, disabled]) => (
            <button
              key={value}
              type="button"
              aria-pressed={rule.effective === value}
              disabled={disabled}
              onClick={() => dispatch({ type: "receipt", receipt: value })}
              className="h-10 rounded-sm px-5 text-sm font-medium text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground disabled:cursor-not-allowed disabled:text-muted-foreground disabled:line-through"
            >
              {label}
            </button>
          ))}
        </div>
        {rule.einvLocked && !rule.blocked && (
          <p className="text-[13px] text-muted-foreground">
            E-invoice is off: {totals.cashBillOnly.join(", ")} {totals.cashBillOnly.length > 1 ? "are" : "is"} cash bill only.
          </p>
        )}
        {rule.cashLocked && !rule.blocked && (
          <p className="text-[13px] text-muted-foreground">Sales over RM 10,000 need an e-invoice.</p>
        )}
      </div>

      {rule.blocked ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Can't check out this cart yet</p>
          <p className="mt-1 text-muted-foreground">
            This sale is over RM 10,000, so it needs an e-invoice, but {totals.cashBillOnly.join(", ")}{" "}
            {totals.cashBillOnly.length > 1 ? "are" : "is"} cash bill only. Remove{" "}
            {totals.cashBillOnly.length > 1 ? "them" : "it"} to continue.
          </p>
        </div>
      ) : (
        <fieldset
          disabled={locked}
          aria-label="E-invoice buyer"
          className={cn("grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 transition-opacity", locked && "opacity-45")}
        >
          <Field label="Name or company" required className="col-span-1">
            <Input value={b.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="ID type" required>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
              value={b.idType}
              onChange={(e) => set({ idType: e.target.value as Buyer["idType"] })}
            >
              <option value="NRIC">NRIC (MyKad)</option>
              <option value="BRN">BRN (company)</option>
              <option value="PASSPORT">Passport</option>
              <option value="ARMY">Army ID</option>
            </select>
          </Field>
          <Field label="ID no." required>
            <Input className="font-mono" placeholder={ID_PLACEHOLDER[b.idType]} value={b.idNo} onChange={(e) => set({ idNo: e.target.value })} />
          </Field>
          <Field label="TIN" required>
            <Input className="font-mono" value={b.tin} onChange={(e) => set({ tin: e.target.value })} />
          </Field>
          <Field label="Address" required className="col-span-2">
            <Input value={b.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={b.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={b.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="SST no. (optional)">
            <Input className="font-mono" value={b.sst} onChange={(e) => set({ sst: e.target.value })} />
          </Field>
        </fieldset>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Label className={cn("flex flex-col items-stretch gap-2 font-medium", className)}>
      <span>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </Label>
  );
}
