/**
 * Canonical React Query key factory.
 * All queryKey and invalidateQueries calls MUST use these constants.
 */
export const QK = {
  currentUser: () => ["current-user"] as const,
  dashboard: (branch: string) => ["dashboard", branch] as const,
  inventory: (branch: string) => ["inventory", branch] as const,
  thresholds: () => ["inventory", "thresholds"] as const,
  refurb: (branch: string) => ["inventory", "refurb", branch] as const,
  sales: (branch: string) => ["sales", branch] as const,
  monthly: (branch: string) => ["sales", "monthly", branch] as const,
  yearly: (branch: string) => ["sales", "yearly", branch] as const,
  commissionRates: (month: string) => ["commission", "rates", month] as const,
  commissionStatuses: (month: string) => ["commission", "statuses", month] as const,
  einvoices: (branch: string) => ["einvoices", branch] as const,
  consolidated: (branch: string) => ["einvoices", "consolidated", branch] as const,
  selfBilled: (branch: string) => ["einvoices", "self-billed", branch] as const,
  seller: () => ["einvoices", "seller"] as const,
  users: () => ["users"] as const,
  catalogSearch: (query: string, branch: string) => ["catalog", "search", query, branch] as const,
};
