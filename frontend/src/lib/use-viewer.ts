import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { QK } from "@/lib/query-keys";
import type { Viewer } from "./access";

export function useViewer(): { viewer: Viewer; isLoading: boolean } {
  const { data, isLoading } = useQuery({ queryKey: QK.currentUser(), queryFn: getCurrentUser });
  return { viewer: { role: data?.role ?? "Owner" }, isLoading };
}
