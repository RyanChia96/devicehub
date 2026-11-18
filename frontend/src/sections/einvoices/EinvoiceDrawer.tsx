import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { cancelEinvoice, canCancel, issueNote, resubmit, validateTin, type Einvoice } from "@/api/einvoices";
import { useSnackbar } from "@/components/Snackbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { STATUS_TONE } from "./einvoice-view";

const REASONS = ["Wrong buyer details", "Wrong amount", "Sale cancelled by the buyer", "Duplicate e-invoice"];
const NOTES = ["Credit note", "Refund note", "Debit note"] as const;

export function EinvoiceDrawer({ invoice, onClose }: { invoice: Einvoice | null; onClose: () => void }) {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["einvoices"] });
  const [tin, setTin] = useState("");
  const [tinMsg, setTinMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [noteType, setNoteType] = useState<(typeof NOTES)[number]>("Credit note");
  const [noteAmount, setNoteAmount] = useState("");

  useEffect(() => {
    setTin(invoice?.tin ?? "");
    setTinMsg(null);
    setNoteAmount(invoice ? String(Math.abs(invoice.total)) : "");
  }, [invoice?.no]); // eslint-disable-line react-hooks/exhaustive-deps

  const resubmitM = useMutation({
    mutationFn: () => resubmit(invoice!.no, tin),
    onSuccess: (next) => {
      void refresh();
      show(next.status === "Valid" ? `${next.no} is now Valid on MyInvois.` : "LHDN rejected it again. Check the TIN with the buyer.");
      if (next.status === "Valid") onClose();
    },
  });
  const cancelM = useMutation({
    mutationFn: () => cancelEinvoice(invoice!.no, reason),
    onSuccess: () => {
      void refresh();
      show(`${invoice!.no} cancelled on MyInvois.`);
      onClose();
    },
  });
  const noteM = useMutation({
    mutationFn: () => issueNote(invoice!.no, noteType, Number(noteAmount)),
    onSuccess: (noteNo) => {
      void refresh();
      show(`${noteType} ${noteNo} issued.`);
      onClose();
    },
  });

  const hoursLeft = invoice?.hoursSinceValid != null ? 72 - invoice.hoursSinceValid : null;
  const select = "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm";

  return (
    <Sheet open={Boolean(invoice)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[460px]">
        {invoice && (
          <>
            <SheetHeader className="gap-1.5 border-b px-6 pt-6 pb-5">
              <SheetTitle className="pr-8 font-mono text-base font-semibold">{invoice.no}</SheetTitle>
              <SheetDescription>
                {invoice.type} · {branchName(invoice.branch)} · {invoice.issued}
              </SheetDescription>
              <div className="pt-1">
                <Badge variant={STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-5">
              {invoice.status === "Invalid" && (
                <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                  <p className="font-medium text-destructive">LHDN rejected this e-invoice</p>
                  <p className="mt-0.5 text-muted-foreground">{invoice.error} The sale and payment are saved.</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Item label="Buyer" value={invoice.buyer} wide />
                <Item label={invoice.idType === "BRN" ? "BRN" : invoice.idType === "PASSPORT" ? "Passport" : "MyKad"} value={invoice.idNo} mono />
                <Item label="TIN" value={invoice.tin} mono />
                <Item label="Email" value={invoice.email} wide />
                <Item label="Total" value={formatRM(invoice.total)} mono />
                <Item label="UIN" value={invoice.uin ?? "-"} mono wide />
              </dl>

              {invoice.status === "Invalid" && (
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Fix and resubmit</h3>
                  <Label className="flex flex-col items-stretch gap-2">
                    Buyer TIN
                    <span className="flex gap-2">
                      <Input className="font-mono" value={tin} onChange={(e) => setTin(e.target.value)} />
                      <Button variant="outline" onClick={async () => setTinMsg(await validateTin(tin))}>
                        Validate
                      </Button>
                    </span>
                  </Label>
                  {tinMsg && <p className={tinMsg.ok ? "text-xs text-success" : "text-xs text-destructive"}>{tinMsg.message}</p>}
                  {invoice.correctTin && (
                    <Button variant="ghost" size="sm" className="-ml-3 self-start" onClick={() => setTin(invoice.correctTin!)}>
                      Use TIN on file
                    </Button>
                  )}
                  <Button disabled={!tin.trim() || resubmitM.isPending} onClick={() => resubmitM.mutate()}>
                    Resubmit e-invoice
                  </Button>
                </section>
              )}

              {invoice.status === "Submitted" && (
                <p className="text-sm text-muted-foreground">Sending to LHDN. The result shows here once MyInvois replies.</p>
              )}

              {canCancel(invoice) && hoursLeft !== null && (
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Cancel e-invoice</h3>
                  <p className="text-[13px] text-muted-foreground">
                    {Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m left in the 72-hour window. After that, issue a credit or refund note instead.
                  </p>
                  <Label className="flex flex-col items-stretch gap-2">
                    Reason
                    <select className={select} value={reason} onChange={(e) => setReason(e.target.value)}>
                      {REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Label>
                  <Button variant="outline" className="text-destructive" disabled={cancelM.isPending} onClick={() => cancelM.mutate()}>
                    Cancel e-invoice
                  </Button>
                </section>
              )}

              {invoice.status === "Valid" && !canCancel(invoice) && invoice.type === "Invoice" && (
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Adjust with a note</h3>
                  <p className="text-[13px] text-muted-foreground">The 72-hour cancel window has closed.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Label className="flex flex-col items-stretch gap-2">
                      Type
                      <select className={select} value={noteType} onChange={(e) => setNoteType(e.target.value as (typeof NOTES)[number])}>
                        {NOTES.map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </Label>
                    <Label className="flex flex-col items-stretch gap-2">
                      Amount (RM)
                      <Input inputMode="decimal" className="tabular" value={noteAmount} onChange={(e) => setNoteAmount(e.target.value)} />
                    </Label>
                  </div>
                  <Button disabled={!(Number(noteAmount) > 0) || noteM.isPending} onClick={() => noteM.mutate()}>
                    Issue {noteType.toLowerCase()}
                  </Button>
                </section>
              )}

              {invoice.status === "Cancelled" && (
                <p className="text-sm text-muted-foreground">Cancelled on MyInvois. Reason: {invoice.cancelReason}.</p>
              )}
            </div>

            <div className="flex gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => show(`${invoice.no} sent to the printer.`)}>
                Reprint
              </Button>
              <Button variant="outline" onClick={() => show(`${invoice.no} emailed to ${invoice.email}.`)}>
                Email buyer
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Item({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono text-[13px] break-all" : "mt-0.5"}>{value}</dd>
    </div>
  );
}
