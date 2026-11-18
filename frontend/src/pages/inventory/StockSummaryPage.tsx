import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { getInventory, getThresholds, saveThresholds } from "@/api/inventory";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { StatRow } from "@/components/StatRow";
import { Tabs } from "@/components/Tabs";
import { DataTableToolbar, FilterSetSelect, Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { BRANCHES, branchName, type BranchId } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { ThresholdsDialog } from "@/sections/inventory/ThresholdsDialog";
import { CATEGORIES } from "@/sections/inventory/inventory-view";
import { summarise } from "@/sections/inventory/stock-summary";

type View = "model" | "matrix" | "reorder";

export default function StockSummaryPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("model");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState(false);

  const { data: units = [] } = useQuery({ queryKey: QK.inventory(""), queryFn: () => getInventory("") });
  const { data: thresholds = {} } = useQuery({ queryKey: QK.thresholds(), queryFn: getThresholds });
  const save = useMutation({
    mutationFn: saveThresholds,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK.thresholds() });
      setEditing(false);
      show("Reorder levels saved for every branch.");
    },
  });

  const branchIds = useMemo(() => (branch ? [branch] : BRANCHES.map((b) => b.id)), [branch]);
  const scoped = useMemo(() => units.filter((u) => !branch || u.branch === branch), [units, branch]);
  const all = useMemo(() => summarise(scoped, thresholds, branchIds), [scoped, thresholds, branchIds]);
  const matrix = useMemo(() => summarise(units, thresholds, BRANCHES.map((b) => b.id)), [units, thresholds]);
  const term = q.trim().toLowerCase();
  const match = (r: { name: string; brand: string; category: string }) =>
    (!term || `${r.brand} ${r.name}`.toLowerCase().includes(term)) && (!category || r.category === category);
  const rows = all.filter(match);
  const reorder = rows.filter((r) => r.low);

  const totalAvailable = all.reduce((a, r) => a + r.available, 0);
  const totalValue = all.reduce((a, r) => a + r.value, 0);

  return (
    <>
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <SlidersHorizontal /> Reorder levels
          </Button>
        }
      />

      <StatRow
        stats={[
          { label: "Models in stock", value: String(all.length), sub: branchName(branch) },
          { label: "Units available", value: String(totalAvailable), sub: `${all.reduce((a, r) => a + r.reserved, 0)} reserved` },
          { label: "Below reorder level", value: String(all.filter((r) => r.low).length), sub: branch ? "models at this branch" : "models, all branches combined" },
          { label: "Stock value at cost", value: formatRM(totalValue), sub: "Excludes sold units" },
        ]}
      />

      <Tabs
        label="Stock summary view"
        value={view}
        onChange={setView}
        items={[
          { value: "model", label: "By model" },
          { value: "matrix", label: "Branch × model" },
          { value: "reorder", label: "Reorder list", count: reorder.length },
        ]}
      />

      <section className="rounded-lg border bg-card">
        <DataTableToolbar search={{ value: q, onChange: setQ, placeholder: "Search model or brand" }}>
          <FilterSetSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            className="w-40"
          />
          {view === "reorder" && reorder.length > 0 && (
            <Button variant="outline" onClick={() => show("Exported reorder-list.xlsx.")}>
              Export list
            </Button>
          )}
        </DataTableToolbar>

        {view === "model" && (
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Model</TableHeadCell>
                  <TableHeadCell align="right">Available</TableHeadCell>
                  <TableHeadCell align="right">Reserved</TableHeadCell>
                  <TableHeadCell align="right">In transit</TableHeadCell>
                  <TableHeadCell align="right">Repairing</TableHeadCell>
                  <TableHeadCell align="right">Reorder at</TableHeadCell>
                  <TableHeadCell align="right">Avg cost</TableHeadCell>
                  <TableHeadCell align="right">Value</TableHeadCell>
                </TableHead>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        {r.name}
                        {r.low && <Badge variant="error">Low stock</Badge>}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {r.brand} · {r.category}
                      </span>
                    </TableCell>
                    <TableCell align="right" className={cn("tabular font-medium", r.low && "text-destructive")}>
                      {r.available}
                    </TableCell>
                    <TableCell align="right" className="tabular">{r.reserved}</TableCell>
                    <TableCell align="right" className="tabular">{r.inTransit}</TableCell>
                    <TableCell align="right" className="tabular">{r.repairing}</TableCell>
                    <TableCell align="right" className="tabular text-muted-foreground">
                      {r.threshold}
                    </TableCell>
                    <TableCell align="right" className="tabular">{formatRM(r.avgCost)}</TableCell>
                    <TableCell align="right" className="tabular">{formatRM(r.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {view === "matrix" && (
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Model</TableHeadCell>
                  {BRANCHES.map((b) => (
                    <TableHeadCell key={b.id} align="right" className={cn(branch === b.id && "text-foreground")}>
                      {b.name}
                    </TableHeadCell>
                  ))}
                  <TableHeadCell align="right">Total</TableHeadCell>
                  <TableHeadCell align="right">Reorder at</TableHeadCell>
                </TableHead>
              </TableHeader>
              <TableBody>
                {matrix.filter(match).map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    {BRANCHES.map((b) => {
                      const n = r.byBranch[b.id];
                      const low = n < r.threshold;
                      return (
                        <TableCell
                          key={b.id}
                          align="right"
                          className={cn("tabular", low && "bg-destructive/5 font-medium text-destructive", branch === b.id && !low && "bg-muted/60")}
                          aria-label={`${b.name}: ${n}${low ? ", low stock" : ""}`}
                        >
                          {n}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" className="tabular font-medium">{r.available}</TableCell>
                    <TableCell align="right" className="tabular text-muted-foreground">{r.threshold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {view === "reorder" &&
          (reorder.length === 0 ? (
            <EmptyState className="m-4 border-0" title="Nothing to reorder" description="Every model is at or above its reorder level." />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableHead>
                    <TableHeadCell>Model</TableHeadCell>
                    <TableHeadCell>Short at</TableHeadCell>
                    <TableHeadCell align="right">Available</TableHeadCell>
                    <TableHeadCell align="right">Incoming</TableHeadCell>
                    <TableHeadCell align="right">Suggested order</TableHeadCell>
                    <TableHeadCell>Supplier</TableHeadCell>
                  </TableHead>
                </TableHeader>
                <TableBody>
                  {reorder.map((r) => {
                    return (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.lowAt.length ? r.lowAt.map((b) => branchName(b as BranchId)).join(", ") : "-"}</TableCell>
                        <TableCell align="right" className="tabular text-destructive">{r.available}</TableCell>
                        <TableCell align="right" className="tabular">{r.inTransit}</TableCell>
                        <TableCell align="right" className="tabular font-semibold">{r.shortBy}</TableCell>
                        <TableCell className="text-muted-foreground">{r.supplier}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
      </section>

      <ThresholdsDialog open={editing} rows={matrix} onClose={() => setEditing(false)} onSave={(next) => save.mutate(next)} />
    </>
  );
}
