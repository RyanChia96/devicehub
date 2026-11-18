import type { ReactNode } from "react";
import { FilterSet, type FilterSetSearch } from "./filter-set";
import { Pagination, type PaginationProps } from "./pagination";

export type DataTableToolbarSearch = FilterSetSearch;

export interface DataTableToolbarProps {
  /** Full-width filter row above a table (search + optional extra controls). */
  search?: DataTableToolbarSearch;
  children?: ReactNode;
  className?: string;
}

export function DataTableToolbar({ search, children, className = "" }: DataTableToolbarProps) {
  return (
    <FilterSet search={search} className={className}>
      {children}
    </FilterSet>
  );
}

export type DataTablePaginationProps = PaginationProps;

export function DataTablePagination(props: DataTablePaginationProps) {
  return <Pagination {...props} />;
}
