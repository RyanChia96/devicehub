import { DEMO_USERS, type StaffUser } from "@/lib/demo-users";

export type { StaffUser } from "@/lib/demo-users";

let users: StaffUser[] = DEMO_USERS.map((u) => ({ ...u, branches: [...u.branches] }));

/** TODO(backend): GET /users/ */
export async function getUsers(): Promise<StaffUser[]> {
  return users.map((u) => ({ ...u, branches: [...u.branches] }));
}

export type UserInput = Pick<StaffUser, "name" | "email" | "phone" | "role" | "branches">;

/** TODO(backend): POST /users/invite/ (sends an email sign-in link). */
export async function inviteUser(input: UserInput): Promise<StaffUser> {
  const user: StaffUser = { ...input, id: `us${Date.now()}`, status: "Invited", lastSeen: "Invite sent 18/11/2026" };
  users = [user, ...users];
  return user;
}

/** TODO(backend): PATCH /users/:id/ */
export async function updateUser(id: string, input: UserInput): Promise<void> {
  users = users.map((u) => (u.id === id ? { ...u, ...input } : u));
}

/** TODO(backend): POST /users/:id/status/ */
export async function setUserStatus(id: string, status: StaffUser["status"]): Promise<void> {
  users = users.map((u) => (u.id === id ? { ...u, status } : u));
}
