import { cn } from "@/lib/utils";

interface BarChartProps {
  title: string;
  labels: string[];
  values: number[];
  /** Index of the bar to emphasise (usually today or the current month). */
  highlight?: number;
  format: (value: number) => string;
  /** Short label above each bar. */
  short?: (value: number) => string;
  aside?: string;
}

/** Simple bar chart with a screen-reader table. Grey bars, the highlighted one in the accent. */
export function BarChart({ title, labels, values, highlight, format, short, aside }: BarChartProps) {
  const max = Math.max(...values, 1);
  const id = title.toLowerCase().replace(/\W+/g, "-");

  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <h2 id={id} className="text-[15px] font-semibold">
          {title}
        </h2>
        {aside && <span className="ml-auto text-[13px] text-muted-foreground">{aside}</span>}
      </div>
      <div className="p-4">
        <div className="flex h-48 items-end gap-2 border-b" aria-hidden>
          {values.map((v, i) => (
            <div key={labels[i]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              {short && <span className="tabular truncate text-[11px] text-muted-foreground">{short(v)}</span>}
              <div
                className={cn("w-full max-w-11 rounded-t-md", i === highlight ? "bg-chart-1" : "bg-chart-2")}
                style={{ height: `${Math.max(2, (v / max) * 88)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2" aria-hidden>
          {labels.map((l) => (
            <div key={l} className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">
              {l}
            </div>
          ))}
        </div>
        <table className="sr-only">
          <caption>{title}</caption>
          <tbody>
            {values.map((v, i) => (
              <tr key={labels[i]}>
                <th scope="row">{labels[i]}</th>
                <td>{format(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
