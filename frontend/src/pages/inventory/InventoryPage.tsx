import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns3, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getInventory, setUnitStatus, transferUnits, type InventoryUnit, type UnitStatus } from "@/api/inventory";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { DataTablePagination, DataTableToolbar, FilterSetSelect } from "@/components/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/lib/branch-context";
import { BRANCHES, branchName } from "@/lib/branches";
import { QK } from "@/lib/query-keys";
import { InventoryTable } from "@/sections/inventory/InventoryTable";
import { UnitDrawer } from "@/sections/inventory/UnitDrawer";
import {
  CATEGORIES,
  CONDITIONS,
  DEFAULT_COLUMNS,
  EMPTY_FILTERS,
  OPTIONAL_COLUMNS,
  STATUSES,
  applyFilters,
  applySort,
  type Filters,
  type Sort,
  type SortKey,
} from "@/sections/inventory/inventory-view";

const COLUMNS_KEY = "dh-inventory-columns";

function readColumns() {
  try {
    const raw = window.localStorage.getItem(COLUMNS_KEY);
    return raw ? { ...DEFAULT_COLUMNS, ...JSON.parse(raw) } : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export default function InventoryPage() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: units = [], isLoading } = useQuery({
    queryKey: QK.inventory(branch),
    queryFn: () => getInventory(branch),
  });

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<Sort>({ key: "received", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [columns, setColumns] = useState(readColumns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  // A new branch, filter or sort starts again from page 1 with nothing ticked.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [branch, filters, sort]);

  const filtered = useMemo(() => applySort(applyFilters(units, filters), sort), [units, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const openUnit = units.find((u) => u.id === openId) ?? null;

  const available = units.filter((u) => u.status === "Available").length;
  const stockValue = units.filter((u) => u.status !== "Sold").reduce((a, u) => a + u.cost, 0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["inventory"] });
  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: UnitStatus }) => setUnitStatus(ids, status),
    onSuccess: (n, { status }) => {
      void refresh();
      setSelected(new Set());
      show(n ? `${n} ${n === 1 ? "unit" : "units"} marked ${status}.` : "Nothing changed. Sold units can't be changed.");
    },
  });
  const transferMutation = useMutation({
    mutationFn: ({ ids, to }: { ids: string[]; to: InventoryUnit["branch"] }) => transferUnits(ids, to),
    onSuccess: (n, { to }) => {
      void refresh();
      setSelected(new Set());
      show(n ? `${n} ${n === 1 ? "unit is" : "units are"} on the way to ${branchName(to)}.` : "Nothing to move: those units are already there or sold.");
    },
  });

  const setFilter = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "item" ? "asc" : "desc" }));
  const setColumn = (key: keyof typeof DEFAULT_COLUMNS, on: boolean) =>
    setColumns((c: typeof DEFAULT_COLUMNS) => {
      const next = { ...c, [key]: on };
      try {
        window.localStorage.setItem(COLUMNS_KEY, JSON.stringify(next));
      } catch {
        /* keep for this visit only */
      }
      return next;
    });
  const ids = [...selected];
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button variant="outline" onClick={() => show("Exported inventory.xlsx with the current filters.")}>
              Export
            </Button>
            <Link to="/inventory/receive" className={buttonVariants()}>
              Receive stock
            </Link>
          </>
        }
      />

      <p className="text-[13px] text-muted-foreground">
        {units.length} units at {branch ? branchName(branch) : "all branches"}, {available} available. Stock value at
        cost RM {stockValue.toLocaleString("en-MY")}.
      </p>

      <section className="rounded-lg border bg-card">
        <DataTableToolbar
          search={{
            value: filters.q,
            onChange: (q) => setFilter({ q }),
            placeholder: "Search model, colour, supplier, IMEI or serial",
            label: undefined,
          }}
        >
          <FilterSetSelect
            label="Status"
            value={filters.status}
            onChange={(status) => setFilter({ status })}
            options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
            className="w-40"
          />
          <FilterSetSelect
            label="Condition"
            value={filters.condition}
            onChange={(condition) => setFilter({ condition })}
            options={[{ value: "", label: "All conditions" }, ...CONDITIONS.map((c) => ({ value: c, label: c }))]}
            className="w-40"
          />
          <FilterSetSelect
            label="Category"
            value={filters.category}
            onChange={(category) => setFilter({ category })}
            options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            className="w-36"
          />
          {!branch && (
            <FilterSetSelect
              label="Branch"
              value={filters.branch}
              onChange={(b) => setFilter({ branch: b })}
              options={[{ value: "", label: "All branches" }, ...BRANCHES.map((b) => ({ value: b.id, label: b.name }))]}
              className="w-44"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Columns3 /> Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                {OPTIONAL_COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={columns[c.key]}
                    onCheckedChange={(on) => setColumn(c.key, Boolean(on))}
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </DataTableToolbar>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 px-4 py-2.5 text-sm">
            <span className="mr-2 font-medium">{selected.size} selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>Transfer</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  {BRANCHES.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => transferMutation.mutate({ ids, to: b.id as InventoryUnit["branch"] })}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>Mark status</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {STATUSES.filter((s) => s !== "Sold").map((s) => (
                  <DropdownMenuItem key={s} onClick={() => statusMutation.mutate({ ids, status: s })}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={() => show(`${selected.size} labels sent to the label printer.`)}>
              Print labels
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
              <X /> Clear
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading stock">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="m-4 border-0"
            title={hasFilters ? "No units match these filters" : "No stock at this branch yet"}
            description={hasFilters ? "Clear a filter or search for something else." : "Receive stock to add units here."}
            action={
              hasFilters ? (
                <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <InventoryTable
            rows={pageRows}
            columns={columns}
            sort={sort}
            onSort={toggleSort}
            selected={selected}
            onToggle={(id) =>
              setSelected((s) => {
                const next = new Set(s);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onToggleAll={(pageIds, select) =>
              setSelected((s) => {
                const next = new Set(s);
                pageIds.forEach((id) => (select ? next.add(id) : next.delete(id)));
                return next;
              })
            }
            onOpen={(u) => setOpenId(u.id)}
          />
        )}

        {filtered.length > 0 && (
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            pageCount={pageCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </section>

      <UnitDrawer
        unit={openUnit}
        onClose={() => setOpenId(null)}
        onSetStatus={(u, status) => statusMutation.mutate({ ids: [u.id], status })}
      />
    </>
  );
}
