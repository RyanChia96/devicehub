import { useState, type ReactNode } from "react";
import type { CurrentUser } from "@/api/auth";
import { AppSidebarNav } from "@/components/AppSidebarNav";
import { GlobalSearch, UserMenu } from "@/components/AppShell/index";
import { PosDialog } from "@/sections/pos/PosDialog";
import { PosProvider } from "@/sections/pos/pos-context";

const COLLAPSE_KEY = "dh-sidebar-collapsed";

interface AppShellProps {
  user: CurrentUser;
  children: ReactNode;
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Sidebar, the 64px top bar (search left, profile right), the page, and the POS popup. */
export function AppShell({ user, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () =>
    setCollapsed((current) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, current ? "0" : "1");
      } catch {
        /* storage blocked: keep it for this visit only */
      }
      return !current;
    });

  return (
    <PosProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <AppSidebarNav viewer={{ role: user.role }} collapsed={collapsed} onToggle={toggle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
            <GlobalSearch />
            <UserMenu user={user} />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-6 pt-7 pb-24">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-6">{children}</div>
          </main>
        </div>
      </div>
      <PosDialog />
    </PosProvider>
  );
}
