import { Check, ChevronDown } from "lucide-react";
import type { CurrentUser } from "@/api/auth";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBranch } from "@/lib/branch-context";
import { BRANCHES, branchName, type BranchId } from "@/lib/branches";
import { cn } from "@/lib/utils";

const OPTIONS: { id: BranchId; name: string; region: string }[] = [
  { id: "", name: "All branches", region: "3 branches" },
  ...BRANCHES.map((b) => ({ id: b.id as BranchId, name: b.name, region: b.region })),
];

/** Avatar, name and the branch switcher. The branch applies to every screen. */
export function UserMenu({ user }: { user: CurrentUser }) {
  const { branch, setBranch } = useBranch();

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-secondary text-[13px] font-semibold">
        {user.initials}
      </span>
      <div className="flex flex-col items-start">
        <span className="text-sm/[18px] font-medium">{user.name}</span>
        <Popover>
          <PopoverTrigger
            className="-ml-1.5 flex items-center gap-1 rounded-full px-1.5 py-px text-xs/4 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
            aria-label={`Branch: ${branchName(branch)}. Switch branch`}
          >
            {user.role} · {branchName(branch)}
            <ChevronDown className="size-3.5" aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[300px] gap-1 rounded-lg p-2">
            <PopoverHeader className="px-2 pt-1.5 pb-2">
              <PopoverTitle>Switch branch</PopoverTitle>
              <PopoverDescription className="text-xs">Applies to every screen.</PopoverDescription>
            </PopoverHeader>
            {OPTIONS.map((option) => {
              const on = option.id === branch;
              return (
                <button
                  key={option.id || "all"}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    on && "font-medium",
                  )}
                  onClick={() => setBranch(option.id)}
                >
                  <span className="min-w-0 flex-1">
                    {option.name}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {option.region}
                    </span>
                  </span>
                  <Check className={cn("size-4", !on && "invisible")} aria-hidden />
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
