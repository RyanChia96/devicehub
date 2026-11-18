import { matchRoutes } from "react-router-dom";
import { ALL_PAGES, type PageDef } from "./registry";

const TITLE_ROUTES = ALL_PAGES.map((page) => ({ path: page.path }));

/** The registered page for a pathname, resolved by the same matcher the router uses. */
export function getPage(pathname: string): PageDef | undefined {
  const matches = matchRoutes(TITLE_ROUTES, pathname);
  const matchedPath = matches?.[matches.length - 1]?.route.path;
  return ALL_PAGES.find((page) => page.path === matchedPath);
}
