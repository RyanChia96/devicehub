import type { InventoryUnit, UnitStatus } from "@/api/inventory";
import { useSnackbar } from "@/components/Snackbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { STATUSES, STATUS_VARIANT, formatDate, marginPct, unitCode } from "./inventory-view";

interface UnitDrawerProps {
  unit: InventoryUnit | null;
  onClose: () => void;
  onSetStatus: (unit: InventoryUnit, status: UnitStatus) => void;
}

/** Item details and history, opened by clicking a row. */
export function UnitDrawer({ unit, onClose, onSetStatus }: UnitDrawerProps) {
  const { show } = useSnackbar();

  return (
    <Sheet open={Boolean(unit)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[440px]">
        {unit && (
          <>
            <SheetHeader className="gap-1.5 border-b px-6 pt-6 pb-5">
              <SheetTitle className="pr-8 text-lg font-semibold">
                {unit.model} {unit.variant}
              </SheetTitle>
              <SheetDescription>
                {unit.color} · {branchName(unit.branch)}
              </SheetDescription>
              <div className="pt-1">
                <Badge variant={STATUS_VARIANT[unit.status]}>{unit.status}</Badge>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Detail label={unit.imei ? "IMEI" : "Serial"} value={unitCode(unit)} mono />
                <Detail label="Condition" value={unit.condition} />
                <Detail label="Price" value={formatRM(unit.price)} mono />
                <Detail label="Cost" value={formatRM(unit.cost)} mono />
                <Detail label="Margin" value={`${marginPct(unit).toFixed(1)}%`} mono />
                <Detail label="Battery" value={unit.battery === null ? "-" : `${unit.battery}%`} mono />
                <Detail label="Received" value={formatDate(unit.received)} mono />
                <Detail label="Sales document" value={unit.cashBillOnly ? "Cash bill only" : "Any"} />
                <Detail label="Supplier" value={unit.supplier} wide />
              </dl>

              <section aria-labelledby="unit-history" className="flex flex-col gap-3">
                <h3 id="unit-history" className="text-sm font-semibold">
                  History
                </h3>
                <ol className="flex flex-col gap-3 border-l pl-4">
                  {unit.history.map((h, i) => (
                    <li key={`${h.at}-${i}`} className="text-sm">
                      <span className="block font-medium">{h.what}</span>
                      <span className="block text-xs text-muted-foreground">
                        {h.at} · {h.by}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div className="flex gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => show(`Label for ${unit.model} sent to the label printer.`)}>
                Print label
              </Button>
              {unit.status !== "Sold" && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" />}>Mark status</DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {STATUSES.filter((s) => s !== "Sold" && s !== unit.status).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => onSetStatus(unit, s)}>
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "tabular mt-0.5 text-sm" : "mt-0.5 text-sm"}>{value}</dd>
    </div>
  );
}
