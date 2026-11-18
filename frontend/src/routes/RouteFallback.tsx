/** Shown while a lazily loaded page downloads. Matches the page head so nothing jumps. */
export function RouteFallback() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      <div className="mt-6 h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
