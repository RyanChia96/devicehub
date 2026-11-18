import type { EinvStatus } from "@/api/einvoices";

export const STATUS_TONE: Record<EinvStatus, "success" | "info" | "error" | "secondary"> = {
  Valid: "success",
  Submitted: "info",
  Invalid: "error",
  Cancelled: "secondary",
};
