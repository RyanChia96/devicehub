import { ChevronsLeft, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "@/api/auth";
import { AppLogo } from "@/components/AppLogo";
import { canAccess, type Viewer } from "@/lib/access";
import { cn } from "@/lib/utils";
import { ALL_PAGES, NAV_SECTIONS, type NavMeta, type PageDef } from "@/routes/registry";

interface AppSidebarNavProps {
  viewer: Viewer;
  collapsed: boolean;
  onToggle: () => void;
}

type NavPage = PageDef & { nav: NavMeta };

const itemClass = (collapsed: boolean) =>
  cn(
    "flex h-8 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    collapsed && "justify-center px-0",
  );

/** One sidebar for every screen, built from the route registry and filtered by role. */
export function AppSidebarNav({ viewer, collapsed, onToggle }: AppSidebarNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pages = ALL_PAGES.filter(
    (p): p is NavPage => Boolean(p.nav) && canAccess(p.access, viewer),
  );

  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex h-dvh shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3 transition-[width] duration-150",
        collapsed ? "w-16 px-2" : "w-58",
      )}
    >
      <div className={cn("px-2 pt-1 pb-4", collapsed && "flex justify-center px-0")}>
        <AppLogo showName={!collapsed} />
      </div>

      {NAV_SECTIONS.map((section) => {
        const items = pages
          .filter((p) => p.nav.section === section)
          .sort((a, b) => a.nav.order - b.nav.order);
        if (!items.length) return null;
        return (
          <div key={section} className="flex flex-col gap-0.5">
            {section !== "main" && !collapsed && (
              <div className="px-3 pt-4 pb-1 text-xs text-sidebar-muted">
                {t(`nav.sections.${section}`)}
              </div>
            )}
            {items.map(({ path, nav }) => {
              const Icon = nav.icon;
              const label = t(nav.labelKey);
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={nav.end}
                  aria-label={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      itemClass(collapsed),
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )
                  }
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              );
            })}
          </div>
        );
      })}

      <div className="mt-auto flex flex-col gap-0.5 pt-4">
        <button
          type="button"
          className={itemClass(collapsed)}
          aria-label={collapsed ? t("nav.signOut") : undefined}
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          {!collapsed && <span>{t("nav.signOut")}</span>}
        </button>
        <button
          type="button"
          className={itemClass(collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("nav.expand") : undefined}
          onClick={onToggle}
        >
          <ChevronsLeft
            className={cn("size-[18px] shrink-0 transition-transform", collapsed && "rotate-180")}
            strokeWidth={1.75}
            aria-hidden
          />
          {!collapsed && <span>{t("nav.collapse")}</span>}
        </button>
      </div>
    </nav>
  );
}
