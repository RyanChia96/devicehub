import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSelfBilled, submitSelfBilled } from "@/api/einvoices";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { StatRow } from "@/components/StatRow";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";

/** Trade-ins bought from individuals: the shop issues the e-invoice on the seller's behalf. */
export default function SelfBilledPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: QK.selfBilled(branch), queryFn: () => getSelfBilled(branch) });
  const submit = useMutation({
    mutationFn: submitSelfBilled,
    onSuccess: (_, no) => {
      void queryClient.invalidateQueries({ queryKey: ["einvoices"] });
      show(`${no} submitted to MyInvois.`);
    },
  });
  const waiting = rows.filter((r) => r.status !== "Valid");

  return (
    <>
      <PageHeader />
      <StatRow
        stats={[
          { label: "Trade-ins this month", value: String(rows.length), sub: branchName(branch) },
          { label: "Paid to sellers", value: formatRM(rows.reduce((a, r) => a + r.amount, 0)) },
          { label: "Not yet valid", value: String(waiting.length), sub: waiting.length ? "Submit them before month end" : "All submitted" },
        ]}
      />
      <section className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableHead>
                <TableHeadCell>Self-billed no.</TableHeadCell>
                <TableHeadCell>Seller</TableHeadCell>
                <TableHeadCell>Device</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell align="right">Paid</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell />
              </TableHead>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.no}>
                  <TableCell className="font-mono text-[13px] font-medium">{r.no}</TableCell>
                  <TableCell>
                    <span className="block">{r.seller}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{r.idNo}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block">{r.device}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{r.imei}</span>
                  </TableCell>
                  <TableCell className="tabular text-[13px]">{r.date}</TableCell>
                  <TableCell align="right" className="tabular">{formatRM(r.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Valid" ? "success" : r.status === "Pending" ? "info" : "warning"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    {r.status === "Not submitted" && (
                      <Button size="sm" onClick={() => submit.mutate(r.no)}>
                        Submit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
