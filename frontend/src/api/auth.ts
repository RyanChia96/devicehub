import type { Role } from "@/lib/roles";

export interface CurrentUser {
  id: string;
  name: string;
  initials: string;
  role: Role;
}

/**
 * TODO(backend): replace with `apiClient.get<CurrentUser>("/auth/me/")`.
 * Everyone is the Owner until sign-in exists.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return { id: "us1", name: "Ong Kah Hoe", initials: "OK", role: "Owner" };
}

/** TODO(backend): POST /auth/login/ */
export async function login(_email: string, _password: string): Promise<void> {}

/** TODO(backend): POST /auth/logout/ */
export async function logout(): Promise<void> {}
