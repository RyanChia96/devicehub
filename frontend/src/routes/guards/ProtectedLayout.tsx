import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "@/api/auth";
import { AppShell } from "@/components/AppShell";
import { QK } from "@/lib/query-keys";
import { RouteFallback } from "../RouteFallback";

export function ProtectedLayout() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: QK.currentUser(),
    queryFn: getCurrentUser,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">Loading…</div>
    );
  }
  if (isError || !user) return <Navigate to="/login" replace />;

  return (
    <AppShell user={user}>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
