import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getSellerProfile, saveSellerProfile, type SellerProfile } from "@/api/einvoices";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QK } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Enter the registered company name."),
  tin: z.string().trim().regex(/^C\d{10,11}$/, "Company TIN is C followed by 10 or 11 digits."),
  brn: z.string().trim().regex(/^\d{12}$/, "BRN is 12 digits."),
  sst: z.string().trim(),
  msic: z.string().trim().regex(/^\d{5}$/, "MSIC code is 5 digits."),
  activity: z.string().trim().min(1, "Describe the business activity."),
  address: z.string().trim().min(1, "Enter the business address."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(1, "Enter a phone number."),
});

const FIELDS: { key: keyof SellerProfile; label: string; mono?: boolean; wide?: boolean; hint?: string }[] = [
  { key: "name", label: "Registered name", wide: true },
  { key: "tin", label: "TIN", mono: true },
  { key: "brn", label: "BRN", mono: true },
  { key: "sst", label: "SST registration no.", mono: true, hint: "Leave empty if not registered." },
  { key: "msic", label: "MSIC code", mono: true },
  { key: "activity", label: "Business activity", wide: true },
  { key: "address", label: "Address", wide: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

/** The seller details sent with every e-invoice. */
export default function SellerProfilePage() {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: QK.seller(), queryFn: getSellerProfile });
  const form = useForm<SellerProfile>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);
  const save = useMutation({
    mutationFn: saveSellerProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK.seller() });
      show("Seller profile saved. New e-invoices use these details.");
    },
  });
  const errors = form.formState.errors;

  return (
    <>
      <PageHeader />
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="flex max-w-[760px] flex-col gap-6 rounded-lg border bg-card p-6"
      >
        <p className="text-[13px] text-muted-foreground">Sent to LHDN with every e-invoice. Changes apply to new e-invoices only.</p>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={cn("flex flex-col gap-2", f.wide && "sm:col-span-2")}>
              <Label htmlFor={`sp-${f.key}`}>{f.label}</Label>
              <Input id={`sp-${f.key}`} className={f.mono ? "font-mono" : undefined} aria-invalid={Boolean(errors[f.key])} {...form.register(f.key)} />
              {errors[f.key] ? (
                <p className="text-xs text-destructive">{errors[f.key]?.message}</p>
              ) : (
                f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={!form.formState.isDirty || save.isPending}>
            Save profile
          </Button>
          <Button type="button" variant="outline" disabled={!form.formState.isDirty} onClick={() => data && form.reset(data)}>
            Discard changes
          </Button>
        </div>
      </form>
    </>
  );
}
