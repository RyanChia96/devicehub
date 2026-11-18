import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedLayout } from "./guards/ProtectedLayout";
import { RequireAccess } from "./guards/RequireAccess";
import { ALL_PAGES } from "./registry";

/**
 * Built from the registry, so every page is guarded by construction: there is
 * no way to add a route here without giving it an access rule.
 */
const pageRoutes: RouteObject[] = ALL_PAGES.map((page) => ({
  path: page.path.replace(/^\//, ""),
  element: <RequireAccess rule={page.access}>{page.element}</RequireAccess>,
}));

export const protectedRoutes: RouteObject = {
  path: "/",
  element: <ProtectedLayout />,
  children: [
    { index: true, element: <Navigate to="/dashboard" replace /> },
    ...pageRoutes,
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ],
};
