export const ROLES = ["Owner", "Branch Manager", "Cashier", "Stock Clerk", "Technician"] as const;
export type Role = (typeof ROLES)[number];
