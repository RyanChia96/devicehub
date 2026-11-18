import { useEffect, useState } from "react";
import type { StaffUser, UserInput } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BRANCHES } from "@/lib/branches";
import { ROLES, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROLE_HINT: Record<Role, string> = {
  Owner: "Everything, at every branch.",
  "Branch Manager": "Runs their branches: stock, approvals, reports.",
  Cashier: "Sells at the POS and looks up stock.",
  "Stock Clerk": "Receives, transfers and labels stock.",
  Technician: "Works the refurbishment queue only.",
};

const EMPTY: UserInput = { name: "", email: "", phone: "", role: "Cashier", branches: ["KLSW"] };

interface UserSheetProps {
  /** null = closed, "new" = invite, otherwise the user being edited. */
  target: StaffUser | "new" | null;
  onClose: () => void;
  onSave: (input: UserInput) => void;
  saving: boolean;
}

/** Invite or edit a user: one role and the branches they work at. */
export function UserSheet({ target, onClose, onSave, saving }: UserSheetProps) {
  const [form, setForm] = useState<UserInput>(EMPTY);
  const [tried, setTried] = useState(false);
  const isNew = target === "new";

  useEffect(() => {
    setTried(false);
    if (target === "new") setForm(EMPTY);
    else if (target) setForm({ name: target.name, email: target.email, phone: target.phone, role: target.role, branches: [...target.branches] });
  }, [target]);

  const errors = {
    name: form.name.trim() ? "" : "Enter their name.",
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) ? "" : "Enter a valid work email.",
    branches: form.role === "Owner" || form.branches.length ? "" : "Pick at least one branch.",
  };
  const ok = !errors.name && !errors.email && !errors.branches;
  const toggleBranch = (id: (typeof BRANCHES)[number]["id"]) =>
    setForm((f) => ({
      ...f,
      branches: f.branches.includes(id as never) ? f.branches.filter((b) => b !== id) : [...f.branches, id as never],
    }));

  return (
    <Sheet open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b px-6 pt-6 pb-5">
          <SheetTitle className="text-lg font-semibold">{isNew ? "Invite user" : "Edit user"}</SheetTitle>
          <SheetDescription>{isNew ? "They get an email link to set up their sign-in." : "Changes apply the next time they sign in."}</SheetDescription>
        </SheetHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (ok) onSave({ ...form, branches: form.role === "Owner" ? ["KLSW", "PJ", "JB"] : form.branches });
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
            <Text label="Name" value={form.name} error={tried ? errors.name : ""} onChange={(name) => setForm((f) => ({ ...f, name }))} />
            <Text label="Work email" type="email" value={form.email} error={tried ? errors.email : ""} onChange={(email) => setForm((f) => ({ ...f, email }))} />
            <Text label="Phone" value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Role</legend>
              {ROLES.map((r) => (
                <label key={r} className={cn("flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5", form.role === r && "border-foreground")}>
                  <input type="radio" name="role" className="mt-0.5 accent-primary" checked={form.role === r} onChange={() => setForm((f) => ({ ...f, role: r }))} />
                  <span>
                    <span className="block text-sm font-medium">{r}</span>
                    <span className="block text-xs text-muted-foreground">{ROLE_HINT[r]}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {form.role !== "Owner" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">Branches</legend>
                {BRANCHES.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={form.branches.includes(b.id as never)} onChange={() => toggleBranch(b.id)} />
                    {b.name}
                  </label>
                ))}
                {tried && errors.branches && <p className="text-xs text-destructive">{errors.branches}</p>}
              </fieldset>
            )}
          </div>
          <div className="flex gap-2 border-t px-6 py-4">
            <Button type="submit" disabled={saving}>
              {isNew ? "Send invite" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Text({ label, value, onChange, error, type = "text" }: { label: string; value: string; onChange: (v: string) => void; error?: string; type?: string }) {
  return (
    <Label className="flex flex-col items-stretch gap-2">
      {label}
      <Input type={type} value={value} aria-invalid={Boolean(error)} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="text-xs font-normal text-destructive">{error}</span>}
    </Label>
  );
}
