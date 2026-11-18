import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}

/** Underline tabs used across list pages. */
export function Tabs<T extends string>({ value, onChange, items, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-5 border-b", className)}>
      {items.map((item) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex h-10 items-center gap-1.5 border-b-2 border-transparent px-0.5 text-[13px] font-medium text-muted-foreground hover:text-foreground",
              on && "border-foreground text-foreground",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
