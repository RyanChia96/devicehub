import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { canCancel, getEinvoices, needsAttention } from "@/api/einvoices";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Tabs } from "@/components/Tabs";
import { DataTablePagination, DataTableToolbar, Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { EinvoiceDrawer } from "@/sections/einvoices/EinvoiceDrawer";
import { STATUS_TONE } from "@/sections/einvoices/einvoice-view";

type Filter = "all" | "attention" | "Valid" | "Submitted" | "Invalid" | "Cancelled";

export default function InvoicesPage() {
  const { branch } = useBranch();
  const { data: invoices = [] } = useQuery({ queryKey: QK.einvoices(branch), queryFn: () => getEinvoices(branch) });
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [openNo, setOpenNo] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const rows = useMemo(
    () =>
      invoices.filter(
        (e) =>
          (filter === "all" || (filter === "attention" ? needsAttention(e) : e.status === filter)) &&
          (!term || `${e.no} ${e.buyer} ${e.tin} ${e.uin ?? ""}`.toLowerCase().includes(term)),
      ),
    [invoices, filter, term],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const open = invoices.find((e) => e.no === openNo) ?? null;
  const count = (s: Filter) => (s === "attention" ? invoices.filter(needsAttention).length : invoices.filter((e) => e.status === s).length);

  return (
    <>
      <PageHeader
        aside={
          <Badge variant="success">
            <CheckCircle2 /> MyInvois connected
          </Badge>
        }
      />

      <Tabs
        label="E-invoice status"
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        items={[
          { value: "all", label: "All", count: invoices.length },
          { value: "attention", label: "Needs attention", count: count("attention") },
          { value: "Valid", label: "Valid" },
          { value: "Submitted", label: "Sending" },
          { value: "Invalid", label: "Rejected" },
          { value: "Cancelled", label: "Cancelled" },
        ]}
      />

      <section className="rounded-lg border bg-card">
        <DataTableToolbar
          search={{
            value: q,
            onChange: (v) => {
              setQ(v);
              setPage(1);
            },
            placeholder: "Search invoice no., buyer, TIN or UIN",
          }}
        />
        {rows.length === 0 ? (
          <EmptyState className="m-4 border-0" title="No e-invoices here" description={filter === "attention" ? "Nothing needs attention right now." : "Try another filter or search."} />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Invoice</TableHeadCell>
                  <TableHeadCell>Buyer</TableHeadCell>
                  <TableHeadCell>Branch</TableHeadCell>
                  <TableHeadCell>Issued</TableHeadCell>
                  <TableHeadCell align="right">Total</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Cancel window</TableHeadCell>
                </TableHead>
              </TableHeader>
              <TableBody>
                {rows.slice((safePage - 1) * pageSize, safePage * pageSize).map((e) => {
                  const left = e.hoursSinceValid != null ? 72 - e.hoursSinceValid : null;
                  return (
                    <TableRow key={e.no} className="cursor-pointer hover:bg-muted/60" onClick={() => setOpenNo(e.no)}>
                      <TableCell>
                        <button type="button" className="font-mono text-[13px] font-medium">
                          {e.no}
                        </button>
                        {e.type !== "Invoice" && <span className="block text-xs text-muted-foreground">{e.type}</span>}
                      </TableCell>
                      <TableCell>
                        <span className="block">{e.buyer}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{e.tin}</span>
                      </TableCell>
                      <TableCell>{branchName(e.branch)}</TableCell>
                      <TableCell className="tabular text-[13px]">{e.issued}</TableCell>
                      <TableCell align="right" className="tabular">{formatRM(e.total)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_TONE[e.status]}>{e.status === "Submitted" ? "Sending" : e.status === "Invalid" ? "Rejected" : e.status}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-[13px] text-muted-foreground", left !== null && left < 12 && canCancel(e) && "font-medium text-warning")}>
                        {canCancel(e) && left !== null ? `${Math.floor(left)}h left` : e.status === "Valid" ? "Closed" : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {rows.length > 0 && (
          <DataTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={rows.length}
            pageCount={pageCount}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        )}
      </section>

      <EinvoiceDrawer invoice={open} onClose={() => setOpenNo(null)} />
    </>
  );
}
