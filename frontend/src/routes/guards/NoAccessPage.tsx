import { EmptyState } from "@/components/EmptyState";

export function NoAccessPage() {
  return (
    <EmptyState
      title="This page isn't part of your role"
      description="Ask the owner if you need access."
    />
  );
}
