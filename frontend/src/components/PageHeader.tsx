import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { getPage } from "@/routes/titles";

interface PageHeaderProps {
  /** Defaults to the registered page title. */
  title?: string;
  /** Sits beside the title, e.g. a status badge. */
  aside?: ReactNode;
  /** Right-aligned page actions. */
  actions?: ReactNode;
  /** Hide the breadcrumb (Dashboard is the home page, so it has none). */
  hideCrumbs?: boolean;
}

/** Page title with the breadcrumb under it, the same on every screen. */
export function PageHeader({ title, aside, actions, hideCrumbs }: PageHeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const page = getPage(pathname);
  const heading = title ?? (page ? t(page.titleKey) : "");
  const section = page?.nav && page.nav.section !== "main" ? t(`nav.sections.${page.nav.section}`) : null;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl/[38px] font-semibold tracking-tight">{heading}</h1>
          {aside}
        </div>
        {!hideCrumbs && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px]/[18px] text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground hover:underline underline-offset-3">
                  Dashboard
                </Link>
              </li>
              {section && <li className="before:mr-1.5 before:text-input before:content-['/']">{section}</li>}
              <li className="before:mr-1.5 before:text-input before:content-['/']">
                <span aria-current="page" className="font-medium text-foreground">
                  {page ? t(page.nav?.labelKey ?? page.titleKey) : heading}
                </span>
              </li>
            </ol>
          </nav>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
