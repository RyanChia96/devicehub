/** Plain figures with thin dividers between them (no cards). */
export function StatRow({ stats }: { stats: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-4">
      {stats.map((s, i) => (
        <div key={s.label} className={i === 0 ? "pr-6" : "border-l px-6"}>
          <div className="text-[13px] font-medium text-muted-foreground">{s.label}</div>
          <div className="tabular mt-1 text-[26px]/8 font-semibold">{s.value}</div>
          {s.sub && <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
