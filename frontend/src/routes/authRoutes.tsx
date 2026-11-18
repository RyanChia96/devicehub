import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const LoginPage = lazy(() => import("@/pages/accounts/LoginPage"));

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    ),
  },
];
