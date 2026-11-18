import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ModelRow } from "./stock-summary";

interface ThresholdsDialogProps {
  open: boolean;
  rows: ModelRow[];
  onClose: () => void;
  onSave: (next: Record<string, number>) => void;
}

/** One reorder level per model, applied to every branch at once. */
export function ThresholdsDialog({ open, rows, onClose, onSave }: ThresholdsDialogProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setDraft(Object.fromEntries(rows.map((r) => [r.key, String(r.threshold)])));
  }, [open, rows]);

  const invalid = Object.values(draft).some((v) => !/^\d{1,3}$/.test(v));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Reorder levels</DialogTitle>
          <DialogDescription>
            A model shows as low stock at a branch when its available units drop below this number. It applies to every
            branch.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 max-h-[50dvh] overflow-auto px-6">
          <ul className="flex flex-col divide-y">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-4 py-2.5">
                <label htmlFor={`th-${r.key}`} className="min-w-0 flex-1 text-sm">
                  {r.name}
                  <span className="block text-xs text-muted-foreground">{r.category}</span>
                </label>
                <Input
                  id={`th-${r.key}`}
                  inputMode="numeric"
                  className="tabular w-20 text-right"
                  value={draft[r.key] ?? ""}
                  aria-invalid={!/^\d{1,3}$/.test(draft[r.key] ?? "")}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value.trim() }))}
                />
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={invalid}
            onClick={() => onSave(Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, Number(v)])))}
          >
            Save reorder levels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
