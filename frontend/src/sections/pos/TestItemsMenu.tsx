import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TEST_ITEMS } from "@/lib/demo-data";
import { usePos } from "./pos-context";

/**
 * Prototype only (VITE_DEMO_TOOLS=true): adds a sample item as if it was scanned.
 * Remove once real stock and a scanner are available.
 */
export function TestItemsMenu() {
  const { addCode, dispatch, state } = usePos();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-input px-3.5 text-[13px] font-medium text-muted-foreground hover:border-muted-foreground hover:text-foreground aria-expanded:text-foreground">
        Test items
        <ChevronDown className="size-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="max-h-[460px] w-[380px] gap-0 overflow-auto rounded-lg p-1.5">
        <p className="px-2.5 pt-2 pb-2.5 text-xs text-muted-foreground">
          Prototype only: adds a sample item as if it was scanned.
        </p>
        {TEST_ITEMS.map((t) => (
          <button
            key={t.code}
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => {
              setOpen(false);
              if (state.step === "pay") dispatch({ type: "step", step: "cart" });
              void addCode(t.code);
            }}
          >
            <span className="min-w-0 flex-1 font-medium">
              {t.label}
              <span className="block text-xs font-normal text-muted-foreground">{t.note}</span>
            </span>
            <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
