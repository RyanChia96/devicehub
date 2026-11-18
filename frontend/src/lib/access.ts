import type { Role } from "./roles";

/**
 * The access requirement for a single page.
 *
 * This is the only place access is expressed. The route guard and the sidebar
 * both evaluate the same rule via `canAccess`, so a page can never be reachable
 * by URL while its nav link is hidden (or the other way round).
 */
export interface AccessRule {
  /** Any-of: the viewer needs one of these roles. Omit for every signed-in user. */
  roles?: Role[];
}

export interface Viewer {
  role: Role;
}

export function canAccess(rule: AccessRule, viewer: Viewer): boolean {
  return !rule.roles || rule.roles.includes(viewer.role);
}
