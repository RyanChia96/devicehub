import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { InventoryUnit } from "@/api/inventory";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  STATUS_VARIANT,
  formatDate,
  marginPct,
  unitCode,
  type OptionalColumn,
  type Sort,
  type SortKey,
} from "./inventory-view";

interface InventoryTableProps {
  rows: InventoryUnit[];
  columns: Record<OptionalColumn, boolean>;
  sort: Sort;
  onSort: (key: SortKey) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], select: boolean) => void;
  onOpen: (unit: InventoryUnit) => void;
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHeadCell
      align={align}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active && "text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
      </button>
    </TableHeadCell>
  );
}

const checkbox = "size-4 cursor-pointer accent-primary";

export function InventoryTable({ rows, columns, sort, onSort, selected, onToggle, onToggleAll, onOpen }: InventoryTableProps) {
  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableHead>
            <TableHeadCell className="w-10 pr-0">
              <input
                type="checkbox"
                className={checkbox}
                aria-label="Select all on this page"
                checked={allOnPage}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPage && !allOnPage;
                }}
                onChange={() => onToggleAll(pageIds, !allOnPage)}
              />
            </TableHeadCell>
            <SortHeader label="Item" sortKey="item" sort={sort} onSort={onSort} />
            {columns.code && <TableHeadCell>IMEI / serial</TableHeadCell>}
            <TableHeadCell>Status</TableHeadCell>
            {columns.branch && <TableHeadCell>Branch</TableHeadCell>}
            {columns.condition && <TableHeadCell>Condition</TableHeadCell>}
            {columns.battery && <SortHeader label="Battery" sortKey="battery" sort={sort} onSort={onSort} align="right" />}
            {columns.received && <SortHeader label="Received" sortKey="received" sort={sort} onSort={onSort} />}
            {columns.supplier && <TableHeadCell>Supplier</TableHeadCell>}
            {columns.cost && <TableHeadCell align="right">Cost</TableHeadCell>}
            <SortHeader label="Price" sortKey="price" sort={sort} onSort={onSort} align="right" />
            {columns.margin && <SortHeader label="Margin" sortKey="margin" sort={sort} onSort={onSort} align="right" />}
          </TableHead>
        </TableHeader>
        <TableBody>
          {rows.map((u) => {
            const isSelected = selected.has(u.id);
            const margin = marginPct(u);
            return (
              <TableRow
                key={u.id}
                className={cn("cursor-pointer hover:bg-muted/60", isSelected && "bg-muted")}
                onClick={() => onOpen(u)}
              >
                <TableCell className="w-10 pr-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className={checkbox}
                    aria-label={`Select ${u.model}`}
                    checked={isSelected}
                    onChange={() => onToggle(u.id)}
                  />
                </TableCell>
                <TableCell>
                  <span className="block font-medium">
                    {u.model} {u.variant}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {u.color}
                    {u.cashBillOnly ? ", cash bill only" : ""}
                  </span>
                </TableCell>
                {columns.code && <TableCell className="font-mono text-[13px]">{unitCode(u)}</TableCell>}
                <TableCell>
                  <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
                </TableCell>
                {columns.branch && <TableCell>{branchName(u.branch)}</TableCell>}
                {columns.condition && <TableCell>{u.condition}</TableCell>}
                {columns.battery && (
                  <TableCell align="right" className={cn("tabular", u.battery !== null && u.battery < 85 && "text-warning")}>
                    {u.battery === null ? "-" : `${u.battery}%`}
                  </TableCell>
                )}
                {columns.received && <TableCell className="tabular text-[13px]">{formatDate(u.received)}</TableCell>}
                {columns.supplier && <TableCell className="text-muted-foreground">{u.supplier}</TableCell>}
                {columns.cost && <TableCell align="right" className="tabular">{formatRM(u.cost)}</TableCell>}
                <TableCell align="right" className="tabular font-medium">{formatRM(u.price)}</TableCell>
                {columns.margin && (
                  <TableCell align="right" className={cn("tabular", margin < 10 && "text-destructive")}>
                    {margin.toFixed(1)}%
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
