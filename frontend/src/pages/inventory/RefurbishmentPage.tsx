import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { finishRefurb, getRefurbQueue, updateRefurbJob, type InventoryUnit, type RefurbJob, type RefurbStage } from "@/api/inventory";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { StatRow } from "@/components/StatRow";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { formatDate, unitCode } from "@/sections/inventory/inventory-view";

const STAGES: RefurbStage[] = ["Grading", "Waiting on part", "In repair", "Testing"];
const STAGE_VARIANT: Record<RefurbStage, "secondary" | "warning" | "info" | "success"> = {
  Grading: "secondary",
  "Waiting on part": "warning",
  "In repair": "info",
  Testing: "success",
};

type QueueItem = InventoryUnit & { job: RefurbJob };

export default function RefurbishmentPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: queue = [] } = useQuery({ queryKey: QK.refurb(branch), queryFn: () => getRefurbQueue(branch) });
  const [finishing, setFinishing] = useState<QueueItem | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["inventory"] });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<RefurbJob, "unitId">> }) => updateRefurbJob(id, patch),
    onSuccess: () => void refresh(),
  });

  const partsTotal = queue.reduce((a, q) => a + q.job.partsCost, 0);

  return (
    <>
      <PageHeader />
      <StatRow
        stats={[
          { label: "In the queue", value: String(queue.length), sub: branchName(branch) },
          { label: "Waiting on parts", value: String(queue.filter((q) => q.job.stage === "Waiting on part").length) },
          { label: "In testing", value: String(queue.filter((q) => q.job.stage === "Testing").length), sub: "Nearly ready to list" },
          { label: "Parts cost so far", value: formatRM(partsTotal) },
        ]}
      />

      <section className="rounded-lg border bg-card">
        {queue.length === 0 ? (
          <EmptyState className="m-4 border-0" title="The queue is empty" description="Trade-ins and used units marked Repairing show up here." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Device</TableHeadCell>
                  <TableHeadCell>Since</TableHeadCell>
                  <TableHeadCell>Stage</TableHeadCell>
                  <TableHeadCell align="right">Battery</TableHeadCell>
                  <TableHeadCell align="right">Parts cost (RM)</TableHeadCell>
                  <TableHeadCell>Notes</TableHeadCell>
                  <TableHeadCell />
                </TableHead>
              </TableHeader>
              <TableBody>
                {queue.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <span className="block font-medium">
                        {q.model} {q.variant}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {unitCode(q)} · {branchName(q.branch)}
                      </span>
                    </TableCell>
                    <TableCell className="tabular text-[13px]">{formatDate(q.received)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={STAGE_VARIANT[q.job.stage]}>{q.job.stage}</Badge>
                        <select
                          aria-label={`Stage for ${q.model}`}
                          className="h-8 rounded-md border border-input bg-background px-2 text-[13px]"
                          value={q.job.stage}
                          onChange={(e) => update.mutate({ id: q.id, patch: { stage: e.target.value as RefurbStage } })}
                        >
                          {STAGES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell align="right" className="tabular">{q.battery === null ? "-" : `${q.battery}%`}</TableCell>
                    <TableCell align="right">
                      <Input
                        aria-label={`Parts cost for ${q.model}`}
                        inputMode="decimal"
                        className="tabular ml-auto h-8 w-24 text-right"
                        defaultValue={q.job.partsCost}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 0 && n !== q.job.partsCost) update.mutate({ id: q.id, patch: { partsCost: n } });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Notes for ${q.model}`}
                        className="h-8 min-w-48"
                        placeholder="e.g. replace screen protector"
                        defaultValue={q.job.notes}
                        onBlur={(e) => e.target.value !== q.job.notes && update.mutate({ id: q.id, patch: { notes: e.target.value } })}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="sm" onClick={() => setFinishing(q)}>
                        Ready to sell
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <FinishDialog
        item={finishing}
        onClose={() => setFinishing(null)}
        onDone={(name) => {
          setFinishing(null);
          void refresh();
          show(`${name} is back on sale.`);
        }}
      />
    </>
  );
}

function FinishDialog({ item, onClose, onDone }: { item: QueueItem | null; onClose: () => void; onDone: (name: string) => void }) {
  const [battery, setBattery] = useState("");
  const [price, setPrice] = useState("");
  useEffect(() => {
    if (item) {
      setBattery(String(item.battery ?? ""));
      setPrice(String(item.price));
    }
  }, [item]);
  const finish = useMutation({
    mutationFn: () => finishRefurb(item!.id, Number(battery), Number(price)),
    onSuccess: () => onDone(`${item!.model} ${item!.variant}`),
  });
  const batteryOk = /^\d{1,3}$/.test(battery) && Number(battery) <= 100 && Number(battery) >= 50;
  const priceOk = Number(price) > 0;

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(o) => !o && onClose()}
    >
      {item && (
        <DialogContent className="gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Ready to sell</DialogTitle>
            <DialogDescription>
              {item.model} {item.variant}. Parts cost {formatRM(item.job.partsCost)} is added to the unit's cost.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Label className="flex flex-col items-stretch gap-2">
              Battery health (%)
              <Input inputMode="numeric" className="tabular" value={battery} aria-invalid={battery !== "" && !batteryOk} onChange={(e) => setBattery(e.target.value)} />
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              Selling price (RM)
              <Input inputMode="decimal" className="tabular" value={price} aria-invalid={price !== "" && !priceOk} onChange={(e) => setPrice(e.target.value)} />
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!batteryOk || !priceOk || finish.isPending} onClick={() => finish.mutate()}>
              Put on sale
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
