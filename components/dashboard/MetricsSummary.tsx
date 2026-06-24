import { Card, CardContent } from "@/components/ui/Card";
import { TrendingUp, FolderOpen, Wrench, Zap, CheckCircle2, XCircle } from "lucide-react";
import { formatLatency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  totalProjects: number;
  completedProjects: number;
  failedProjects: number;
  successRate: number;
  avgLatencyMs: number;
  totalRepairs: number;
}

interface MetricsSummaryProps {
  stats: Stats;
}

export function MetricsSummary({ stats }: MetricsSummaryProps) {
  const metrics = [
    {
      label: "Total Projects",
      value: stats.totalProjects.toString(),
      icon: FolderOpen,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-500/10",
    },
    {
      label: "Success Rate",
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: stats.successRate >= 70 ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400",
      bg: stats.successRate >= 70 ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10",
    },
    {
      label: "Avg Latency",
      value: formatLatency(stats.avgLatencyMs),
      icon: Zap,
      color: "text-violet-500 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-500/10",
    },
    {
      label: "Auto-Repairs",
      value: stats.totalRepairs.toString(),
      icon: Wrench,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-500/10",
    },
    {
      label: "Completed",
      value: stats.completedProjects.toString(),
      icon: CheckCircle2,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-500/10",
    },
    {
      label: "Failed",
      value: stats.failedProjects.toString(),
      icon: XCircle,
      color: "text-red-500 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card key={m.label} glow className="hover:scale-[1.02] transition-transform">
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", m.bg)}>
                <Icon className={cn("w-4 h-4", m.color)} />
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
