import type { ReactNode } from "react";
import { canAccess, type AccessRule } from "@/lib/access";
import { useViewer } from "@/lib/use-viewer";
import { RouteFallback } from "../RouteFallback";
import { NoAccessPage } from "./NoAccessPage";

/**
 * The only route guard. It evaluates the same `AccessRule` the sidebar uses, so
 * a hidden nav link and a blocked URL always agree.
 */
export function RequireAccess({ rule, children }: { rule: AccessRule; children: ReactNode }) {
  const { viewer, isLoading } = useViewer();
  if (isLoading) return <RouteFallback />;
  if (!canAccess(rule, viewer)) return <NoAccessPage />;
  return <>{children}</>;
}
