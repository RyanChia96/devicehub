import { formatRM } from "@/lib/money";
import { cn } from "@/lib/utils";

const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

/** Sales for the last 7 days, today highlighted. A table is offered for screen readers. */
export function WeekChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const total = values.reduce((a, v) => a + v, 0);

  return (
    <section aria-labelledby="week-chart" className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <h2 id="week-chart" className="text-[15px] font-semibold">
          Sales, last 7 days
        </h2>
        <span className="ml-auto text-[13px] text-muted-foreground">{formatRM(total)} total</span>
      </div>
      <div className="p-4">
        <div className="flex h-48 items-end gap-2.5 border-b" aria-hidden>
          {values.map((v, i) => (
            <div key={DAYS[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="tabular text-[11px] text-muted-foreground">{(v / 1000).toFixed(1)}k</span>
              <div
                className={cn("w-full max-w-11 rounded-t-md", i === values.length - 1 ? "bg-chart-1" : "bg-chart-2")}
                style={{ height: `${Math.max(2, (v / max) * 88)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 pt-2" aria-hidden>
          {DAYS.map((d) => (
            <div key={d} className="flex-1 text-center text-xs text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <table className="sr-only">
          <caption>Sales per day</caption>
          <tbody>
            {values.map((v, i) => (
              <tr key={DAYS[i]}>
                <th scope="row">{DAYS[i]}</th>
                <td>{formatRM(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
