import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABEL,
  commissionFor,
  getCommissionStatuses,
  getRates,
  getSales,
  saveRates,
  setCommissionStatus,
  SALES_STAFF,
  type CommissionRates,
  type CommissionStatus,
  type SaleCategory,
} from "@/api/sales";
import { getCurrentUser } from "@/api/auth";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { StatRow } from "@/components/StatRow";
import { Tabs } from "@/components/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: "2026-11", label: "November 2026" },
  { value: "2026-10", label: "October 2026" },
];
const TONE: Record<CommissionStatus, "secondary" | "warning" | "info" | "success"> = {
  "In progress": "secondary",
  "Pending approval": "warning",
  Approved: "info",
  Paid: "success",
};
const CATS: SaleCategory[] = ["new", "comp", "acc", "used"];

export default function CommissionPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState("2026-11");
  const [tab, setTab] = useState<"statements" | "rates">("statements");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: user } = useQuery({ queryKey: QK.currentUser(), queryFn: getCurrentUser });
  const { data: lines = [] } = useQuery({ queryKey: QK.sales(branch), queryFn: () => getSales(branch) });
  const { data: rates } = useQuery({ queryKey: QK.commissionRates(month), queryFn: () => getRates(month) });
  const { data: statuses = {} } = useQuery({ queryKey: QK.commissionStatuses(month), queryFn: () => getCommissionStatuses(month) });
  const isOwner = user?.role === "Owner";

  const statusMutation = useMutation({
    mutationFn: ({ staffId, status }: { staffId: string; status: CommissionStatus }) => setCommissionStatus(month, staffId, status),
    onSuccess: (_, { staffId, status }) => {
      void queryClient.invalidateQueries({ queryKey: ["commission"] });
      show(`${SALES_STAFF.find((s) => s.id === staffId)?.name}'s ${MONTHS.find((m) => m.value === month)?.label} commission ${status === "Paid" ? "marked as paid" : "approved"}.`);
    },
  });

  const monthLines = useMemo(() => lines.filter((l) => l.date.startsWith(month)), [lines, month]);
  const people = SALES_STAFF.filter((s) => !branch || s.branch === branch).map((s) => {
    const ls = monthLines.filter((l) => l.staffId === s.id);
    return {
      ...s,
      lines: ls,
      sales: ls.reduce((a, l) => a + l.amount, 0),
      commission: rates ? ls.reduce((a, l) => a + commissionFor(l, rates), 0) : 0,
      status: statuses[s.id] ?? "In progress",
    };
  });
  const open = people.find((p) => p.id === openId) ?? null;
  const total = people.reduce((a, p) => a + p.commission, 0);
  const paid = people.filter((p) => p.status === "Paid").reduce((a, p) => a + p.commission, 0);
  const pending = people.filter((p) => p.status === "Pending approval").length;

  return (
    <>
      <PageHeader
        actions={
          <div role="group" aria-label="Month" className="inline-flex rounded-md border border-input p-1">
            {MONTHS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={month === m.value}
                onClick={() => {
                  setMonth(m.value);
                  setOpenId(null);
                }}
                className="h-8 rounded-sm px-3 text-[13px] font-medium aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />

      <StatRow
        stats={[
          { label: "Sales that earn commission", value: formatRM(people.reduce((a, p) => a + p.sales, 0)), sub: branchName(branch) },
          { label: "Commission earned", value: formatRM(total), sub: month === "2026-11" ? "Month to date" : "Closed month" },
          { label: "Paid out", value: formatRM(paid) },
          { label: "Still to pay", value: formatRM(total - paid), sub: pending ? `${pending} waiting for approval` : "Nothing waiting for approval" },
        ]}
      />

      <Tabs
        label="Commission view"
        value={tab}
        onChange={setTab}
        items={[
          { value: "statements", label: "Statements" },
          { value: "rates", label: "Rates" },
        ]}
      />

      {tab === "statements" ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Staff</TableHeadCell>
                  <TableHeadCell align="right">Sales</TableHeadCell>
                  <TableHeadCell align="right">Commission</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableHead>
              </TableHeader>
              <TableBody>
                {people.map((p) => (
                  <TableRow
                    key={p.id}
                    className={cn("cursor-pointer hover:bg-muted/60", openId === p.id && "bg-muted")}
                    onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  >
                    <TableCell>
                      <button type="button" className="text-left font-medium" aria-pressed={openId === p.id}>
                        {p.name}
                      </button>
                      <span className="block text-xs text-muted-foreground">{branchName(p.branch)}</span>
                    </TableCell>
                    <TableCell align="right" className="tabular">{formatRM(p.sales)}</TableCell>
                    <TableCell align="right" className="tabular font-semibold">{formatRM(p.commission)}</TableCell>
                    <TableCell>
                      <Badge variant={TONE[p.status]}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {open && rates ? (
            <section aria-labelledby="statement" className="rounded-lg border bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3.5">
                <div className="min-w-0">
                  <h2 id="statement" className="text-[15px] font-semibold">
                    {open.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {open.lines.length} sales in {MONTHS.find((m) => m.value === month)?.label}
                  </p>
                </div>
                <Badge variant={TONE[open.status]}>{open.status}</Badge>
                <div className="ml-auto flex gap-2">
                  {open.status === "Pending approval" && (
                    <Button size="sm" onClick={() => statusMutation.mutate({ staffId: open.id, status: "Approved" })}>
                      Approve
                    </Button>
                  )}
                  {open.status === "Approved" && isOwner && (
                    <Button size="sm" onClick={() => statusMutation.mutate({ staffId: open.id, status: "Paid" })}>
                      Mark as paid
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => show(`Exported commission-${open.id}-${month}.pdf.`)}>
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableHead>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Item</TableHeadCell>
                      <TableHeadCell align="right">Sale</TableHeadCell>
                      <TableHeadCell align="right">Rate</TableHeadCell>
                      <TableHeadCell align="right">Earned</TableHeadCell>
                    </TableHead>
                  </TableHeader>
                  <TableBody>
                    {open.lines.map((l) => {
                      const c = commissionFor(l, rates);
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="tabular text-[13px]">{l.date.slice(8)}/{l.date.slice(5, 7)}</TableCell>
                          <TableCell>
                            <span className="block">{l.item}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">{l.invoice}</span>
                          </TableCell>
                          <TableCell align="right" className={cn("tabular", l.amount < 0 && "text-destructive")}>{formatRM(l.amount)}</TableCell>
                          <TableCell align="right" className="tabular text-muted-foreground">
                            {l.category === "used" ? `RM ${rates.used}/unit` : `${rates[l.category]}%`}
                          </TableCell>
                          <TableCell align="right" className={cn("tabular", c < 0 && "text-destructive")}>{formatRM(c)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between border-t px-4 py-3 text-sm font-semibold">
                <span>Commission</span>
                <span className="tabular">{formatRM(open.commission)}</span>
              </div>
            </section>
          ) : (
            <p className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
              Select a person to see each sale and what it earned.
            </p>
          )}
        </div>
      ) : (
        rates && <RatesEditor rates={rates} editable={isOwner && month === "2026-11"} month={month} />
      )}
    </>
  );
}

function RatesEditor({ rates, editable, month }: { rates: CommissionRates; editable: boolean; month: string }) {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<SaleCategory, string>>(() => Object.fromEntries(CATS.map((c) => [c, String(rates[c])])) as Record<SaleCategory, string>);
  useEffect(() => setDraft(Object.fromEntries(CATS.map((c) => [c, String(rates[c])])) as Record<SaleCategory, string>), [rates]);
  const save = useMutation({
    mutationFn: saveRates,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commission"] });
      show("Commission rates saved. November statements are recalculated.");
    },
  });
  const valid = CATS.every((c) => /^\d+(\.\d+)?$/.test(draft[c]) && Number(draft[c]) <= (c === "used" ? 1000 : 50));
  const dirty = CATS.some((c) => Number(draft[c]) !== rates[c]);

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3.5 text-[13px] text-muted-foreground">
        {editable
          ? "Changes apply to November 2026 onwards. October is closed and keeps its rates."
          : month === "2026-10"
            ? "October is closed. These are the rates it was calculated with."
            : "Only the owner can change rates."}
      </div>
      <Table>
        <TableHeader>
          <TableHead>
            <TableHeadCell>Category</TableHeadCell>
            <TableHeadCell>Paid on</TableHeadCell>
            <TableHeadCell>Rate</TableHeadCell>
          </TableHead>
        </TableHeader>
        <TableBody>
          {CATS.map((c) => (
            <TableRow key={c}>
              <TableCell className="font-medium">{CATEGORY_LABEL[c]}</TableCell>
              <TableCell className="text-muted-foreground">{c === "used" ? "Each unit sold" : "Sale price after discount"}</TableCell>
              <TableCell>
                {editable ? (
                  <span className="flex items-center gap-2">
                    <Input
                      aria-label={`${CATEGORY_LABEL[c]} rate`}
                      inputMode="decimal"
                      className="tabular w-24 text-right"
                      value={draft[c]}
                      onChange={(e) => setDraft((d) => ({ ...d, [c]: e.target.value.trim() }))}
                    />
                    <span className="text-sm text-muted-foreground">{c === "used" ? "RM / unit" : "%"}</span>
                  </span>
                ) : (
                  <span className="tabular">{c === "used" ? `RM ${rates[c]} / unit` : `${rates[c]}%`}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editable && (
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button
            disabled={!valid || !dirty || save.isPending}
            onClick={() => save.mutate(Object.fromEntries(CATS.map((c) => [c, Number(draft[c])])) as unknown as CommissionRates)}
          >
            Save rates
          </Button>
        </div>
      )}
    </section>
  );
}
