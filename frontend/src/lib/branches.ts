export interface Branch {
  id: string;
  name: string;
  region: string;
}

export const BRANCHES: Branch[] = [
  { id: "KLSW", name: "KL Sungai Wang", region: "Kuala Lumpur" },
  { id: "PJ", name: "Petaling Jaya", region: "Selangor" },
  { id: "JB", name: "Johor Bahru", region: "Johor" },
];

/** "" means all branches. */
export type BranchId = "" | (typeof BRANCHES)[number]["id"];

export function branchName(id: BranchId): string {
  return BRANCHES.find((b) => b.id === id)?.name ?? "All branches";
}
