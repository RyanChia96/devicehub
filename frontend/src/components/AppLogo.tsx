export function AppLogo({ showName = true }: { showName?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
        DH
      </span>
      {showName && <span className="text-[15px] font-semibold">DeviceHub</span>}
    </span>
  );
}
