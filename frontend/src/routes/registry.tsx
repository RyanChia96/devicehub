import { lazy, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileText,
  Home,
  Layers,
  Package,
  Percent,
  ScanLine,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import type { AccessRule } from "@/lib/access";

const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const InventoryPage = lazy(() => import("@/pages/inventory/InventoryPage"));
const StockSummaryPage = lazy(() => import("@/pages/inventory/StockSummaryPage"));
const ReceiveStockPage = lazy(() => import("@/pages/inventory/ReceiveStockPage"));
const RefurbishmentPage = lazy(() => import("@/pages/inventory/RefurbishmentPage"));
const SalesReportsPage = lazy(() => import("@/pages/sales/SalesReportsPage"));
const CommissionPage = lazy(() => import("@/pages/sales/CommissionPage"));
const InvoicesPage = lazy(() => import("@/pages/einvoices/InvoicesPage"));
const ConsolidatedPage = lazy(() => import("@/pages/einvoices/ConsolidatedPage"));
const SelfBilledPage = lazy(() => import("@/pages/einvoices/SelfBilledPage"));
const SellerProfilePage = lazy(() => import("@/pages/einvoices/SellerProfilePage"));
const UserManagement = lazy(() => import("@/pages/users/UserManagement"));

/** Sidebar sections, rendered in this order. `main` has no heading. */
export const NAV_SECTIONS = ["main", "stock", "sales", "einvoice", "settings"] as const;
export type NavSectionId = (typeof NAV_SECTIONS)[number];

export interface NavMeta {
  section: NavSectionId;
  /** Sort position within the section. */
  order: number;
  labelKey: string;
  icon: LucideIcon;
  /** Match the path exactly rather than by prefix. */
  end?: boolean;
}

export interface PageDef {
  /** Absolute path, including any `:params`. */
  path: string;
  element: ReactNode;
  /**
   * Required. Every page is guarded. Use `{}` only for a page that is
   * deliberately open to any signed-in user.
   */
  access: AccessRule;
  titleKey: string;
  /** Present => the page gets a sidebar link, gated by the same `access` rule. */
  nav?: NavMeta;
}

export interface ModuleDef {
  id: string;
  pages: PageDef[];
}

const MANAGERS: AccessRule = { roles: ["Owner", "Branch Manager"] };
const SELLERS: AccessRule = { roles: ["Owner", "Branch Manager", "Cashier"] };
const STOCK: AccessRule = { roles: ["Owner", "Branch Manager", "Cashier", "Stock Clerk"] };

export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    pages: [
      {
        path: "/dashboard",
        element: <Dashboard />,
        access: {},
        titleKey: "routes.dashboard",
        nav: { section: "main", order: 1, labelKey: "nav.dashboard", icon: Home, end: true },
      },
    ],
  },
  {
    id: "stock",
    pages: [
      {
        path: "/inventory",
        element: <InventoryPage />,
        access: STOCK,
        titleKey: "routes.inventory",
        nav: { section: "stock", order: 1, labelKey: "nav.inventory", icon: Package, end: true },
      },
      {
        path: "/inventory/summary",
        element: <StockSummaryPage />,
        access: STOCK,
        titleKey: "routes.stockSummary",
        nav: { section: "stock", order: 2, labelKey: "nav.stockSummary", icon: Boxes },
      },
      {
        path: "/inventory/receive",
        element: <ReceiveStockPage />,
        access: { roles: ["Owner", "Branch Manager", "Stock Clerk"] },
        titleKey: "routes.receiveStock",
        nav: { section: "stock", order: 3, labelKey: "nav.receiveStock", icon: ScanLine },
      },
      {
        path: "/inventory/refurbishment",
        element: <RefurbishmentPage />,
        access: { roles: ["Owner", "Branch Manager", "Technician"] },
        titleKey: "routes.refurbishment",
        nav: { section: "stock", order: 4, labelKey: "nav.refurbishment", icon: Wrench },
      },
    ],
  },
  {
    id: "sales",
    pages: [
      {
        path: "/sales/reports",
        element: <SalesReportsPage />,
        access: MANAGERS,
        titleKey: "routes.salesReports",
        nav: { section: "sales", order: 1, labelKey: "nav.salesReports", icon: BarChart3 },
      },
      {
        path: "/sales/commission",
        element: <CommissionPage />,
        access: SELLERS,
        titleKey: "routes.commission",
        nav: { section: "sales", order: 2, labelKey: "nav.commission", icon: Percent },
      },
    ],
  },
  {
    id: "einvoice",
    pages: [
      {
        path: "/einvoices",
        element: <InvoicesPage />,
        access: SELLERS,
        titleKey: "routes.invoices",
        nav: { section: "einvoice", order: 1, labelKey: "nav.invoices", icon: FileText, end: true },
      },
      {
        path: "/einvoices/consolidated",
        element: <ConsolidatedPage />,
        access: MANAGERS,
        titleKey: "routes.consolidated",
        nav: { section: "einvoice", order: 2, labelKey: "nav.consolidated", icon: Layers },
      },
      {
        path: "/einvoices/self-billed",
        element: <SelfBilledPage />,
        access: MANAGERS,
        titleKey: "routes.selfBilled",
        nav: { section: "einvoice", order: 3, labelKey: "nav.selfBilled", icon: ArrowLeftRight },
      },
      {
        path: "/einvoices/seller-profile",
        element: <SellerProfilePage />,
        access: MANAGERS,
        titleKey: "routes.sellerProfile",
        nav: { section: "einvoice", order: 4, labelKey: "nav.sellerProfile", icon: Store },
      },
    ],
  },
  {
    id: "settings",
    pages: [
      {
        path: "/users",
        element: <UserManagement />,
        access: MANAGERS,
        titleKey: "routes.users",
        nav: { section: "settings", order: 1, labelKey: "nav.users", icon: Users },
      },
    ],
  },
];

export const ALL_PAGES: PageDef[] = MODULES.flatMap((m) => m.pages);
