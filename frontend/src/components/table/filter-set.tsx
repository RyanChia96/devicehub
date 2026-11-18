import { useId, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterSetSearch {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export interface FilterSetProps {
    /** Search input configuration. */
    search?: FilterSetSearch;
    /** Additional filter controls (e.g. selects, date pickers) rendered to the right. */
    children?: ReactNode;
    className?: string;
}

/**
 * Filter bar for data tables: search input + optional filter controls.
 */
export function FilterSet({ search, children, className = "" }: FilterSetProps) {
    const searchId = useId();
    const hasSearch = search !== undefined;
    if (!hasSearch && !children) return null;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center",
                className,
            )}
        >
            {hasSearch && (
                <Field className="min-w-0 flex-1 sm:max-w-md">
                    {search.label ? <FieldLabel htmlFor={searchId}>{search.label}</FieldLabel> : null}
                    <InputGroup>
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                        <InputGroupInput
                            id={searchId}
                            type="search"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            placeholder={search.placeholder ?? "Search..."}
                            aria-label={search.label ?? "Search table"}
                        />
                    </InputGroup>
                </Field>
            )}
            {children ? (
                <div className="flex flex-wrap items-center gap-3 sm:ml-auto">{children}</div>
            ) : null}
        </div>
    );
}

export interface FilterSetSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    className?: string;
}

/**
 * Reusable select filter for use inside FilterSet children, composed like
 * shadcn's Select example: the first option (the "All" reset) is the null item,
 * so while nothing is filtered the trigger shows the filter name as its
 * placeholder, and the list is grouped under that same name.
 */
export function FilterSetSelect({
    label,
    value,
    onChange,
    options,
    className = "",
}: FilterSetSelectProps) {
    const [reset, ...choices] = options;
    const items = choices.map((option) => ({ label: option.label, value: option.value }));

    return (
        <Select
            items={items}
            value={reset && value === reset.value ? null : value}
            onValueChange={(next) => onChange(next === null ? (reset?.value ?? "") : String(next))}
        >
            <SelectTrigger aria-label={label} className={cn("w-48", className)}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {reset ? <SelectItem value={null}>{reset.label}</SelectItem> : null}
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
