import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/api/dashboard";
import { getCurrentUser } from "@/api/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { branchName } from "@/lib/branches";
import { formatRM } from "@/lib/money";
import { QK } from "@/lib/query-keys";
import { usePos } from "@/sections/pos/pos-context";
import { WeekChart } from "@/sections/dashboard/WeekChart";

export default function Dashboard() {
  const { branch } = useBranch();
  const pos = usePos();
  const { data: user } = useQuery({ queryKey: QK.currentUser(), queryFn: getCurrentUser });
  const { data } = useQuery({ queryKey: QK.dashboard(branch), queryFn: () => getDashboard(branch) });
  const firstName = user?.name.split(" ").slice(1).join(" ") || user?.name || "";

  const change = data ? Math.round(((data.sales - data.lastWeek) / data.lastWeek) * 100) : 0;
  const kpis = data
    ? [
        { label: "Sales today", value: formatRM(data.sales), sub: `${change >= 0 ? "+" : "−"}${Math.abs(change)}% vs last Monday` },
        { label: "Transactions", value: String(data.transactions), sub: `${formatRM(data.sales / data.transactions)} average` },
        { label: "Trade-ins bought", value: String(data.tradeIns), sub: "Today" },
      ]
    : [];

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] text-muted-foreground">{branchName(branch)}</p>
        <PageHeader
          title={`Good morning, ${firstName}`}
          hideCrumbs
          actions={<Button onClick={pos.open}>New sale</Button>}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {kpis.map((k, i) => (
          <div key={k.label} className={i === 0 ? "pr-6" : "border-l px-6"}>
            <div className="text-[13px] font-medium text-muted-foreground">{k.label}</div>
            <div className="tabular mt-1 text-[26px]/8 font-semibold">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {data && <WeekChart values={data.week} />}
    </>
  );
}
