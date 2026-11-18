import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getMonthly, getSales, getYearly, SALES_STAFF, type PeriodTotal, type SaleLine } from "@/api/sales";
import { BarChart } from "@/components/BarChart";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { StatRow } from "@/components/StatRow";
import { Tabs } from "@/components/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";

type Period = "daily" | "monthly" | "yearly";

const k = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}m` : `${(v / 1000).toFixed(0)}k`);
const pct = (sales: number, cost: number) => (sales ? `${(((sales - cost) / sales) * 100).toFixed(1)}%` : "-");

function group(lines: SaleLine[], key: (l: SaleLine) => string) {
  const m = new Map<string, { sales: number; cost: number; count: number }>();
  for (const l of lines) {
    const g = m.get(key(l)) ?? { sales: 0, cost: 0, count: 0 };
    g.sales += l.amount;
    g.cost += l.cost;
    g.count += 1;
    m.set(key(l), g);
  }
  return [...m.entries()].map(([name, g]) => ({ name, ...g })).sort((a, b) => b.sales - a.sales);
}

export default function SalesReportsPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const [period, setPeriod] = useState<Period>("daily");
  const { data: lines = [] } = useQuery({ queryKey: QK.sales(branch), queryFn: () => getSales(branch) });
  const { data: monthly = [] } = useQuery({ queryKey: QK.monthly(branch), queryFn: () => getMonthly(branch) });
  const { data: yearly = [] } = useQuery({ queryKey: QK.yearly(branch), queryFn: () => getYearly(branch) });

  // Daily: the last 14 days, pick any one for the breakdown.
  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 10, 18 - i));
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, []);
  const [day, setDay] = useState(days[days.length - 1]);
  const dayTotals: PeriodTotal[] = days.map((d) => {
    const ls = lines.filter((l) => l.date === d);
    return { label: d, sales: ls.reduce((a, l) => a + l.amount, 0), cost: ls.reduce((a, l) => a + l.cost, 0), transactions: ls.length };
  });

  const scopeLines =
    period === "daily" ? lines.filter((l) => l.date === day) : period === "monthly" ? lines.filter((l) => l.date.startsWith("2026-11")) : lines;
  const totals = period === "daily" ? dayTotals.find((t) => t.label === day) : period === "monthly" ? monthly[monthly.length - 1] : yearly[yearly.length - 1];
  const prev =
    period === "daily" ? dayTotals[dayTotals.findIndex((t) => t.label === day) - 1] : period === "monthly" ? monthly[monthly.length - 2] : yearly[yearly.length - 2];
  const change = totals && prev && prev.sales ? Math.round(((totals.sales - prev.sales) / prev.sales) * 100) : null;
  const periodName =
    period === "daily"
      ? new Date(`${day}T00:00:00Z`).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
      : period === "monthly"
        ? "November 2026 (to 18 Nov)"
        : "2026 so far";

  const byBrand = group(scopeLines, (l) => l.brand);
  const byStaff = group(scopeLines, (l) => SALES_STAFF.find((s) => s.id === l.staffId)?.name ?? l.staffId);
  const chart =
    period === "daily"
      ? { labels: days.map((d) => d.slice(8)), values: dayTotals.map((t) => t.sales), highlight: days.indexOf(day) }
      : period === "monthly"
        ? { labels: monthly.map((m) => m.label), values: monthly.map((m) => m.sales), highlight: monthly.length - 1 }
        : { labels: yearly.map((y) => y.label), values: yearly.map((y) => y.sales), highlight: yearly.length - 1 };

  return (
    <>
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => show(`Exported sales-${period}-${branch || "all-branches"}.pdf.`)}>
            Export PDF
          </Button>
        }
      />

      <Tabs
        label="Report period"
        value={period}
        onChange={setPeriod}
        items={[
          { value: "daily", label: "Daily" },
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
        <span>
          {periodName} · {branchName(branch)}
        </span>
        {period === "daily" && (
          <select
            aria-label="Day"
            className="ml-auto h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {[...days].reverse().map((d) => (
              <option key={d} value={d}>
                {new Date(`${d}T00:00:00Z`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
              </option>
            ))}
          </select>
        )}
      </div>

      {totals && (
        <StatRow
          stats={[
            { label: "Sales", value: formatRM(totals.sales), sub: change === null ? undefined : `${change >= 0 ? "+" : "−"}${Math.abs(change)}% vs the period before` },
            { label: "Gross profit", value: formatRM(totals.sales - totals.cost), sub: `${pct(totals.sales, totals.cost)} margin` },
            { label: "Transactions", value: totals.transactions.toLocaleString("en-MY"), sub: totals.transactions ? `${formatRM(totals.sales / totals.transactions)} average` : undefined },
          ]}
        />
      )}

      <BarChart
        title={period === "daily" ? "Sales, last 14 days" : period === "monthly" ? "Sales by month, 2026" : "Sales by year"}
        labels={chart.labels}
        values={chart.values}
        highlight={chart.highlight}
        format={formatRM}
        short={k}
      />

      {period === "yearly" ? (
        <PeriodTable rows={yearly} first="Year" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Breakdown title="By brand" rows={byBrand} />
          <Breakdown title="By staff" rows={byStaff} />
        </div>
      )}
      {period === "monthly" && <PeriodTable rows={monthly} first="Month" />}
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { name: string; sales: number; cost: number; count: number }[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <h2 className="border-b px-4 py-3.5 text-[15px] font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No sales in this period.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableHead>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell align="right">Sales</TableHeadCell>
              <TableHeadCell align="right">Margin</TableHeadCell>
              <TableHeadCell align="right">Lines</TableHeadCell>
            </TableHead>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell align="right" className="tabular">{formatRM(r.sales)}</TableCell>
                <TableCell align="right" className="tabular">{pct(r.sales, r.cost)}</TableCell>
                <TableCell align="right" className="tabular">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function PeriodTable({ rows, first }: { rows: PeriodTotal[]; first: string }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableHead>
              <TableHeadCell>{first}</TableHeadCell>
              <TableHeadCell align="right">Sales</TableHeadCell>
              <TableHeadCell align="right">Cost</TableHeadCell>
              <TableHeadCell align="right">Gross profit</TableHeadCell>
              <TableHeadCell align="right">Margin</TableHeadCell>
              <TableHeadCell align="right">Transactions</TableHeadCell>
            </TableHead>
          </TableHeader>
          <TableBody>
            {[...rows].reverse().map((r) => (
              <TableRow key={r.label}>
                <TableCell className="font-medium">{r.label}</TableCell>
                <TableCell align="right" className="tabular">{formatRM(r.sales)}</TableCell>
                <TableCell align="right" className="tabular">{formatRM(r.cost)}</TableCell>
                <TableCell align="right" className="tabular">{formatRM(r.sales - r.cost)}</TableCell>
                <TableCell align="right" className="tabular">{pct(r.sales, r.cost)}</TableCell>
                <TableCell align="right" className="tabular">{r.transactions.toLocaleString("en-MY")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
