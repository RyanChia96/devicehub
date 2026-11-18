import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConsolidated, submitConsolidated } from "@/api/einvoices";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";

/** Monthly consolidated e-invoice: every cash bill of a month, submitted by the 7th of the next. */
export default function ConsolidatedPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: months = [] } = useQuery({ queryKey: QK.consolidated(branch), queryFn: () => getConsolidated(branch) });
  const submit = useMutation({
    mutationFn: submitConsolidated,
    onSuccess: (_, month) => {
      void queryClient.invalidateQueries({ queryKey: ["einvoices"] });
      show(`${month} consolidated e-invoice submitted.`);
    },
  });
  const current = months.find((m) => m.status === "Open");

  return (
    <>
      <PageHeader />

      {current && (
        <section className="flex flex-wrap items-center gap-6 rounded-lg border bg-card px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">This month</p>
            <h2 className="text-lg font-semibold">{current.month}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.cashBills} cash bills so far, {formatRM(current.total)}. Submission opens after the month ends and is due by{" "}
              {current.due}.
            </p>
          </div>
          <Button disabled>Submit after 30 November</Button>
        </section>
      )}

      <section className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableHead>
              <TableHeadCell>Month</TableHeadCell>
              <TableHeadCell align="right">Cash bills</TableHeadCell>
              <TableHeadCell align="right">Total</TableHeadCell>
              <TableHeadCell>Due</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Submitted</TableHeadCell>
              <TableHeadCell />
            </TableHead>
          </TableHeader>
          <TableBody>
            {months.map((m) => (
              <TableRow key={m.month}>
                <TableCell className="font-medium">{m.month}</TableCell>
                <TableCell align="right" className="tabular">{m.cashBills}</TableCell>
                <TableCell align="right" className="tabular">{formatRM(m.total)}</TableCell>
                <TableCell className="tabular text-[13px]">{m.due}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "Valid" ? "success" : m.status === "Ready" ? "warning" : "secondary"}>
                    {m.status === "Open" ? "Month open" : m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {m.submitted ? (
                    <>
                      <span className="tabular block">{m.submitted}</span>
                      <span className="block font-mono text-[11px]">{m.uin}</span>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell align="right">
                  {m.status === "Ready" && (
                    <Button size="sm" onClick={() => submit.mutate(m.month)}>
                      Review and submit
                    </Button>
                  )}
                  {m.status === "Valid" && (
                    <Button size="sm" variant="outline" onClick={() => show(`Downloaded ${m.month} consolidated e-invoice.`)}>
                      Download
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
