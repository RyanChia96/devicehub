import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <table
        ref={ref}
        className={cn("min-w-full text-sm", className)}
        {...props}
    />
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn(className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableHead = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b border-border bg-background",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableHeadCell = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "center" | "right" }
>(({ className, align = "left", ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "px-4 py-3 text-xs font-medium text-muted-foreground",
            align === "left" && "text-left",
            align === "center" && "text-center",
            align === "right" && "text-right",
            className
        )}
        {...props}
    />
));
TableHeadCell.displayName = "TableHeadCell";

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn(className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b border-border transition-colors duration-[var(--transition-fast)] hover:bg-background/50",
            className
        )}
        {...props}
    />
));
TableRow.displayName = "TableRow";

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "center" | "right" }
>(({ className, align = "left", ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            "px-4 py-3 text-foreground",
            align === "center" && "text-center",
            align === "right" && "text-right",
            className
        )}
        {...props}
    />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableHead, TableHeadCell, TableBody, TableRow, TableCell };
