import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { OptionsSelect } from "@/components/OptionsSelect";

export interface PaginationProps {
    page: number;
    pageSize: number;
    totalItems: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

/**
 * Pagination controls for data tables.
 * Modeled after PositionList DataTablePagination usage.
 */
export function Pagination({
    page,
    pageSize,
    totalItems,
    pageCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    className = "",
}: PaginationProps) {
    const { t } = useTranslation();
    const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);

    return (
        <div
            className={cn(
                "flex flex-col gap-3 border-t border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
                className
            )}
        >
            <span>
                {totalItems === 0
                    ? t("table.noRows")
                    : t("table.showing", {
                          from: from.toLocaleString(),
                          to: to.toLocaleString(),
                          total: totalItems.toLocaleString(),
                      })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t("table.rowsPerPage")}</span>
                    <OptionsSelect
                        size="sm"
                        value={String(pageSize)}
                        onValueChange={(next) => onPageSizeChange(Number(next))}
                        options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
                        aria-label={t("table.rowsPerPage")}
                    />
                </label>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40"
                    >
                        {t("common.previous")}
                    </button>
                    <span className="px-2 text-xs tabular-nums text-muted-foreground">
                        {t("table.pageOf", { page, pageCount })}
                    </span>
                    <button
                        type="button"
                        disabled={page >= pageCount}
                        onClick={() => onPageChange(page + 1)}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40"
                    >
                        {t("common.next")}
                    </button>
                </div>
            </div>
        </div>
    );
}
